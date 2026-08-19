import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Grid, Shield, MapPin, Radio } from 'lucide-react';
import { CanvasStage } from './CanvasStage';
import { Minimap } from './Minimap';
import { useProjectStore } from '../../store/projectStore';

export const Viewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const {
    viewportZoom,
    setViewportZoom,
    setViewportPan,
    showSafeAreas,
    toggleSafeAreas,
    showGrid,
    toggleGrid,
    showMinimap,
    toggleMinimap,
    canvas,
    activeTool,
    isRecordingMotionPath,
    finishMotionPathRecording,
  } = useProjectStore();

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        setDimensions({ width: w, height: h });

        const fitW = (w - 80) / canvas.width;
        const fitH = (h - 80) / canvas.height;
        const optimalZoom = Math.max(0.1, Math.min(1.0, Math.min(fitW, fitH)));
        setViewportZoom(Math.round(optimalZoom * 100) / 100);
        setViewportPan({ x: 0, y: 0 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [canvas.width, canvas.height, setViewportZoom, setViewportPan]);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full relative flex flex-col bg-[#090a0f] overflow-hidden"
    >
      {/* Top Floating Viewport Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[#11131a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#222734] shadow-lg text-xs">
        <button
          onClick={() => setViewportZoom(viewportZoom - 0.1)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out (Z + Alt Click)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] text-slate-300 w-9 text-center">
          {Math.round(viewportZoom * 100)}%
        </span>
        <button
          onClick={() => setViewportZoom(viewportZoom + 0.1)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In (Z + Click)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-[1px] bg-slate-700 mx-1" />

        <button
          onClick={() => {
            const fitW = (dimensions.width - 80) / canvas.width;
            const fitH = (dimensions.height - 80) / canvas.height;
            const bestZoom = Math.max(0.1, Math.min(1.2, Math.min(fitW, fitH)));
            setViewportZoom(Math.round(bestZoom * 100) / 100);
            setViewportPan({ x: 0, y: 0 });
          }}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset View / Fit to Screen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleSafeAreas}
          className={`p-1 rounded transition-colors ${
            showSafeAreas
              ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Safe Area Guides"
        >
          <Shield className="w-3.5 h-3.5" />
        </button>

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

        <button
          onClick={toggleMinimap}
          className={`p-1 rounded transition-colors ${
            showMinimap
              ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Navigator Minimap"
        >
          <MapPin className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recording Motion Banner (if active) */}
      {isRecordingMotionPath && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-rose-950/90 border border-rose-500/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-glow-accent flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-bold text-white">
              Recording Mouse Motion Path: Click & Drag cursor across canvas
            </span>
          </div>
          <button
            onClick={finishMotionPathRecording}
            className="bg-white text-rose-900 font-bold px-3 py-1 rounded-lg text-xs hover:bg-rose-100 transition-colors"
          >
            Done Recording
          </button>
        </div>
      )}

      {/* Resolution Indicator Pill Top Right */}
      <div className="absolute top-4 right-4 z-10 bg-[#11131a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#222734] shadow-lg text-[11px] font-mono text-slate-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{canvas.width}×{canvas.height}</span>
        <span className="text-slate-600">•</span>
        <span>{canvas.fps} FPS</span>
      </div>

      {/* Interactive Center Stage */}
      <CanvasStage />

      {/* Interactive Minimap */}
      {showMinimap && (
        <Minimap
          stageContainerWidth={dimensions.width}
          stageContainerHeight={dimensions.height}
        />
      )}
    </div>
  );
};
