import React from 'react';
import {
  Sliders,
  Type,
  Move,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Layers,
  Palette,
  Eye,
  Trash2,
  Copy,
  Repeat,
  ArrowRightCircle,
  LogOut,
  Flame,
  ShieldAlert,
  PaintBucket
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { MOTION_PRESETS } from '../../presets/motionPresets';
import { MotionPresetType, EasingType } from '../../types/animation';
import { ShapeType } from '../../types/layer';

const GOOGLE_FONTS = [
  'Montserrat',
  'Inter',
  'Space Grotesk',
  'Outfit',
  'Poppins',
  'Bebas Neue',
  'Playfair Display',
  'JetBrains Mono',
  'Rubik',
  'Syne',
];

const EASING_OPTIONS: { id: EasingType; name: string }[] = [
  { id: 'springSnappy', name: 'Spring Snappy' },
  { id: 'springWobbly', name: 'Spring Bouncy' },
  { id: 'easeOutExpo', name: 'Ease Out Expo' },
  { id: 'easeOutCubic', name: 'Ease Out Cubic' },
  { id: 'easeOutElastic', name: 'Ease Out Elastic' },
  { id: 'easeOutBack', name: 'Ease Out Back' },
  { id: 'easeOutBounce', name: 'Ease Out Bounce' },
  { id: 'easeInOutCubic', name: 'Ease In-Out Smooth' },
  { id: 'linear', name: 'Linear (Constant)' },
];

export const RightInspector: React.FC = () => {
  const {
    layers,
    selectedLayerIds,
    updateLayer,
    deleteLayers,
    duplicateLayers,
    alignSelectedLayers,
    saveHistory,
  } = useProjectStore();

  const selectedLayer = layers.find((l) => selectedLayerIds.includes(l.id));

  if (!selectedLayer) {
    return (
      <aside className="w-80 bg-[#11131a] border-l border-[#222734] p-6 flex flex-col items-center justify-center text-center select-none shrink-0 text-slate-500">
        <Sliders className="w-8 h-8 mb-3 text-slate-600 animate-pulse" />
        <span className="text-sm font-semibold text-slate-400">No Layer Selected</span>
        <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
          Click any text, shape or element on the canvas or timeline to inspect its motion presets and styling.
        </p>
      </aside>
    );
  }

  const { transform, style, animations } = selectedLayer;

  return (
    <aside className="w-80 bg-[#11131a] border-l border-[#222734] flex flex-col select-none shrink-0 overflow-y-auto max-h-screen custom-scrollbar pb-16">
      {/* Layer Header */}
      <div className="p-4 border-b border-[#222734] flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <input
            type="text"
            value={selectedLayer.name}
            onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
            className="bg-transparent text-sm font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full truncate"
          />
          <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider">
            {selectedLayer.type} Layer
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateLayers([selectedLayer.id])}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#181b24] rounded"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteLayers([selectedLayer.id])}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-[#181b24] rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* --- SECTION 1: MOTION PRESETS --- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Motion Presets</span>
            </span>
          </div>

          {/* Entrance (In) Preset */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ArrowRightCircle className="w-3.5 h-3.5" /> Entrance (In)
              </span>
            </div>

            <select
              value={animations.inPreset || ''}
              onChange={(e) => {
                saveHistory();
                updateLayer(selectedLayer.id, {
                  animations: { ...animations, inPreset: (e.target.value || undefined) as MotionPresetType },
                });
              }}
              className="w-full bg-[#11131a] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">None (Static)</option>
              {Object.values(MOTION_PRESETS)
                .filter((p) => p.category === 'in')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>

            {animations.inPreset && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Duration</span>
                  <span className="font-mono text-slate-300">{animations.inDuration}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={animations.inDuration}
                  onChange={(e) =>
                    updateLayer(selectedLayer.id, {
                      animations: { ...animations, inDuration: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />

                {selectedLayer.type === 'text' && (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Stagger Delay</span>
                      <span className="font-mono text-slate-300">{(animations.inStagger || 0.03).toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.2"
                      step="0.01"
                      value={animations.inStagger || 0.03}
                      onChange={(e) =>
                        updateLayer(selectedLayer.id, {
                          animations: { ...animations, inStagger: parseFloat(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Continuous Loop Preset */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Repeat className="w-3.5 h-3.5" /> Continuous (Loop)
              </span>
            </div>

            <select
              value={animations.loopPreset || ''}
              onChange={(e) => {
                saveHistory();
                updateLayer(selectedLayer.id, {
                  animations: { ...animations, loopPreset: (e.target.value || undefined) as MotionPresetType },
                });
              }}
              className="w-full bg-[#11131a] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">None (Static)</option>
              {Object.values(MOTION_PRESETS)
                .filter((p) => p.category === 'loop')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Exit (Out) Preset */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <LogOut className="w-3.5 h-3.5" /> Exit (Out)
              </span>
            </div>

            <select
              value={animations.outPreset || ''}
              onChange={(e) => {
                saveHistory();
                updateLayer(selectedLayer.id, {
                  animations: { ...animations, outPreset: (e.target.value || undefined) as MotionPresetType },
                });
              }}
              className="w-full bg-[#11131a] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">None (Stay on Screen)</option>
              {Object.values(MOTION_PRESETS)
                .filter((p) => p.category === 'out')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* --- SECTION 2: TEXT PROPERTIES (IF TEXT LAYER) --- */}
        {selectedLayer.type === 'text' && selectedLayer.text && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <span>Typography</span>
            </span>

            {/* Text Area */}
            <textarea
              rows={2}
              value={selectedLayer.text.text}
              onChange={(e) =>
                updateLayer(selectedLayer.id, {
                  text: { ...selectedLayer.text!, text: e.target.value },
                })
              }
              className="w-full bg-[#181b24] border border-[#222734] rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-medium"
              placeholder="Enter kinetic text..."
            />

            {/* Font Family */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Font Family</label>
              <select
                value={selectedLayer.text.fontFamily}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, {
                    text: { ...selectedLayer.text!, fontFamily: e.target.value },
                  })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {GOOGLE_FONTS.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Size & Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Size (px)</label>
                <input
                  type="number"
                  min="12"
                  max="300"
                  value={selectedLayer.text.fontSize}
                  onChange={(e) =>
                    updateLayer(selectedLayer.id, {
                      text: { ...selectedLayer.text!, fontSize: parseInt(e.target.value) || 24 },
                    })
                  }
                  className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Weight</label>
                <select
                  value={selectedLayer.text.fontWeight}
                  onChange={(e) =>
                    updateLayer(selectedLayer.id, {
                      text: { ...selectedLayer.text!, fontWeight: e.target.value },
                    })
                  }
                  className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="400">Regular (400)</option>
                  <option value="600">Semibold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>
            </div>

            {/* Alignment & Stagger Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Align</label>
                <div className="flex bg-[#181b24] p-1 rounded-lg border border-[#222734]">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() =>
                        updateLayer(selectedLayer.id, {
                          text: { ...selectedLayer.text!, textAlign: align },
                        })
                      }
                      className={`flex-1 p-1 rounded flex items-center justify-center transition-colors ${
                        selectedLayer.text?.textAlign === align
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                      {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Stagger By</label>
                <select
                  value={selectedLayer.text.staggerUnit}
                  onChange={(e) =>
                    updateLayer(selectedLayer.id, {
                      text: { ...selectedLayer.text!, staggerUnit: e.target.value as any },
                    })
                  }
                  className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="character">Per Character</option>
                  <option value="word">Per Word</option>
                  <option value="line">Per Line</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION 3: TRANSFORM & ALIGNMENT --- */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transform</span>
          </span>

          {/* Quick Align Bar */}
          <div className="flex bg-[#181b24] p-1 rounded-lg border border-[#222734] justify-between">
            <button
              onClick={() => alignSelectedLayers('left')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs"
              title="Align Left"
            >
              Left
            </button>
            <button
              onClick={() => alignSelectedLayers('center')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs font-bold text-indigo-400"
              title="Align Center"
            >
              Center
            </button>
            <button
              onClick={() => alignSelectedLayers('right')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs"
              title="Align Right"
            >
              Right
            </button>
            <button
              onClick={() => alignSelectedLayers('middle')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs font-bold text-indigo-400"
              title="Align Middle"
            >
              Middle
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Position X</label>
              <input
                type="number"
                value={Math.round(transform.x)}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, {
                    transform: { ...transform, x: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Position Y</label>
              <input
                type="number"
                value={Math.round(transform.y)}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, {
                    transform: { ...transform, y: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Width</label>
              <input
                type="number"
                value={Math.round(transform.width)}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, {
                    transform: { ...transform, width: parseInt(e.target.value) || 50 },
                  })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Height</label>
              <input
                type="number"
                value={Math.round(transform.height)}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, {
                    transform: { ...transform, height: parseInt(e.target.value) || 50 },
                  })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 4: STYLING & GLOW --- */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Colors & Effects</span>
          </span>

          {/* Fill Color */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#181b24] border border-[#222734]">
            <span className="text-xs text-slate-300">Fill Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.fill.startsWith('#') ? style.fill : '#6366f1'}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, {
                    style: { ...style, fill: e.target.value, gradient: undefined },
                  })
                }
                className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-400">{style.fill}</span>
            </div>
          </div>

          {/* Glow / Shadow Blur */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Neon Glow / Shadow</span>
              <span className="font-mono text-indigo-400">{style.shadowBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={style.shadowBlur}
              onChange={(e) =>
                updateLayer(selectedLayer.id, {
                  style: {
                    ...style,
                    shadowBlur: parseInt(e.target.value),
                    shadowColor: style.shadowColor === 'transparent' ? style.fill : style.shadowColor,
                  },
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Opacity */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Opacity</span>
              <span className="font-mono text-indigo-400">{Math.round(style.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={style.opacity}
              onChange={(e) =>
                updateLayer(selectedLayer.id, {
                  style: { ...style, opacity: parseFloat(e.target.value) },
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
