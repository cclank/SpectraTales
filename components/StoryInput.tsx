import React, { useState, useRef, useEffect } from 'react';
import { TEMPLATES, VisualComplexity, StoryMode, StoryboardData, Gender } from '../types';
import { Wand2, BookOpen, PenTool, Star, Zap, Layout, Sparkles, Library, ArrowRight, History, Calendar, Smile, User } from 'lucide-react';

interface Props {
  onGenerate: (text: string, complexity: VisualComplexity, gender: Gender) => void;
  isLoading: boolean;
  history?: StoryboardData[];
  onSelectHistory?: (story: StoryboardData) => void;
}

const SHOWCASE_EXAMPLES = [
  {
    title: "Going to the Dentist",
    icon: "🦷",
    colors: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", accent: "bg-blue-500" },
    category: "Health & Safety",
    complexity: VisualComplexity.BALANCED,
    text: "Today I am going to the dentist. The dentist helps keep my teeth clean. I sit in a big chair. The dentist asks me to open my mouth wide. I say 'Ahhh'. The dentist counts my teeth. It tickles a little. When we are done, I get a sticker. Going to the dentist makes my smile bright."
  },
  {
    title: "Losing a Game",
    icon: "🎲",
    colors: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", accent: "bg-purple-500" },
    category: "Emotional Regulation",
    complexity: VisualComplexity.RICH,
    text: "Sam is playing a board game with his sister. His sister wins the game. Sam feels his face get hot. He wants to throw the dice. Sam stops and takes a deep breath. He says 'Good game'. Winning is fun, but playing together is the best part."
  },
  {
    title: "The Fire Drill",
    icon: "🔔",
    colors: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", accent: "bg-red-500" },
    category: "Safety Procedures",
    complexity: VisualComplexity.MINIMAL,
    text: "Sometimes there is a loud noise at school. It is the fire alarm. It goes BEEEEP. It is very loud, but I am safe. I stand up and line up at the door. I follow my teacher outside. We wait quietly. When the noise stops, we go back inside. Good job!"
  },
  {
    title: "Trying New Food",
    icon: "🥦",
    colors: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", accent: "bg-green-500" },
    category: "Flexibility",
    complexity: VisualComplexity.BALANCED,
    text: "There is something new on my plate. It is green broccoli. It looks funny. I do not have to eat it all. I can smell it first. I can touch it with my fork. I can try one small bite. If I don't like it, I can say 'No thank you'. Trying new foods is brave."
  },
  {
    title: "Asking to Play",
    icon: "⚽",
    colors: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", accent: "bg-orange-500" },
    category: "Social Skills",
    complexity: VisualComplexity.BALANCED,
    text: "I see kids playing soccer. I want to play too. I walk over to them. I wait for a break in the game. I look at one friend and ask, 'Can I play?'. They say 'Yes!'. I feel happy joining in. If they say 'Not now', I can find something else to do."
  },
  {
    title: "Washing Hands",
    icon: "🧼",
    colors: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", accent: "bg-cyan-500" },
    category: "Daily Routines",
    complexity: VisualComplexity.MINIMAL,
    text: "My hands have germs. Germs can make me sick. I turn on the water. I get soap. I rub my hands together. Scrub, scrub, scrub! I sing the ABC song while I scrub. I rinse the bubbles off. I dry my hands with a towel. Now my hands are clean and safe."
  }
];

