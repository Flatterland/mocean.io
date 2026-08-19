import React from 'react';
import { Type, Sparkles, Wand2, Terminal, Zap, Film } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { MotionPresetType } from '../../types/animation';

interface TextPresetButton {
  title: string;
  preset: MotionPresetType;
  font: string;
  weight: string;
  description: string;
  previewClass: string;
  icon: React.ReactNode;
}

const TEXT_QUICK_PRESETS: TextPresetButton[] = [
  {
    title: 'Kinetic Pop',
    preset: 'text_kinetic_pop',
    font: 'Montserrat',
    weight: '900',
    description: 'Punchy elastic upward bounce with character stagger',
    previewClass: 'from-blue-400 to-indigo-500 font-extrabold tracking-wider',
    icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
  },
  {
    title: 'Word Stagger Rise',
    preset: 'text_word_stagger_up',
    font: 'Space Grotesk',
    weight: '700',
    description: 'Smooth staggered slide up per individual word',
    previewClass: 'from-cyan-400 to-blue-500 font-bold',
    icon: <Wand2 className="w-4 h-4 text-cyan-400" />,
  },
  {
    title: 'Typewriter Cursor',
    preset: 'text_typewriter',
    font: 'JetBrains Mono',
    weight: '700',
    description: 'Terminal character typing simulation',
    previewClass: 'from-emerald-400 to-teal-500 font-mono',
    icon: <Terminal className="w-4 h-4 text-emerald-400" />,
  },
  {
    title: 'Letter Spring Bounce',
    preset: 'text_letter_bounce',
    font: 'Outfit',
    weight: '800',
    description: 'Playful bouncy elastic drop for every letter',
    previewClass: 'from-amber-400 to-pink-500 font-extrabold',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
  },
  {
    title: 'Cinematic Blur Reveal',
    preset: 'text_blur_flare_in',
    font: 'Playfair Display',
    weight: '600',
    description: 'High-end movie title blur to crisp focus',
    previewClass: 'from-purple-300 to-pink-400 italic',
    icon: <Film className="w-4 h-4 text-purple-400" />,
  },
  {
    title: 'Cyber Glitch Reveal',
    preset: 'text_glitch_reveal',
    font: 'JetBrains Mono',
    weight: '900',
    description: 'High-energy digital flicker & RGB glitch offset',
    previewClass: 'from-pink-500 to-cyan-400 font-mono tracking-widest',
    icon: <Zap className="w-4 h-4 text-pink-400" />,
  },
  {
    title: '3D Flip Drop',
    preset: 'text_flip_drop',
    font: 'Bebas Neue',
    weight: '900',
    description: 'Perspective 3D tumbling entry',
    previewClass: 'from-yellow-400 to-orange-500 tracking-wider',
    icon: <Wand2 className="w-4 h-4 text-orange-400" />,
  },
  {
    title: 'Elastic Zoom Boom',
    preset: 'text_elastic_zoom',
    font: 'Rubik',
    weight: '900',
    description: 'Over-scaled impact zoom with spring settling',
    previewClass: 'from-rose-400 to-red-500 font-black',
    icon: <Sparkles className="w-4 h-4 text-rose-400" />,
  },
];

export const TextTab: React.FC = () => {
  const { addTextLayer } = useProjectStore();

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>Add Motion Text</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Click any preset to add instantly animated kinetic text to your scene.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {TEXT_QUICK_PRESETS.map((item) => (
          <button
            key={item.preset}
            onClick={() => addTextLayer(item.title.toUpperCase(), item.preset)}
            className="group w-full p-3 rounded-xl bg-[#181b24] hover:bg-[#1f2330] border border-[#222734] hover:border-indigo-500/50 text-left transition-all hover:shadow-glow-accent/20 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 group-hover:text-white">
                {item.icon}
                {item.title}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Preset
              </span>
            </div>

            <div className="py-2 px-3 rounded-lg bg-[#11131a] border border-[#222734]/80 flex items-center justify-center my-1">
              <span className={`text-base bg-clip-text text-transparent bg-gradient-to-r ${item.previewClass}`}>
                {item.title.toUpperCase()}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-1">
              {item.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
