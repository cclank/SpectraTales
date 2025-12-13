import React from 'react';
import { StoryboardData, StoryPage, VisualComplexity } from '../types';
import { RefreshCw, Download, ArrowLeft, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface Props {
  story: StoryboardData;
  onRegenerateImage: (pageId: number) => void;
  onDownload: () => void;
  onReset: () => void;
  complexity: VisualComplexity;
}

const BookPreview: React.FC<Props> = ({ story, onRegenerateImage, onDownload, onReset, complexity }) => {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Navigation & Actions */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button 
            onClick={onReset}
            className="group flex items-center space-x-2 text-slate-500 hover:text-fun-sky font-bold mb-3 transition-colors px-2"
          >
            <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200 group-hover:border-fun-sky">
               <ArrowLeft size={18} />
            </div>
            <span>Make Another Story</span>
          </button>
          
          <h2 className="text-4xl font-display font-bold text-slate-800 text-shadow-sm leading-tight">
            {story.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-fun-yellow/20 text-slate-700 border border-fun-yellow rounded-full text-xs font-bold uppercase tracking-wider">
              Age {story.character_blueprint.age}
            </span>
             <span className="px-3 py-1 bg-fun-mint/20 text-slate-700 border border-fun-mint rounded-full text-xs font-bold uppercase tracking-wider">
              {story.purpose.split(':')[0]}
            </span>
          </div>
        </div>

        <button
          onClick={onDownload}
          className="bg-fun-mint hover:bg-green-500 text-white text-lg px-8 py-4 rounded-2xl font-display font-bold flex items-center space-x-2 shadow-comic hover:shadow-comic-hover active:translate-y-1 transition-all"
        >
          <Download size={24} strokeWidth={2.5} />
          <span>Save PDF</span>
        </button>
      </div>

      {/* Book Container */}
      <div className="grid grid-cols-1 gap-12 mb-16">
        {story.pages.map((page: StoryPage, index: number) => (
          <div key={page.id} className="relative">
            {/* Page Number Badge */}
            <div className="absolute -left-3 -top-3 w-10 h-10 bg-fun-orange text-white font-display font-bold text-xl rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
              {index + 1}
            </div>

            <div className="bg-white rounded-3xl shadow-comic border-4 border-slate-100 overflow-hidden flex flex-col md:flex-row">
              
              {/* Image Side */}
              <div className="w-full md:w-1/2 aspect-square relative bg-slate-50 border-b-4 md:border-b-0 md:border-r-4 border-slate-100 group">
                {page.image_url ? (
                  <img 
                    src={page.image_url} 
                    alt={`Page ${page.id}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-8">
                    {page.is_generating ? (
                      <div className="flex flex-col items-center z-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-fun-sky mb-4"></div>
                        <span className="text-fun-sky font-bold animate-pulse mb-3">Painting...</span>
                        <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             onRegenerateImage(page.id);
                           }}
                           className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-400 hover:text-fun-pink hover:border-fun-pink transition-all shadow-sm"
                        >
                          Stuck? Retry
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={64} className="mb-4 opacity-50" />
                        <span className="font-bold">Waiting for magic</span>
                        {page.error && (
                           <button 
                             onClick={() => onRegenerateImage(page.id)}
                             className="mt-2 text-fun-pink underline font-bold"
                           >
                             Retry Failed Image
                           </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Regenerate Button (Hover) */}
                {!page.is_generating && page.image_url && (
                  <div className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => onRegenerateImage(page.id)}
                      className="bg-white hover:bg-fun-pink hover:text-white text-slate-700 p-3 rounded-xl shadow-lg border-2 border-slate-100 transition-colors"
                      title="Redraw this picture"
                    >
                      <RefreshCw size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>

              {/* Text Side */}
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-fun-yellow/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-fun-sky/10 rounded-full -ml-12 -mb-12"></div>

                <div className="relative z-10">
                  <p className="text-2xl md:text-3xl font-sans font-semibold text-slate-800 leading-snug text-center md:text-left mb-6">
                    {page.text}
                  </p>
                  
                  <div className="bg-fun-bg rounded-xl p-4 border-2 border-slate-100">
                    <h5 className="text-xs font-bold text-fun-purple uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Visual Cue
                    </h5>
                    <p className="text-sm text-slate-600 font-medium">
                      {page.action_description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Info */}
      <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300 text-center opacity-70 hover:opacity-100 transition-opacity">
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Character Blueprint</p>
        <div className="flex justify-center gap-4 text-sm text-slate-700 font-medium flex-wrap">
           <span className="bg-slate-100 px-3 py-1 rounded-full">{story.character_blueprint.hair} Hair</span>
           <span className="bg-slate-100 px-3 py-1 rounded-full">{story.character_blueprint.clothing}</span>
           <span className="bg-slate-100 px-3 py-1 rounded-full">{story.character_blueprint.skin_tone} Skin</span>
           <span className="bg-slate-100 px-3 py-1 rounded-full">{complexity} Style</span>
        </div>
      </div>
    </div>
  );
};

export default BookPreview;