const StoryInput: React.FC<Props> = ({ onGenerate, isLoading, history = [], onSelectHistory }) => {
  const [mode, setMode] = useState<StoryMode>(StoryMode.TEMPLATE);
  const [customText, setCustomText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [complexity, setComplexity] = useState<VisualComplexity>(VisualComplexity.BALANCED);
  const [gender, setGender] = useState<Gender>('boy');
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Emojis mapping for templates
  const getTemplateIcon = (id: string) => {
    switch(id) {
      case 'sharing': return '🧸';
      case 'calm_down': return '🧘';
      case 'greeting': return '👋';
      default: return '📖';
    }
  };

  const handleModeChange = (newMode: StoryMode) => {
    setMode(newMode);
    // If switching to Custom, focus the textarea after render
    if (newMode === StoryMode.CUSTOM) {
      setTimeout(() => textAreaRef.current?.focus(), 100);
    }
  };

  const handleSubmit = () => {
    console.log("Submitting story...", { mode, customText, template: selectedTemplate.title });
    const text = mode === StoryMode.CUSTOM ? customText : selectedTemplate.text;
    if (!text.trim()) return;
    onGenerate(text, complexity, gender);
  };

  const handleLoadShowcase = (example: typeof SHOWCASE_EXAMPLES[0]) => {
    setMode(StoryMode.CUSTOM);
    setCustomText(example.text);
    setComplexity(example.complexity);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {/* Intro Banner */}
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-800 mb-4 text-shadow-sm">
          Let's Make a Story! 🎨
        </h2>
        <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
          Create a personalized social story in seconds. Just pick a topic or write your own!
        </p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-comic border-4 border-slate-100 overflow-hidden">
        
        {/* Step 1: Choose Mode */}
        <div className="p-6 md:p-8 bg-fun-bg border-b-4 border-slate-100">
          <label className="block text-xl font-display font-bold text-slate-700 mb-6 flex items-center gap-2">
            <span className="bg-fun-yellow text-slate-800 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm border-2 border-white">1</span>
            How do you want to start?
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleModeChange(StoryMode.TEMPLATE)}
              className={`relative p-6 rounded-3xl border-4 text-left transition-all transform ${
                mode === StoryMode.TEMPLATE
                  ? 'bg-white border-fun-sky shadow-comic scale-[1.02] z-10'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-fun-sky/50'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${mode === StoryMode.TEMPLATE ? 'bg-fun-sky text-white' : 'bg-slate-200 text-slate-400'}`}>
                <BookOpen size={28} strokeWidth={2.5} />
              </div>
              <h3 className={`text-xl font-bold mb-1 ${mode === StoryMode.TEMPLATE ? 'text-slate-800' : 'text-slate-500'}`}>Pick a Topic</h3>
              <p className="text-sm font-bold opacity-80">Use our ready-made themes like sharing, waiting, or greeting.</p>
              {mode === StoryMode.TEMPLATE && <div className="absolute top-4 right-4 text-fun-sky"><Star size={24} fill="currentColor" /></div>}
            </button>

            <button
              onClick={() => handleModeChange(StoryMode.CUSTOM)}
              className={`relative p-6 rounded-3xl border-4 text-left transition-all transform ${
                mode === StoryMode.CUSTOM
                  ? 'bg-white border-fun-pink shadow-comic scale-[1.02] z-10'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-fun-pink/50'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${mode === StoryMode.CUSTOM ? 'bg-fun-pink text-white' : 'bg-slate-200 text-slate-400'}`}>
                <PenTool size={28} strokeWidth={2.5} />
              </div>
              <h3 className={`text-xl font-bold mb-1 ${mode === StoryMode.CUSTOM ? 'text-slate-800' : 'text-slate-500'}`}>Write My Own</h3>
              <p className="text-sm font-bold opacity-80">Paste a specific scenario or write a custom story text.</p>
              {mode === StoryMode.CUSTOM && <div className="absolute top-4 right-4 text-fun-pink"><Star size={24} fill="currentColor" /></div>}
            </button>
          </div>
        </div>

        {/* Step 2: Input Content */}
        <div className="p-6 md:p-8 border-b-4 border-slate-100 relative">
           <label className="block text-xl font-display font-bold text-slate-700 mb-6 flex items-center gap-2">
            <span className="bg-fun-orange text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm border-2 border-white">2</span>
            {mode === StoryMode.TEMPLATE ? 'Choose a Theme' : 'Type your Story'}
          </label>

          {mode === StoryMode.TEMPLATE ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`p-4 rounded-2xl border-4 transition-all text-center group ${
                      selectedTemplate.id === t.id
                        ? 'bg-fun-yellow/10 border-fun-yellow shadow-comic scale-[1.02]'
                        : 'bg-white border-slate-200 hover:border-fun-yellow/50'
                    }`}
                  >
                    <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      {getTemplateIcon(t.id)}
                    </div>
                    <div className="font-bold text-slate-800 mb-1">{t.title}</div>
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 border-dashed relative">
                <div className="absolute -top-3 left-6 bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Story Preview
                </div>
                <p className="text-slate-600 font-medium italic text-lg leading-relaxed">
                  "{selectedTemplate.text}"
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <textarea
                ref={textAreaRef}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Start typing here... Example: 'Tom wants the toy train, but Sally is playing with it. Tom takes a deep breath and asks nicely...'"
                className="w-full h-48 p-6 text-lg border-4 border-slate-300 rounded-3xl bg-slate-50 focus:bg-white focus:border-fun-pink focus:ring-4 focus:ring-fun-pink/10 outline-none resize-none transition-all placeholder:text-slate-400 font-medium text-slate-800 caret-pink-500"
              />
              <div className="mt-2 text-right">
                <span className={`text-sm font-bold ${!customText ? 'text-slate-400' : 'text-fun-pink'}`}>
                  {customText.length > 0 ? 'Ready to go!' : 'Please enter your story text above'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Main Character (New) */}
        <div className="p-6 md:p-8 bg-slate-50 border-b-4 border-slate-100">
          <label className="block text-xl font-display font-bold text-slate-700 mb-6 flex items-center gap-2">
            <span className="bg-fun-pink text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm border-2 border-white">3</span>
            Who is the hero?
          </label>
          
          <div className="flex gap-4">
            <button
              onClick={() => setGender('boy')}
              className={`flex-1 p-4 rounded-2xl border-4 transition-all flex items-center justify-center gap-3 ${
                gender === 'boy'
                  ? 'bg-white border-blue-400 shadow-comic scale-[1.02] z-10'
                  : 'bg-white border-slate-200 hover:border-blue-200'
              }`}
            >
              <div className="text-3xl">👦</div>
              <span className="font-bold text-lg text-slate-700">Boy</span>
              {gender === 'boy' && <div className="text-blue-500"><Smile size={20} /></div>}
            </button>
            
            <button
              onClick={() => setGender('girl')}
              className={`flex-1 p-4 rounded-2xl border-4 transition-all flex items-center justify-center gap-3 ${
                gender === 'girl'
                  ? 'bg-white border-pink-400 shadow-comic scale-[1.02] z-10'
                  : 'bg-white border-slate-200 hover:border-pink-200'
              }`}
            >
              <div className="text-3xl">👧</div>
              <span className="font-bold text-lg text-slate-700">Girl</span>
              {gender === 'girl' && <div className="text-pink-500"><Smile size={20} /></div>}
            </button>
          </div>
        </div>

        {/* Step 4: Complexity */}
        <div className="p-6 md:p-8 bg-white border-t-4 border-slate-100">
          <label className="block text-xl font-display font-bold text-slate-700 mb-6 flex items-center gap-2">
            <span className="bg-fun-mint text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm border-2 border-white">4</span>
            Choose Visual Style
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[VisualComplexity.MINIMAL, VisualComplexity.BALANCED, VisualComplexity.RICH].map((level) => (
              <button
                key={level}
                onClick={() => setComplexity(level)}
                className={`p-4 rounded-2xl border-4 flex flex-col items-center transition-all ${
                  complexity === level
                    ? 'bg-fun-bg border-fun-purple shadow-comic scale-[1.02] z-10'
                    : 'bg-white border-slate-200 hover:border-fun-purple/50 opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center ${
                  complexity === level ? 'bg-fun-purple text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {level === VisualComplexity.MINIMAL && <Layout size={24} />}
                  {level === VisualComplexity.BALANCED && <Zap size={24} />}
                  {level === VisualComplexity.RICH && <Sparkles size={24} />}
                </div>
                <span className="font-bold text-slate-800">{level}</span>
                <span className="text-xs text-slate-500 font-bold mt-1 text-center">
                  {level === VisualComplexity.MINIMAL && "Simple & Clear"}
                  {level === VisualComplexity.BALANCED && "Standard Detail"}
                  {level === VisualComplexity.RICH && "Full Backgrounds"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Area */}
        <div className="p-6 md:p-8 border-t-4 border-slate-100 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isLoading || (mode === StoryMode.CUSTOM && !customText.trim())}
            className="w-full bg-fun-sky hover:bg-fun-sky/90 disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 text-white font-display font-bold text-xl py-5 rounded-2xl shadow-comic hover:shadow-comic-hover active:shadow-comic-active active:translate-y-1 transition-all flex items-center justify-center space-x-3"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-4 border-white"></div>
                <span>Dreaming up your story...</span>
              </>
            ) : (
              <>
                <Wand2 size={28} strokeWidth={2.5} />
                <span>Create Magic Storybook!</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* History Showcase - NEW SECTION */}
      {history.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center space-x-3 mb-6 justify-center md:justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100">
               <History size={24} className="text-fun-pink" />
            </div>
            <h3 className="text-3xl font-display font-bold text-slate-800">
              Your Story Collection
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {history.map((story) => (
              <button
                key={story.uid}
                onClick={() => onSelectHistory?.(story)}
                className="group bg-white p-5 rounded-3xl border-4 border-slate-100 hover:border-fun-pink hover:shadow-comic transition-all text-left flex flex-col relative overflow-hidden"
              >
                 {/* Preview Image or Placeholder */}
                 <div className="w-full h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden border-2 border-slate-50 relative">
                    {story.pages[0]?.image_url ? (
                      <img src={story.pages[0].image_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Sparkles size={32} />
                      </div>
                    )}
                    {/* Timestamp Badge */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1 shadow-sm">
                      <Calendar size={10} />
                      {formatDate(story.createdAt)}
                    </div>
                 </div>

                 <h4 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-fun-pink transition-colors">
                   {story.title}
                 </h4>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 line-clamp-1">
                   {story.purpose.split(':')[0]}
                 </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Library Showcase */}
      <div>
        <div className="flex items-center space-x-3 mb-8 justify-center md:justify-start">
          <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100">
             <Library size={24} className="text-fun-purple" />
          </div>
          <h3 className="text-3xl font-display font-bold text-slate-800">
            Explore Our Story Library
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHOWCASE_EXAMPLES.map((story, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadShowcase(story)}
              className={`group bg-white p-6 rounded-3xl border-4 transition-all text-left flex flex-col md:flex-row gap-6 relative overflow-hidden ${story.colors.border} hover:shadow-comic hover:scale-[1.01]`}
            >
               {/* Decorative Circle */}
               <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 ${story.colors.accent}`}></div>

               {/* Icon */}
               <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl flex items-center justify-center text-4xl shadow-sm border-2 border-white/50 ${story.colors.bg} ${story.colors.text}`}>
                 {story.icon}
               </div>

               <div className="flex flex-col flex-grow z-10">
                 <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-white/50 border border-black/5 ${story.colors.text}`}>
                        {story.category}
                      </span>
                      <h4 className="text-xl font-bold text-slate-800 mt-2 group-hover:text-fun-sky transition-colors">
                        {story.title}
                      </h4>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-fun-sky transform group-hover:translate-x-1 transition-all" size={24} />
                 </div>
                 <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed">
                   "{story.text}"
                 </p>
                 <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Style:</span>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{story.complexity}</span>
                 </div>
               </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryInput;