import React, { useState, useEffect } from 'react';
import StoryInput from './components/StoryInput';
import BookPreview from './components/BookPreview';
import { generateStoryboard, generatePageImage } from './services/geminiService';
import { generatePDF } from './utils/pdfGenerator';
import { StoryboardData, VisualComplexity } from './types';
import { Sparkles, Heart } from 'lucide-react';

const STORAGE_KEY = 'spectra_history';

const App: React.FC = () => {
  const [story, setStory] = useState<StoryboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [complexity, setComplexity] = useState<VisualComplexity>(VisualComplexity.BALANCED);
  const [history, setHistory] = useState<StoryboardData[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Safe storage handler that manages quota limits
  const saveToHistory = (newStory: StoryboardData, currentHistory: StoryboardData[]) => {
    // Check if story already exists in history (update case)
    let updatedHistory = currentHistory.some(h => h.uid === newStory.uid)
      ? currentHistory.map(h => h.uid === newStory.uid ? newStory : h)
      : [newStory, ...currentHistory];

    setHistory(updatedHistory);

    // Try saving to localStorage, pop oldest if quota exceeded
    const trySave = (data: StoryboardData[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        if (e instanceof DOMException && (
          e.name === 'QuotaExceededError' || 
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
        ) {
          if (data.length > 1) {
            // Remove the last (oldest) item and try again
            // We keep the first one (newest) at minimum
            console.warn("Storage quota exceeded, removing oldest story");
            trySave(data.slice(0, -1));
            // Update state to match what is actually saved
            setHistory(data.slice(0, -1));
          } else {
             console.error("Cannot save even one story, storage is full");
          }
        }
      }
    };

    trySave(updatedHistory);
  };

  // Phase 1: Generate Storyboard Structure
  const handleGenerateStory = async (text: string, selectedComplexity: VisualComplexity) => {
    setLoading(true);
    setComplexity(selectedComplexity);
    try {
      const storyboard = await generateStoryboard(text, selectedComplexity);
      
      // Initialize image states
      const pagesWithState = storyboard.pages.map(p => ({
        ...p,
        is_generating: true, // Mark as loading initially for auto-start
        image_url: undefined,
        error: undefined
      }));
      
      const fullStory = { ...storyboard, pages: pagesWithState };
      
      setStory(fullStory);
      saveToHistory(fullStory, history);
      
      setLoading(false);

      // Phase 2: Kick off image generation sequentially
      generateImagesSequence(fullStory, selectedComplexity);

    } catch (error) {
      console.error("Failed to generate story", error);
      alert("Something went wrong generating the story structure. Please try again.");
      setLoading(false);
    }
  };

  // Helper to process images one by one
  const generateImagesSequence = async (currentStory: StoryboardData, comp: VisualComplexity) => {
    // We need a local ref to the latest story state to chain updates correctly
    let runningStory = currentStory;

    for (const page of currentStory.pages) {
      try {
        const imageUrl = await generatePageImage(page.action_description, currentStory.character_blueprint, comp);
        
        // Update local ref
        runningStory = {
          ...runningStory,
          pages: runningStory.pages.map(p => 
            p.id === page.id ? { ...p, image_url: imageUrl, is_generating: false } : p
          )
        };

        // Update UI and Storage
        setStory(runningStory);
        // We use function update for history to ensure we don't overwrite concurrent changes (unlikely here but good practice)
        setHistory(prev => {
           const newHistory = prev.map(h => h.uid === runningStory.uid ? runningStory : h);
           // We re-save to local storage here to persist the image
           // Note: This might be heavy, but ensures if user closes tab, images are saved
           try {
             localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
           } catch(e) {
             // If this specific save fails, we don't want to crash or delete history yet, just warn
             console.warn("Could not persist image update to storage (likely quota)");
           }
           return newHistory;
        });

      } catch (err) {
        runningStory = {
          ...runningStory,
          pages: runningStory.pages.map(p => 
            p.id === page.id ? { ...p, is_generating: false, error: "Failed to load image" } : p
          )
        };
        setStory(runningStory);
      }
    }
  };

  const handleRegenerateImage = async (pageId: number) => {
    if (!story) return;

    // Set loading state
    const loadingStory = {
      ...story,
      pages: story.pages.map(p => p.id === pageId ? { ...p, is_generating: true, error: undefined } : p)
    };
    setStory(loadingStory);

    const page = story.pages.find(p => p.id === pageId);
    if (!page) return;

    try {
      const imageUrl = await generatePageImage(page.action_description, story.character_blueprint, complexity);
      const updatedStory = {
        ...story,
        pages: story.pages.map(p => p.id === pageId ? { ...p, image_url: imageUrl, is_generating: false } : p)
      };
      
      setStory(updatedStory);
      saveToHistory(updatedStory, history);

    } catch (error) {
       setStory(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pages: prev.pages.map(p => p.id === pageId ? { ...p, is_generating: false, error: "Retry failed" } : p)
        };
      });
    }
  };

  const handleDownloadPDF = () => {
    if (story) {
      generatePDF(story);
    }
  };

  const handleSelectHistory = (selectedStory: StoryboardData) => {
    setStory(selectedStory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 font-sans">
      {/* Playful Header */}
      <header className="bg-white/80 backdrop-blur-md border-b-4 border-fun-yellow sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center space-x-3 group cursor-default">
            <div className="bg-fun-pink text-white p-3 rounded-2xl shadow-comic transform group-hover:rotate-12 transition-transform">
              <Sparkles size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-800 tracking-wide">
                Spectra<span className="text-fun-sky">Tales</span>
              </h1>
              <p className="text-xs font-bold text-fun-purple uppercase tracking-widest hidden sm:block">
                Social Stories for Super Kids
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 bg-fun-bg border-2 border-fun-yellow px-4 py-2 rounded-full">
            <Heart size={16} className="text-fun-pink fill-fun-pink animate-pulse" />
            <span className="text-sm font-bold text-slate-600">Made with Love & AI</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!story ? (
          <StoryInput 
            onGenerate={handleGenerateStory} 
            isLoading={loading} 
            history={history}
            onSelectHistory={handleSelectHistory}
          />
        ) : (
          <BookPreview 
            story={story} 
            onRegenerateImage={handleRegenerateImage}
            onDownload={handleDownloadPDF}
            onReset={() => setStory(null)}
            complexity={complexity}
          />
        )}
      </main>
    </div>
  );
};

export default App;