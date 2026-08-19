import React, { useState } from 'react';
import { Sparkles, ArrowRightCircle, Repeat, LogOut, Check } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { MOTION_PRESETS, PRESET_CATEGORIES } from '../../presets/motionPresets';

type PresetTabCategory = 'in' | 'out' | 'loop';

export const PresetsTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<PresetTabCategory>('in');
  const { selectedLayerIds, layers, applyPresetToSelected } = useProjectStore();

  const selectedLayer = layers.find((l) => selectedLayerIds.includes(l.id));

  const filteredPresets = Object.values(MOTION_PRESETS).filter(
    (preset) => preset.category === activeCategory
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Motion Preset Library</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          {selectedLayer
            ? `Applying to: "${selectedLayer.name}"`
            : 'Select a layer on the canvas to apply presets'}
        </p>
      </div>

      {/* Category selector pills */}
      <div className="flex bg-[#11131a] p-1 rounded-lg border border-[#222734] gap-1">
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as PresetTabCategory)}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b24]'
            }`}
          >
            {cat.id === 'in' ? 'Entrances' : cat.id === 'loop' ? 'Loops' : 'Exits'}
          </button>
        ))}
      </div>

      {/* Preset List */}
      <div className="space-y-2">
        {filteredPresets.map((preset) => {
          const isCurrentlyActive =
            selectedLayer &&
            ((activeCategory === 'in' && selectedLayer.animations.inPreset === preset.id) ||
              (activeCategory === 'loop' && selectedLayer.animations.loopPreset === preset.id) ||
              (activeCategory === 'out' && selectedLayer.animations.outPreset === preset.id));

          return (
            <button
              key={preset.id}
              onClick={() => applyPresetToSelected(preset.id, activeCategory)}
              disabled={!selectedLayer}
              className={`w-full p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
                isCurrentlyActive
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-glow-accent/20'
                  : 'bg-[#181b24] hover:bg-[#1f2330] border-[#222734] hover:border-slate-600'
              } ${!selectedLayer ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeCategory === 'in' && <ArrowRightCircle className="w-4 h-4 text-emerald-400" />}
                  {activeCategory === 'loop' && <Repeat className="w-4 h-4 text-cyan-400" />}
                  {activeCategory === 'out' && <LogOut className="w-4 h-4 text-rose-400" />}
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    {preset.name}
                  </span>
                </div>

                {isCurrentlyActive && (
                  <span className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {preset.description}
              </p>

              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                <span>Duration: {preset.duration}s</span>
                <span>Easing: {preset.easing}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
