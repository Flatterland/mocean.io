import React from 'react';
import { X, Sliders, Palette, Clock, Film } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { RESOLUTION_PRESETS, ResolutionPreset } from '../../types/project';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    canvas,
    setCanvasSettings,
    setResolutionPreset,
  } = useProjectStore();

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#11131a] border border-[#222734] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#222734] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-100">Project & Canvas Settings</h2>
          </div>

          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Resolution Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Resolution Preset</label>
            <select
              value={canvas.preset}
              onChange={(e) => setResolutionPreset(e.target.value as ResolutionPreset)}
              className="w-full bg-[#181b24] border border-[#222734] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(RESOLUTION_PRESETS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name} ({config.width}×{config.height})
                </option>
              ))}
            </select>
          </div>

          {/* Width and Height Custom */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Width (px)</label>
              <input
                type="number"
                value={canvas.width}
                onChange={(e) =>
                  setCanvasSettings({ width: parseInt(e.target.value) || 1920, preset: 'Custom' })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Height (px)</label>
              <input
                type="number"
                value={canvas.height}
                onChange={(e) =>
                  setCanvasSettings({ height: parseInt(e.target.value) || 1080, preset: 'Custom' })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Duration & FPS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Duration (seconds)</label>
              <input
                type="number"
                min="1"
                max="60"
                step="0.5"
                value={canvas.duration}
                onChange={(e) =>
                  setCanvasSettings({ duration: parseFloat(e.target.value) || 5.0 })
                }
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Frame Rate</label>
              <select
                value={canvas.fps}
                onChange={(e) => setCanvasSettings({ fps: parseInt(e.target.value) || 30 })}
                className="w-full bg-[#181b24] border border-[#222734] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="30">30 FPS (Standard)</option>
                <option value="60">60 FPS (Ultra Smooth)</option>
              </select>
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Background Color</label>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#181b24] border border-[#222734]">
              <input
                type="color"
                value={canvas.backgroundColor}
                onChange={(e) => setCanvasSettings({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-300">{canvas.backgroundColor}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222734] bg-[#0d0e14] flex justify-end">
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-glow-accent transition-all"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
