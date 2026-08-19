import React from 'react';
import {
  Sliders,
  Type,
  Move,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Trash2,
  Copy,
  Repeat,
  ArrowRightCircle,
  LogOut,
  Radio,
  Plus,
  Key,
  Video as VideoIcon,
  Volume2,
  VolumeX,
  Footprints,
  Eye
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { MOTION_PRESETS } from '../../presets/motionPresets';
import { MotionPresetType, EasingType, AnimatableProperty } from '../../types/animation';

const GOOGLE_FONTS = [
  'Lato',
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
  'Plus Jakarta Sans',
  'Roboto',
  'Open Sans',
  'Oswald',
  'Raleway',
  'Merriweather',
  'Work Sans',
  'DM Sans',
  'Lexend',
  'Cinzel',
  'Cormorant Garamond',
  'Permanent Marker',
  'Anton',
  'Righteous',
  'Archivo Black',
  'Unbounded',
  'Sora',
  'Cabin',
  'Bungee',
  'Abril Fatface',
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
  { id: 'linear', name: 'Linear' },
];

export const RightInspector: React.FC = () => {
  const {
    layers,
    selectedLayerIds,
    currentTime,
    updateLayer,
    deleteLayers,
    duplicateLayers,
    alignSelectedLayers,
    addKeyframe,
    removeKeyframe,
    startMotionPathRecording,
    clearMotionPath,
    saveHistory,
  } = useProjectStore();

  const selectedLayer = layers.find((l) => selectedLayerIds.includes(l.id));

  if (!selectedLayer) {
    return (
      <aside className="w-80 bg-[#11131a] border-l border-[#222734] p-6 flex flex-col items-center justify-center text-center select-none shrink-0 text-slate-500">
        <Sliders className="w-8 h-8 mb-3 text-slate-600 animate-pulse" />
        <span className="text-sm font-semibold text-slate-400">No Layer Selected</span>
        <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
          Select any text, shape, image or video to inspect motion presets, keyframes, and freehand mouse paths.
        </p>
      </aside>
    );
  }

  const { transform, style, animations } = selectedLayer;
  const localTime = Math.max(0, currentTime - selectedLayer.startTime);

  const keyframableProps: { prop: AnimatableProperty; label: string; currentVal: number }[] = [
    { prop: 'x', label: 'Position X', currentVal: transform.x },
    { prop: 'y', label: 'Position Y', currentVal: transform.y },
    { prop: 'scaleX', label: 'Scale', currentVal: transform.scaleX },
    { prop: 'rotation', label: 'Rotation', currentVal: transform.rotation },
    { prop: 'opacity', label: 'Opacity', currentVal: style.opacity },
  ];

  return (
    <aside className="w-80 bg-[#11131a] border-l border-[#222734] flex flex-col select-none shrink-0 overflow-y-auto max-h-screen custom-scrollbar pb-16">
      {/* Header */}
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
        {/* --- SECTION: MOUSE MOTION PATH RECORDER --- */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-[#181b24] to-[#181b24] border border-indigo-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Mouse Path Motion</span>
            </span>
            {animations.motionPath?.points?.length ? (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {animations.motionPath.points.length} pts
              </span>
            ) : null}
          </div>

          <p className="text-[11px] text-slate-400">
            Draw motion freely with your mouse in real-time across the canvas.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => startMotionPathRecording(selectedLayer.id)}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-glow-accent transition-all active:scale-95"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Draw Motion Path</span>
            </button>

            {animations.motionPath?.points?.length ? (
              <button
                onClick={() => clearMotionPath(selectedLayer.id)}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                title="Clear Path"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* --- SECTION: PROPERTY KEYFRAMING --- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Property Keyframes</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2">
            <div className="space-y-1.5">
              {keyframableProps.map(({ prop, label, currentVal }) => (
                <div key={prop} className="flex items-center justify-between py-1 text-xs border-b border-[#222734]/50 last:border-0">
                  <span className="text-slate-300">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">
                      {typeof currentVal === 'number' ? currentVal.toFixed(1) : currentVal}
                    </span>
                    <button
                      onClick={() => addKeyframe(selectedLayer.id, prop, localTime, currentVal)}
                      className="p-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[10px] font-mono flex items-center gap-0.5 transition-colors"
                      title="Add Keyframe at Playhead"
                    >
                      <Plus className="w-3 h-3" /> ◇
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- SECTION: MOTION PRESETS --- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Motion Presets</span>
            </span>
          </div>

          {/* Entrance */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2.5">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <ArrowRightCircle className="w-3.5 h-3.5" /> Entrance (In)
            </span>

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
              </div>
            )}
          </div>

          {/* Loop */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
              <Repeat className="w-3.5 h-3.5" /> Continuous (Loop)
            </span>
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

          {/* Exit */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-2">
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
              <LogOut className="w-3.5 h-3.5" /> Exit (Out)
            </span>
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

        {/* --- SECTION: VIDEO PROPERTIES (IF VIDEO LAYER) --- */}
        {selectedLayer.type === 'video' && selectedLayer.video && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Video Settings</span>
            </span>

            <div className="p-3 rounded-xl bg-[#181b24] border border-[#222734] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Audio Volume
                </span>
                <span className="font-mono text-slate-400">
                  {Math.round(selectedLayer.video.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedLayer.video.volume}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, {
                    video: { ...selectedLayer.video!, volume: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300">Playback Speed</span>
                <select
                  value={selectedLayer.video.playbackRate}
                  onChange={(e) =>
                    updateLayer(selectedLayer.id, {
                      video: { ...selectedLayer.video!, playbackRate: parseFloat(e.target.value) },
                    })
                  }
                  className="bg-[#11131a] border border-[#222734] rounded px-2 py-1 text-slate-200 text-xs"
                >
                  <option value="0.5">0.5x (Slow)</option>
                  <option value="1">1.0x (Normal)</option>
                  <option value="1.5">1.5x (Fast)</option>
                  <option value="2">2.0x (Double)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION: TYPOGRAPHY (IF TEXT LAYER) --- */}
        {selectedLayer.type === 'text' && selectedLayer.text && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <span>Typography (30+ Fonts)</span>
            </span>

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
                    {font} {font === 'Lato' ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

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
          </div>
        )}

        {/* --- SECTION: TRANSFORM --- */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transform</span>
          </span>

          <div className="flex bg-[#181b24] p-1 rounded-lg border border-[#222734] justify-between">
            <button
              onClick={() => alignSelectedLayers('left')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs"
            >
              Left
            </button>
            <button
              onClick={() => alignSelectedLayers('center')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs font-bold text-indigo-400"
            >
              Center
            </button>
            <button
              onClick={() => alignSelectedLayers('right')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs"
            >
              Right
            </button>
            <button
              onClick={() => alignSelectedLayers('middle')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 text-xs font-bold text-indigo-400"
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
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
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
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* --- SECTION: COLOR & GLOW --- */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Glow & Styling</span>
          </span>

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
        </div>
      </div>
    </aside>
  );
};
