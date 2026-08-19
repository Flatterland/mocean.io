import React from 'react';
import { X, LayoutTemplate, Sparkles, ArrowRight } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { PROJECT_TEMPLATES } from '../../templates/projectTemplates';

export const TemplatesModal: React.FC = () => {
  const {
    isTemplatesModalOpen,
    setTemplatesModalOpen,
    loadTemplate,
  } = useProjectStore();

  if (!isTemplatesModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#11131a] border border-[#222734] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#222734] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Motion Graphics Templates</h2>
              <span className="text-[11px] text-slate-400">
                Kickstart your kinetic project with hand-crafted motion scenes
              </span>
            </div>
          </div>

          <button
            onClick={() => setTemplatesModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-4">
          {PROJECT_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => loadTemplate(tmpl.id)}
              className="group p-4 rounded-xl bg-[#181b24] hover:bg-[#1f2330] border border-[#222734] hover:border-indigo-500/80 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Banner Gradient */}
              <div
                className={`h-24 rounded-lg bg-gradient-to-br ${tmpl.thumbnailGradient} flex items-center justify-center p-3 text-center shadow-inner relative overflow-hidden group-hover:scale-[1.02] transition-transform`}
              >
                <span className="font-extrabold text-white text-base tracking-wider drop-shadow-md">
                  {tmpl.name}
                </span>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-mono text-white/90 backdrop-blur-xs">
                  {tmpl.canvas.aspectRatio}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {tmpl.name}
                  </h3>
                  <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                    {tmpl.canvas.preset}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-[#222734] flex items-center justify-between text-[11px] text-slate-500">
                <span>{tmpl.layers.length} Layers • {tmpl.canvas.duration}s</span>
                <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                  Load <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
