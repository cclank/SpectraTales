import React, { useState, useEffect } from 'react';
import StoryInput from './components/StoryInput';
import BookPreview from './components/BookPreview';
import { generateStoryboard, generatePageImage } from './services/geminiService';
import { generatePDF } from './utils/pdfGenerator';
import { StoryboardData, VisualComplexity, Gender } from './types';
import { Sparkles, Github } from 'lucide-react';
import { getHistoryFromDB, saveStoryToDB } from './services/storageService';

const App: React.FC = () => {
  const [story, setStory] = useState<StoryboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [complexity, setComplexity] = useState<VisualComplexity>(VisualComplexity.BALANCED);
  const [history, setHistory] = useState<StoryboardData[]>([]);

  // Load history from IndexedDB on mount
  useEffect(() => {
    const loadHistory = async () => {
      const saved = await getHistoryFromDB();
      setHistory(saved);
    };
    loadHistory();
  }, []);

  // Automatic Persistence Effect
  useEffect(() => {
    if (story) {
      saveStoryToDB(story).catch(e => console.warn("Auto-save failed", e));
      setHistory(prev => {
        const exists = prev.some(h => h.uid === story.uid);
        if (exists) {
          return prev.map(h => h.uid === story.uid ? story : h);
        }
        return [story, ...prev];
      });
    }
  }, [story]);

  // Phase 1: Generate Storyboard Structure
  const handleGenerateStory = async (text: string, selectedComplexity: VisualComplexity, gender: Gender) => {
    setLoading(true);
    setComplexity(selectedComplexity);
    try {
      const storyboard = await generateStoryboard(text, selectedComplexity, gender);
      
      const pagesWithState = storyboard.pages.map(p => ({
        ...p,
        is_generating: true,
        image_url: undefined,
        error: undefined
      }));
      
      const fullStory = { ...storyboard, pages: pagesWithState };
      setStory(fullStory);
      setLoading(false);

      // Phase 2: Kick off image generation sequentially
      generateImagesSequence(fullStory, selectedComplexity);

    } catch (error) {
      console.error("Failed to generate story", error);
      alert("Something went wrong generating the story structure. Please try again.");
      setLoading(false);
    }
  };

  // Helper to process images one by one with MULTI-REFERENCE + GLOBAL PROMPT logic
  const generateImagesSequence = async (initialStory: StoryboardData, comp: VisualComplexity) => {
    
    // Local cache of generated images to use as references immediately
    const generatedImagesMap = new Map<number, string>();
    const firstPageId = initialStory.pages[0]?.id;

    for (const page of initialStory.pages) {
      try {
        // Build Reference Array
        const refs: string[] = [];

        // 1. ANCHOR: Always include Page 1 if it exists and we are not currently generating Page 1
        if (firstPageId !== undefined && generatedImagesMap.has(firstPageId) && page.id !== firstPageId) {
            refs.push(generatedImagesMap.get(firstPageId)!);
        }

        // 2. CONTEXT: Include the immediate previous page if it exists
        const prevPageId = page.id - 1;
        if (generatedImagesMap.has(prevPageId) && prevPageId !== firstPageId) {
             refs.push(generatedImagesMap.get(prevPageId)!);
        }

        const imageUrl = await generatePageImage(
            page.action_description, 
            {
              globalPrompt: initialStory.visual_style_guide,
              blueprint: initialStory.character_blueprint,
              complexity: comp
            },
            refs
        );
        
        // Store for future references
        generatedImagesMap.set(page.id, imageUrl);

        setStory(prev => {
          if (!prev || prev.uid !== initialStory.uid) return prev;
          return {
            ...prev,
            pages: prev.pages.map(p => 
              p.id === page.id ? { ...p, image_url: imageUrl, is_generating: false } : p
            )
          };
        });

      } catch (err) {
        console.error(`Failed to generate image for page ${page.id}`, err);
        setStory(prev => {
          if (!prev || prev.uid !== initialStory.uid) return prev;
          return {
            ...prev,
            pages: prev.pages.map(p => 
              p.id === page.id ? { ...p, is_generating: false, error: "Failed to load image" } : p
            )
          };
        });
      }
    }
  };

  const handleRegenerateImage = async (pageId: number) => {
    if (!story) return;

    setStory(prev => {
        if (!prev) return null;
        return {
            ...prev,
            pages: prev.pages.map(p => p.id === pageId ? { ...p, is_generating: true, error: undefined } : p)
        }
    });

    const page = story.pages.find(p => p.id === pageId);
    if (!page) return;

    // Collect references from existing state
    const refs: string[] = [];
    const firstPage = story.pages[0];

    // 1. Anchor Reference
    if (firstPage && firstPage.image_url && firstPage.id !== pageId) {
        refs.push(firstPage.image_url);
    }

    // 2. Previous Page Reference
    const prevPage = story.pages.find(p => p.id === pageId - 1);
    if (prevPage && prevPage.image_url && prevPage.id !== firstPage?.id) {
        refs.push(prevPage.image_url);
    }

    try {
      const imageUrl = await generatePageImage(
          page.action_description, 
          {
            globalPrompt: story.visual_style_guide,
            blueprint: story.character_blueprint,
            complexity: complexity
          },
          refs
      );
      
      setStory(prev => {
          if (!prev) return null;
          return {
            ...prev,
            pages: prev.pages.map(p => p.id === pageId ? { ...p, image_url: imageUrl, is_generating: false } : p)
          };
      });

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

          <a 
            href="https://github.com/cclank/SpectraTales" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-fun-bg border-2 border-fun-yellow px-4 py-2 rounded-full hover:bg-white hover:shadow-sm transition-all group"
          >
            <span className="text-sm font-bold text-slate-600 group-hover:text-fun-pink">Created by 岚叔</span>
            <Github size={20} className="text-slate-600 group-hover:text-fun-pink" />
          </a>
        </div>
      </header>

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
