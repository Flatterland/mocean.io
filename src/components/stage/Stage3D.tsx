import React, { useRef, useState, useEffect } from 'react';
import {
  Rotate3d,
  Layers,
  Eye,
  Sliders,
  Compass,
  Maximize2,
  Play,
  Pause,
  Box,
  CornerDownRight,
  Move,
  RotateCw,
  Sparkles,
  Grid,
  BoxSelect,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { computeLayerState } from '../../engine/animator';
import { renderSingleLayer } from '../../engine/renderer';
import { Layer } from '../../types/layer';

interface SingleLayerCanvasProps {
  layer: Layer;
  currentTime: number;
  isPlaying: boolean;
}

const SingleLayerCanvas: React.FC<SingleLayerCanvasProps> = ({ layer, currentTime, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = computeLayerState(layer, currentTime);

  const width = Math.max(10, Math.round(state.transform.width));
  const height = Math.max(10, Math.round(state.transform.height));

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    renderSingleLayer(ctx, layer, currentTime, isPlaying);
  }, [layer, currentTime, isPlaying, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className="block pointer-events-none"
    />
  );
};

export const Stage3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    canvas,
    layers,
    selectedLayerIds,
    selectLayer,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    threeDConfig,
    setThreeDConfig,
    resetThreeDView,
  } = useProjectStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'rotate' | 'pan'>('rotate');
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-rotation animation loop
  useEffect(() => {
    if (!threeDConfig.autoRotate) return;

    let animId: number;
    const rotateTick = () => {
      setThreeDConfig({
        rotateY: (threeDConfig.rotateY + 0.3) % 360,
      });
      animId = requestAnimationFrame(rotateTick);
    };

    animId = requestAnimationFrame(rotateTick);
    return () => cancelAnimationFrame(animId);
  }, [threeDConfig.autoRotate, threeDConfig.rotateY, setThreeDConfig]);

  // Mouse Interaction: Orbit, Pan, and Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking on the background container
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('scene-backdrop')) {
      return;
    }

    if (e.button === 0 && !e.shiftKey && !e.altKey) {
      setDragMode('rotate');
    } else {
      setDragMode('pan');
    }
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (dragMode === 'rotate') {
      const nextX = Math.max(-88, Math.min(88, threeDConfig.rotateX - dy * 0.35));
      const nextY = (threeDConfig.rotateY + dx * 0.35) % 360;
      setThreeDConfig({ rotateX: nextX, rotateY: nextY, autoRotate: false });
    } else {
      setThreeDConfig({
        panX: threeDConfig.panX + dx,
        panY: threeDConfig.panY + dy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.93 : 1.07;
    const nextZoom = Math.max(0.1, Math.min(3.5, threeDConfig.zoom * zoomDelta));
    setThreeDConfig({ zoom: nextZoom });
  };

  // Orientation Presets
  const setOrientationPreset = (preset: 'isometric' | 'front' | 'top' | 'side' | 'perspective') => {
    switch (preset) {
      case 'isometric':
        // Mathematical True Isometric Projection: 35.264° pitch, -45° yaw, Orthographic
        setThreeDConfig({
          rotateX: 35.264,
          rotateY: -45,
          panX: 0,
          panY: 0,
          projectionMode: 'orthographic',
          autoRotate: false,
        });
        break;
      case 'perspective':
        setThreeDConfig({
          rotateX: 32,
          rotateY: -35,
          panX: 0,
          panY: 0,
          projectionMode: 'perspective',
          autoRotate: false,
        });
        break;
      case 'front':
        setThreeDConfig({
          rotateX: 0,
          rotateY: 0,
          panX: 0,
          panY: 0,
          autoRotate: false,
        });
        break;
      case 'top':
        setThreeDConfig({
          rotateX: 90,
          rotateY: 0,
          panX: 0,
          panY: 0,
          autoRotate: false,
        });
        break;
      case 'side':
        setThreeDConfig({
          rotateX: 0,
          rotateY: -90,
          panX: 0,
          panY: 0,
          autoRotate: false,
        });
        break;
    }
  };

  const sortedLayers = [...layers].sort((a, b) => a.trackIndex - b.trackIndex);
  const isOrthographic = threeDConfig.projectionMode === 'orthographic';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      className="w-full h-full relative overflow-hidden flex items-center justify-center select-none bg-[#06070a] cursor-grab active:cursor-grabbing scene-backdrop"
      style={{
        perspective: isOrthographic ? 'none' : `${threeDConfig.perspective}px`,
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* 3D Scene Container */}
      <div
        className="relative transition-transform duration-75 ease-out shrink-0"
        style={{
          transformStyle: 'preserve-3d',
          transform: `
            translate3d(${threeDConfig.panX}px, ${threeDConfig.panY}px, 0)
            scale(${threeDConfig.zoom})
            rotateX(${threeDConfig.rotateX}deg)
            rotateY(${threeDConfig.rotateY}deg)
          `,
          width: `${canvas.width}px`,
          height: `${canvas.height}px`,
        }}
      >
        {/* Base Canvas Floor / Backdrop Plane */}
        <div
          className="absolute inset-0 rounded-xl border-2 border-indigo-500/40 transition-all pointer-events-none"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(0px)',
            backgroundColor: canvas.backgroundColor || '#090a0f',
            boxShadow:
              '0 40px 100px rgba(0, 0, 0, 0.95), 0 0 60px rgba(99, 102, 241, 0.2)',
          }}
        >
          {/* Subtle Grid on Floor */}
          <div
            className="w-full h-full absolute inset-0 opacity-20 pointer-events-none rounded-xl"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
              backgroundSize: '100px 100px',
            }}
          />

          {/* Canvas Center Axes */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-indigo-500/25 pointer-events-none" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-indigo-500/25 pointer-events-none" />

          {/* Base Plane Info Label */}
          <div className="absolute bottom-4 left-4 font-mono text-[11px] text-slate-400 bg-[#11131a]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Floor Base (Z: 0px)</span>
            <span className="text-slate-600">•</span>
            <span>{canvas.width}×{canvas.height}</span>
          </div>
        </div>

        {/* 3D Exploded Layers with True 3D Extrusion & Spatial Tilt */}
        {sortedLayers.map((layer) => {
          if (!layer.visible) return null;

          const state = computeLayerState(layer, currentTime);
          if (!state.isActive || state.style.opacity <= 0) return null;

          const { transform, style } = state;
          const isSelected = selectedLayerIds.includes(layer.id);

          // Combined Z-Elevation: (trackIndex * layerSpacing) + custom Z-depth offset
          const zElevation = (layer.trackIndex + 1) * threeDConfig.layerSpacing + (transform.z || 0);

          const layerW = Math.max(10, Math.round(transform.width));
          const layerH = Math.max(10, Math.round(transform.height));

          const extrusionDepth = style.extrusionDepth || 0;
          const tiltX = transform.rotateX || 0;
          const tiltY = transform.rotateY || 0;

          return (
            <div
              key={layer.id}
              onClick={(e) => {
                e.stopPropagation();
                selectLayer(layer.id, e.shiftKey);
              }}
              className="absolute transition-transform duration-75 ease-out cursor-pointer group"
              style={{
                transformStyle: 'preserve-3d',
                left: `${transform.x}px`,
                top: `${transform.y}px`,
                width: `${layerW}px`,
                height: `${layerH}px`,
                transform: `
                  translate(-50%, -50%)
                  translateZ(${zElevation}px)
                  rotateX(${tiltX}deg)
                  rotateY(${tiltY}deg)
                  rotateZ(${transform.rotation}deg)
                  scale(${transform.scaleX}, ${transform.scaleY})
                `,
                opacity: style.opacity,
              }}
            >
              {/* Floor Shadow Projection */}
              {zElevation > 20 && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none transition-all"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(-${zElevation}px)`,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    filter: `blur(${Math.min(30, zElevation * 0.15)}px)`,
                  }}
                />
              )}

              {/* Depth Projection Connector Lines down to Base Floor */}
              {threeDConfig.showDepthLines && zElevation > 0 && (
                <div
                  className="absolute top-0 left-0 pointer-events-none transition-opacity"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(-${zElevation}px)`,
                  }}
                >
                  <div
                    className="absolute bg-gradient-to-t from-indigo-500/10 via-indigo-400/40 to-cyan-400/80"
                    style={{
                      width: '1.5px',
                      height: `${zElevation}px`,
                      left: '0px',
                      top: '0px',
                      transformOrigin: 'top left',
                      transform: 'rotateX(-90deg)',
                    }}
                  />
                  <div
                    className="absolute bg-gradient-to-t from-indigo-500/10 via-indigo-400/40 to-cyan-400/80"
                    style={{
                      width: '1.5px',
                      height: `${zElevation}px`,
                      left: `${layerW}px`,
                      top: `${layerH}px`,
                      transformOrigin: 'top left',
                      transform: 'rotateX(-90deg)',
                    }}
                  />
                </div>
              )}

              {/* True 3D Physical Extrusion Slab Side Walls */}
              {extrusionDepth > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Top Extruded Wall */}
                  <div
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-indigo-400/40 to-indigo-900/80 border border-white/20"
                    style={{
                      height: `${extrusionDepth}px`,
                      transformOrigin: 'top center',
                      transform: 'rotateX(-90deg)',
                    }}
                  />
                  {/* Bottom Extruded Wall */}
                  <div
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-950 to-indigo-700/60 border border-black/40"
                    style={{
                      height: `${extrusionDepth}px`,
                      transformOrigin: 'bottom center',
                      transform: 'rotateX(90deg)',
                    }}
                  />
                  {/* Left Extruded Wall */}
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-900/70 border border-white/10"
                    style={{
                      width: `${extrusionDepth}px`,
                      transformOrigin: 'center left',
                      transform: 'rotateY(90deg)',
                    }}
                  />
                  {/* Right Extruded Wall */}
                  <div
                    className="absolute top-0 right-0 h-full bg-indigo-800/80 border border-white/20"
                    style={{
                      width: `${extrusionDepth}px`,
                      transformOrigin: 'center right',
                      transform: 'rotateY(-90deg)',
                    }}
                  />
                </div>
              )}

              {/* Layer 3D Bounding Outline / Wireframe */}
              {threeDConfig.showWireframes && (
                <div
                  className={`absolute inset-0 rounded pointer-events-none border transition-all ${
                    isSelected
                      ? 'border-indigo-400 shadow-glow-accent bg-indigo-500/10'
                      : 'border-cyan-400/30 group-hover:border-cyan-400/70 group-hover:bg-cyan-500/5'
                  }`}
                />
              )}

              {/* Floating Layer Name & Track Badge */}
              {threeDConfig.showLayerBadges && (
                <div
                  className="absolute -top-8 left-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#11131a]/95 backdrop-blur-md border border-[#222734] shadow-2xl pointer-events-none text-[10px] font-mono whitespace-nowrap"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(15px)',
                  }}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-indigo-400 shadow-glow-accent' : 'bg-cyan-400'
                    }`}
                  />
                  <span className="font-bold text-slate-200">
                    T{layer.trackIndex + 1}: {layer.name}
                  </span>
                  <span className="text-indigo-400">+{Math.round(zElevation)}px</span>
                  {extrusionDepth > 0 && (
                    <span className="text-cyan-300 font-bold bg-cyan-950/60 px-1 rounded border border-cyan-500/30">
                      {extrusionDepth}px 3D
                    </span>
                  )}
                </div>
              )}

              {/* Live Rendered Canvas Layer Content */}
              <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                <SingleLayerCanvas
                  layer={layer}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                />
              </div>

              {/* Corner Handles when Selected */}
              {isSelected && (
                <>
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm shadow-lg" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm shadow-lg" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm shadow-lg" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm shadow-lg" />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating 3D Navigation Gizmo Cube in Top Right */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto bg-[#11131a]/85 backdrop-blur-md p-2.5 rounded-2xl border border-[#222734] shadow-2xl"
      >
        <div className="text-[10px] font-mono text-slate-400 w-full flex items-center justify-between pb-1 border-b border-[#222734]">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Compass className="w-3 h-3 text-indigo-400" /> 3D Compass
          </span>
          <span className="text-[9px] text-slate-500">{isOrthographic ? 'ISO' : 'PERSP'}</span>
        </div>

        <div
          className="w-20 h-20 relative flex items-center justify-center my-1"
          style={{
            perspective: isOrthographic ? 'none' : '400px',
          }}
        >
          <div
            className="w-12 h-12 relative transition-transform duration-75"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${threeDConfig.rotateX}deg) rotateY(${threeDConfig.rotateY}deg)`,
            }}
          >
            {/* Front */}
            <div
              onClick={() => setOrientationPreset('front')}
              className="absolute inset-0 bg-indigo-900/90 border border-indigo-400/80 text-[9px] font-mono font-bold flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600 transition-colors shadow-lg"
              style={{ transform: 'translateZ(24px)' }}
            >
              FRONT
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 bg-slate-900/90 border border-slate-700 text-[9px] font-mono flex items-center justify-center text-slate-400 shadow-lg"
              style={{ transform: 'rotateY(180deg) translateZ(24px)' }}
            >
              BACK
            </div>
            {/* Top */}
            <div
              onClick={() => setOrientationPreset('top')}
              className="absolute inset-0 bg-cyan-900/90 border border-cyan-400/80 text-[9px] font-mono font-bold flex items-center justify-center text-cyan-200 cursor-pointer hover:bg-cyan-600 transition-colors shadow-lg"
              style={{ transform: 'rotateX(90deg) translateZ(24px)' }}
            >
              TOP
            </div>
            {/* Bottom */}
            <div
              className="absolute inset-0 bg-slate-900/90 border border-slate-700 text-[9px] font-mono flex items-center justify-center text-slate-400 shadow-lg"
              style={{ transform: 'rotateX(-90deg) translateZ(24px)' }}
            >
              BTM
            </div>
            {/* Right */}
            <div
              onClick={() => setOrientationPreset('side')}
              className="absolute inset-0 bg-purple-900/90 border border-purple-400/80 text-[9px] font-mono font-bold flex items-center justify-center text-purple-200 cursor-pointer hover:bg-purple-600 transition-colors shadow-lg"
              style={{ transform: 'rotateY(90deg) translateZ(24px)' }}
            >
              RIGHT
            </div>
            {/* Left */}
            <div
              className="absolute inset-0 bg-slate-900/90 border border-slate-700 text-[9px] font-mono flex items-center justify-center text-slate-400 shadow-lg"
              style={{ transform: 'rotateY(-90deg) translateZ(24px)' }}
            >
              LEFT
            </div>
          </div>
        </div>

        {/* Quick Orientation Selector */}
        <div className="grid grid-cols-2 gap-1 w-full pt-1">
          <button
            onClick={() => setOrientationPreset('isometric')}
            className={`py-1 rounded text-[10px] font-bold transition-all ${
              isOrthographic
                ? 'bg-indigo-600 text-white shadow-glow-accent'
                : 'bg-[#181b24] text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            True ISO
          </button>
          <button
            onClick={() => setOrientationPreset('perspective')}
            className={`py-1 rounded text-[10px] font-bold transition-all ${
              !isOrthographic
                ? 'bg-indigo-600 text-white shadow-glow-accent'
                : 'bg-[#181b24] text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Persp 3D
          </button>
        </div>
      </div>

      {/* Floating 3D Control Bar Bottom Center */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-[#11131a]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#222734] shadow-2xl flex items-center gap-4 text-xs pointer-events-auto"
      >
        {/* Camera Presets */}
        <div className="flex items-center gap-1 bg-[#181b24] p-1 rounded-xl border border-[#222734]">
          <button
            onClick={() => setOrientationPreset('isometric')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              isOrthographic
                ? 'bg-indigo-600 text-white shadow-glow-accent'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="True Isometric Orthographic Projection (35.264° pitch / -45° yaw)"
          >
            True Isometric
          </button>
          <button
            onClick={() => setOrientationPreset('perspective')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              !isOrthographic
                ? 'bg-slate-800 text-indigo-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Perspective Angle"
          >
            Perspective
          </button>
          <button
            onClick={() => setOrientationPreset('front')}
            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Front View"
          >
            Front
          </button>
          <button
            onClick={() => setOrientationPreset('top')}
            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Top-Down View"
          >
            Top
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Z-Spacing / Layer Depth Slider */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
            Explosion Depth:
          </span>
          <input
            type="range"
            min="0"
            max="150"
            step="5"
            value={threeDConfig.layerSpacing}
            onChange={(e) =>
              setThreeDConfig({ layerSpacing: parseInt(e.target.value) })
            }
            className="w-24 accent-indigo-500 cursor-pointer"
            title="Layer Z-Spacing Separation"
          />
          <span className="text-[11px] font-mono text-indigo-300 w-9">
            {threeDConfig.layerSpacing}px
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              setThreeDConfig({ autoRotate: !threeDConfig.autoRotate })
            }
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              threeDConfig.autoRotate
                ? 'bg-amber-500 text-black shadow-glow-accent'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Automatic 3D Turntable Orbit"
          >
            <RotateCw className={`w-3.5 h-3.5 ${threeDConfig.autoRotate ? 'animate-spin' : ''}`} />
            <span>Turntable</span>
          </button>

          <button
            onClick={() =>
              setThreeDConfig({
                showWireframes: !threeDConfig.showWireframes,
              })
            }
            className={`p-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              threeDConfig.showWireframes
                ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle 3D Wireframes"
          >
            <Box className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              setThreeDConfig({
                showDepthLines: !threeDConfig.showDepthLines,
              })
            }
            className={`p-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              threeDConfig.showDepthLines
                ? 'bg-indigo-950/60 border border-indigo-500/50 text-indigo-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Depth Anchor Lines"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetThreeDView}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset 3D Camera"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Instructions Helper Tag Top Left */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 z-10 bg-[#11131a]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#222734] shadow-lg text-[11px] font-mono text-slate-400 flex items-center gap-2 pointer-events-auto"
      >
        <Rotate3d className="w-4 h-4 text-indigo-400 animate-spin-slow" />
        <span className="font-bold text-slate-200">
          {isOrthographic ? 'True Isometric Projection' : '3D Spatial Layer View'}
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">Left-Drag: Orbit • Shift+Drag: Pan • Scroll: Zoom</span>
      </div>
    </div>
  );
};
