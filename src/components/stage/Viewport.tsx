import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Eye, Grid, Shield, Sparkles } from 'lucide-react';
import { CanvasStage } from './CanvasStage';
import { useProjectStore } from '../../store/projectStore';

export const Viewport: React.FC = () => {
  const {
    viewportZoom,
    setViewportZoom,
    setViewportPan,
    showSafeAreas,
    toggleSafeAreas,
    showGrid,
    toggleGrid,
    canvas,
  } = useProjectStore();

  return (
    <div className="flex-1 h-full relative flex flex-col bg-[#090a0f] overflow-hidden">
      {/* Floating Viewport Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[#11131a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#222734] shadow-lg text-xs">
        {/* Zoom Controls */}
        <button
          onClick={() => setViewportZoom(viewportZoom - 0.1)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] text-slate-300 w-9 text-center">
          {Math.round(viewportZoom * 100)}%
        </span>
        <button
          onClick={() => setViewportZoom(viewportZoom + 0.1)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-[1px] bg-slate-700 mx-1" />

        {/* Reset Pan/Zoom */}
        <button
          onClick={() => {
            setViewportZoom(0.7);
            setViewportPan({ x: 0, y: 0 });
          }}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset View"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        {/* Safe Area Toggle */}
        <button
          onClick={toggleSafeAreas}
          className={`p-1 rounded transition-colors ${
            showSafeAreas
              ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Title/Action Safe Areas"
        >
          <Shield className="w-3.5 h-3.5" />
        </button>

        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={`p-1 rounded transition-colors ${
            showGrid
              ? 'text-indigo-400 bg-indigo-950/60 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Canvas Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Resolution Indicator Pill Top Right */}
      <div className="absolute top-4 right-4 z-10 bg-[#11131a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#222734] shadow-lg text-[11px] font-mono text-slate-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{canvas.width}×{canvas.height}</span>
        <span className="text-slate-600">•</span>
        <span>{canvas.fps} FPS</span>
      </div>

      {/* Center Interactive Canvas Stage */}
      <CanvasStage />
    </div>
  );
};
