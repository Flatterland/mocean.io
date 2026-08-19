import React from 'react';
import { Shapes, Square, Circle, Star, Hexagon, ArrowRight, Shield } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { ShapeType } from '../../types/layer';

interface ShapeItem {
  type: ShapeType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SHAPE_ITEMS: ShapeItem[] = [
  { type: 'pill', label: 'Badge / Pill', icon: <div className="w-5 h-2.5 rounded-full border-2 border-indigo-400" />, description: 'Modern rounded badge & highlight pill' },
  { type: 'rectangle', label: 'Rectangle / Card', icon: <Square className="w-4 h-4 text-indigo-400" />, description: 'Backdrops, containers, cards' },
  { type: 'circle', label: 'Circle / Disc', icon: <Circle className="w-4 h-4 text-cyan-400" />, description: 'Avatars, focal points, pulse halos' },
  { type: 'star', label: 'Star / Burst', icon: <Star className="w-4 h-4 text-amber-400" />, description: 'Promo highlights & geometric accents' },
  { type: 'polygon', label: 'Polygon / Hexagon', icon: <Hexagon className="w-4 h-4 text-pink-400" />, description: 'Tech UI elements & geometric nodes' },
  { type: 'arrow', label: 'Callout Arrow', icon: <ArrowRight className="w-4 h-4 text-emerald-400" />, description: 'Directional callouts & pointers' },
  { type: 'triangle', label: 'Triangle / Play', icon: <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-purple-400" />, description: 'Play indicators & directional flags' },
];

export const ShapesTab: React.FC = () => {
  const { addShapeLayer } = useProjectStore();

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Shapes className="w-3.5 h-3.5 text-pink-400" />
          <span>Add Vector & Shapes</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Add animatable 2D shapes with spring pop and glow outlines.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {SHAPE_ITEMS.map((item) => (
          <button
            key={item.type}
            onClick={() => addShapeLayer(item.type)}
            className="group p-3 rounded-xl bg-[#181b24] hover:bg-[#1f2330] border border-[#222734] hover:border-pink-500/50 flex flex-col items-center justify-center gap-2 text-center transition-all hover:shadow-glow-accent/20"
          >
            <div className="w-10 h-10 rounded-lg bg-[#11131a] flex items-center justify-center border border-[#222734] group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
