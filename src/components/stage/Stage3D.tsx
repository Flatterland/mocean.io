import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  MousePointer,
  Maximize,
  Radio,
  Minimize2,
  Trash2,
  Copy,
  Plus,
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

  // Dynamic padding to prevent clipping of long text, shadows, blur, and kinetic animations
  const paddingX = Math.max(160, (state.style.shadowBlur || 0) * 3 + (state.style.blur || 0) * 3);
  const paddingY = Math.max(100, (state.style.shadowBlur || 0) * 3 + (state.style.blur || 0) * 3);

  let baseW = state.transform.width;
  let baseH = state.transform.height;

  if (layer.type === 'text' && layer.text) {
    const approxTextW =
      layer.text.text.length * (layer.text.fontSize * 0.75) +
      (layer.text.letterSpacing || 0) * layer.text.text.length;
    baseW = Math.max(baseW, approxTextW);
  }

  const canvasWidth = Math.max(20, Math.round(baseW + paddingX * 2));
  const canvasHeight = Math.max(20, Math.round(baseH + paddingY * 2));

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    renderSingleLayer(ctx, layer, currentTime, isPlaying, canvasWidth, canvasHeight);
  }, [layer, currentTime, isPlaying, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      className="block pointer-events-none"
    />
  );
};

export type GizmoMode3D = 'translate' | 'rotate' | 'scale' | 'extrude';

interface GizmoDragState {
  layerId: string;
  handle: 'move-plane' | 'move-x' | 'move-y' | 'move-z' | 'rot-z' | 'rot-x' | 'rot-y' | 'scale-corner' | 'extrude';
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialZ: number;
  initialRot: number;
  initialRotX: number;
  initialRotY: number;
  initialExtrusion: number;
  initialW: number;
  initialH: number;
}

export const Stage3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    canvas,
    layers,
    selectedLayerIds,
    selectLayer,
    updateLayer,
    currentTime,
    setCurrentTime,
    isPlaying,
    threeDConfig,
    setThreeDConfig,
    resetThreeDView,
    activeTool,
    setActiveTool,
    isRecordingMotionPath,
    recordingLayerId,
    startMotionPathRecording,
    addMotionPathPoint,
    finishMotionPathRecording,
    saveHistory,
  } = useProjectStore();

  const [gizmoMode, setGizmoMode] = useState<GizmoMode3D>('translate');
  const [gizmoDrag, setGizmoDrag] = useState<GizmoDragState | null>(null);

  const [isCameraDragging, setIsCameraDragging] = useState(false);
  const [cameraDragMode, setCameraDragMode] = useState<'rotate' | 'pan'>('rotate');
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

  // Mouse Down handler for 3D Camera & 3D Motion Drawing
  const handleStageMouseDown = (e: React.MouseEvent) => {
    // 3D Motion Path Drawing Gesture
    if (activeTool === 'motion-record' && isRecordingMotionPath && recordingLayerId) {
      e.preventDefault();
      const targetLayer = layers.find((l) => l.id === recordingLayerId);
      if (targetLayer) {
        const localTime = Math.max(0, currentTime - targetLayer.startTime);
        addMotionPathPoint(targetLayer.transform.x, targetLayer.transform.y, localTime, targetLayer.transform.z || 0);
      }
      return;
    }

    // Camera orbit or pan
    if (e.button === 0 && !e.shiftKey && !e.altKey) {
      setCameraDragMode('rotate');
    } else {
      setCameraDragMode('pan');
    }
    setIsCameraDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  // Global window listeners for 3D Camera Orbit & 3D Gizmo Dragging
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // 1. Handle 3D Layer Gizmo Manipulation
      if (gizmoDrag) {
        const dx = (e.clientX - gizmoDrag.startX) / (threeDConfig.zoom || 1);
        const dy = (e.clientY - gizmoDrag.startY) / (threeDConfig.zoom || 1);

        const targetLayer = layers.find((l) => l.id === gizmoDrag.layerId);
        if (!targetLayer) return;

        switch (gizmoDrag.handle) {
          case 'move-plane':
          case 'move-x':
          case 'move-y': {
            const newX = gizmoDrag.handle === 'move-y' ? gizmoDrag.initialX : gizmoDrag.initialX + dx;
            const newY = gizmoDrag.handle === 'move-x' ? gizmoDrag.initialY : gizmoDrag.initialY + dy;
            updateLayer(gizmoDrag.layerId, {
              transform: { ...targetLayer.transform, x: Math.round(newX), y: Math.round(newY) },
            });
            break;
          }
          case 'move-z': {
            // Dragging up increases Z-elevation
            const newZ = gizmoDrag.initialZ - dy * 1.5;
            updateLayer(gizmoDrag.layerId, {
              transform: { ...targetLayer.transform, z: Math.round(newZ) },
            });
            break;
          }
          case 'rot-z': {
            const angleDelta = dx * 0.8;
            updateLayer(gizmoDrag.layerId, {
              transform: { ...targetLayer.transform, rotation: Math.round(gizmoDrag.initialRot + angleDelta) },
            });
            break;
          }
          case 'rot-x': {
            const tiltDelta = -dy * 0.8;
            updateLayer(gizmoDrag.layerId, {
              transform: {
                ...targetLayer.transform,
                rotateX: Math.max(-85, Math.min(85, Math.round(gizmoDrag.initialRotX + tiltDelta))),
              },
            });
            break;
          }
          case 'rot-y': {
            const tiltDelta = dx * 0.8;
            updateLayer(gizmoDrag.layerId, {
              transform: {
                ...targetLayer.transform,
                rotateY: Math.max(-85, Math.min(85, Math.round(gizmoDrag.initialRotY + tiltDelta))),
              },
            });
            break;
          }
          case 'scale-corner': {
            const newW = Math.max(20, Math.round(gizmoDrag.initialW + dx * 2));
            const newH = Math.max(20, Math.round(gizmoDrag.initialH + dy * 2));
            updateLayer(gizmoDrag.layerId, {
              transform: { ...targetLayer.transform, width: newW, height: newH },
            });
            break;
          }
          case 'extrude': {
            // Dragging up increases slab thickness
            const newExtrusion = Math.max(0, Math.min(80, Math.round(gizmoDrag.initialExtrusion - dy * 0.8)));
            updateLayer(gizmoDrag.layerId, {
              style: { ...targetLayer.style, extrusionDepth: newExtrusion },
            });
            break;
          }
        }
        return;
      }

      // 2. Handle 3D Motion Path Drawing Gesture
      if (activeTool === 'motion-record' && isRecordingMotionPath && recordingLayerId && e.buttons === 1) {
        const targetLayer = layers.find((l) => l.id === recordingLayerId);
        if (targetLayer) {
          const dx = e.movementX;
          const dy = e.movementY;
          const newX = targetLayer.transform.x + dx;
          const newY = targetLayer.transform.y + dy;
          const localTime = Math.max(0, currentTime - targetLayer.startTime);

          addMotionPathPoint(newX, newY, localTime, targetLayer.transform.z || 0);
          updateLayer(targetLayer.id, {
            transform: { ...targetLayer.transform, x: Math.round(newX), y: Math.round(newY) },
          });
          setCurrentTime(Math.min(targetLayer.endTime, currentTime + 0.03));
        }
        return;
      }

      // 3. Handle 3D Camera Orbit and Panning
      if (!isCameraDragging) return;

      const cdx = e.clientX - lastMousePos.current.x;
      const cdy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const config = useProjectStore.getState().threeDConfig;

      if (cameraDragMode === 'rotate') {
        const nextX = Math.max(-88, Math.min(88, config.rotateX - cdy * 0.4));
        const nextY = (config.rotateY + cdx * 0.4) % 360;
        setThreeDConfig({ rotateX: nextX, rotateY: nextY, autoRotate: false });
      } else {
        setThreeDConfig({
          panX: config.panX + cdx,
          panY: config.panY + cdy,
        });
      }
    };

    const onMouseUp = () => {
      if (gizmoDrag) {
        saveHistory();
        setGizmoDrag(null);
      }
      setIsCameraDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [
    gizmoDrag,
    isCameraDragging,
    cameraDragMode,
    activeTool,
    isRecordingMotionPath,
    recordingLayerId,
    currentTime,
    layers,
    threeDConfig.zoom,
    setThreeDConfig,
    updateLayer,
    addMotionPathPoint,
    setCurrentTime,
    saveHistory,
  ]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.93 : 1.07;
    const nextZoom = Math.max(0.1, Math.min(3.5, threeDConfig.zoom * zoomDelta));
    setThreeDConfig({ zoom: nextZoom });
  };

  // Start 3D Gizmo Drag
  const startGizmoDrag = (
    e: React.MouseEvent,
    layerId: string,
    handle: GizmoDragState['handle']
  ) => {
    e.stopPropagation();
    const targetLayer = layers.find((l) => l.id === layerId);
    if (!targetLayer) return;

    setGizmoDrag({
      layerId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: targetLayer.transform.x,
      initialY: targetLayer.transform.y,
      initialZ: targetLayer.transform.z || 0,
      initialRot: targetLayer.transform.rotation || 0,
      initialRotX: targetLayer.transform.rotateX || 0,
      initialRotY: targetLayer.transform.rotateY || 0,
      initialExtrusion: targetLayer.style.extrusionDepth || 0,
      initialW: targetLayer.transform.width,
      initialH: targetLayer.transform.height,
    });
  };

  // Orientation Presets
  const setOrientationPreset = (preset: 'isometric' | 'front' | 'top' | 'side' | 'perspective') => {
    switch (preset) {
      case 'isometric':
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
      onMouseDown={handleStageMouseDown}
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
          {/* Grid lines on floor */}
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

          {/* Base Floor Info Label */}
          <div className="absolute bottom-4 left-4 font-mono text-[11px] text-slate-400 bg-[#11131a]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Floor Base (Z: 0px)</span>
            <span className="text-slate-600">•</span>
            <span>{canvas.width}×{canvas.height}</span>
          </div>
        </div>

        {/* 3D Motion Path Spline Trajectories rendered in 3D Space */}
        {sortedLayers.map((layer) => {
          if (!layer.animations.motionPath?.points || layer.animations.motionPath.points.length < 2) {
            return null;
          }
          const pts = layer.animations.motionPath.points;
          const baseZ = (layer.trackIndex + 1) * threeDConfig.layerSpacing;

          return (
            <div
              key={`motionpath-${layer.id}`}
              className="absolute inset-0 pointer-events-none"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {pts.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = pts[idx - 1];
                const ptZ = baseZ + (pt.z || 0);
                const prevZ = baseZ + (prev.z || 0);

                return (
                  <React.Fragment key={`path-segment-${idx}`}>
                    {/* Node diamond */}
                    <div
                      className="absolute w-2.5 h-2.5 bg-cyan-400 border border-white rounded-full shadow-glow-accent"
                      style={{
                        transformStyle: 'preserve-3d',
                        left: `${pt.x}px`,
                        top: `${pt.y}px`,
                        transform: `translate(-50%, -50%) translateZ(${ptZ}px)`,
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          );
        })}

        {/* 3D Exploded Layers with Interactive 3D Transform Gizmos */}
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
              {/* Volumetric Floor Shadow */}
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

              {/* Depth Projection Anchor Lines */}
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

              {/* Physical Extrusion 3D Slab Side Walls */}
              {extrusionDepth > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Top Extruded Wall */}
                  <div
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-indigo-400/50 to-indigo-900/90 border border-white/20"
                    style={{
                      height: `${extrusionDepth}px`,
                      transformOrigin: 'top center',
                      transform: 'rotateX(-90deg)',
                    }}
                  />
                  {/* Bottom Extruded Wall */}
                  <div
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-950 to-indigo-700/70 border border-black/40"
                    style={{
                      height: `${extrusionDepth}px`,
                      transformOrigin: 'bottom center',
                      transform: 'rotateX(90deg)',
                    }}
                  />
                  {/* Left Extruded Wall */}
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-900/80 border border-white/10"
                    style={{
                      width: `${extrusionDepth}px`,
                      transformOrigin: 'center left',
                      transform: 'rotateY(90deg)',
                    }}
                  />
                  {/* Right Extruded Wall */}
                  <div
                    className="absolute top-0 right-0 h-full bg-indigo-800/90 border border-white/20"
                    style={{
                      width: `${extrusionDepth}px`,
                      transformOrigin: 'center right',
                      transform: 'rotateY(-90deg)',
                    }}
                  />
                </div>
              )}

              {/* 3D Wireframe / Bounding Outline */}
              {threeDConfig.showWireframes && (
                <div
                  className={`absolute inset-0 rounded pointer-events-none border transition-all ${
                    isSelected
                      ? 'border-indigo-400 shadow-glow-accent bg-indigo-500/10'
                      : 'border-cyan-400/30 group-hover:border-cyan-400/70 group-hover:bg-cyan-500/5'
                  }`}
                />
              )}

              {/* Floating Layer Badge */}
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
                      {extrusionDepth}px Extrude
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

              {/* INTERACTIVE 3D MANIPULATION GIZMO (WHEN SELECTED) */}
              {isSelected && (
                <div
                  className="absolute inset-0 pointer-events-auto"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* 1. Center Plane Drag Handle */}
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'move-plane')}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600/30 border-2 border-indigo-400 hover:bg-indigo-600/60 transition-all flex items-center justify-center cursor-move shadow-lg z-30"
                    title="Drag to Move Layer across (X, Y) plane"
                  >
                    <Move className="w-3.5 h-3.5 text-white" />
                  </div>

                  {/* 2. Elevated 3D Z-Depth Arrow Handle (Blue) */}
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'move-z')}
                    className="absolute top-1/2 left-1/2 cursor-ns-resize group/zhandle z-40"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translate(-50%, -50%) translateZ(40px)',
                    }}
                    title="Drag UP/DOWN to elevate along Z-Depth"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-glow-accent flex items-center justify-center text-[10px] font-bold text-white hover:scale-125 transition-transform">
                      Z
                    </div>
                  </div>

                  {/* 3. 3D Physical Extrusion Diamond Handle (Amber) */}
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'extrude')}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 cursor-ns-resize z-40 hover:scale-125 transition-transform"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `translateZ(${extrusionDepth + 15}px)`,
                    }}
                    title="Drag UP/DOWN to adjust 3D Slab Thickness"
                  >
                    <div className="w-4 h-4 rotate-45 bg-amber-400 border border-white shadow-glow-accent flex items-center justify-center" />
                  </div>

                  {/* 4. 3D Rotation Arc Stem Handle */}
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'rot-z')}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 cursor-ew-resize flex flex-col items-center z-40 group/rothandle"
                    title="Drag Left/Right to Rotate Layer in 3D"
                  >
                    <div className="w-[1.5px] h-6 bg-cyan-400" />
                    <div className="w-4 h-4 rounded-full bg-cyan-400 border border-white shadow-glow-accent hover:scale-125 transition-transform" />
                  </div>

                  {/* 5. 3D Tilt Handles (X & Y Arcs) */}
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'rot-x')}
                    className="absolute top-1/2 -right-4 -translate-y-1/2 cursor-ns-resize z-30"
                    title="Drag UP/DOWN to Tilt Pitch (Rotate X)"
                  >
                    <div className="px-1 py-0.5 rounded bg-rose-600 text-[9px] font-bold text-white shadow hover:scale-110 transition-transform">
                      Tilt X
                    </div>
                  </div>

                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'rot-y')}
                    className="absolute -top-4 left-1/4 -translate-x-1/2 cursor-ew-resize z-30"
                    title="Drag Left/Right to Tilt Yaw (Rotate Y)"
                  >
                    <div className="px-1 py-0.5 rounded bg-emerald-600 text-[9px] font-bold text-white shadow hover:scale-110 transition-transform">
                      Tilt Y
                    </div>
                  </div>

                  {/* 6. Corner Resize Handles */}
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'scale-corner')}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-indigo-600 rounded-sm shadow-lg cursor-nwse-resize hover:scale-125"
                  />
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'scale-corner')}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-indigo-600 rounded-sm shadow-lg cursor-nesw-resize hover:scale-125"
                  />
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'scale-corner')}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-indigo-600 rounded-sm shadow-lg cursor-nesw-resize hover:scale-125"
                  />
                  <div
                    onMouseDown={(e) => startGizmoDrag(e, layer.id, 'scale-corner')}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-indigo-600 rounded-sm shadow-lg cursor-nwse-resize hover:scale-125"
                  />
                </div>
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

        {/* Quick Projection Buttons */}
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

      {/* Floating 3D Tools & Controls HUD Bottom Center */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-[#11131a]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#222734] shadow-2xl flex items-center gap-4 text-xs pointer-events-auto"
      >
        {/* 3D Motion Path Drawing Trigger */}
        {selectedLayerIds.length > 0 && (
          <>
            <button
              onClick={() => {
                if (isRecordingMotionPath) {
                  finishMotionPathRecording();
                } else {
                  startMotionPathRecording(selectedLayerIds[0]);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                isRecordingMotionPath
                  ? 'bg-rose-600 text-white shadow-glow-accent animate-pulse'
                  : 'bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
              }`}
              title="Draw Freehand 3D Motion Trajectory"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{isRecordingMotionPath ? 'Done 3D Path' : 'Draw 3D Motion Path'}</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800" />
          </>
        )}

        {/* Camera Orientation Presets */}
        <div className="flex items-center gap-1 bg-[#181b24] p-1 rounded-xl border border-[#222734]">
          <button
            onClick={() => setOrientationPreset('isometric')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              isOrthographic
                ? 'bg-indigo-600 text-white shadow-glow-accent'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="True Isometric Projection"
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
            title="Perspective 3D"
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

        {/* Quick Toggles */}
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
        <span className="text-slate-400">Click layer for 3D Transform Gizmo • Drag arrows to edit</span>
      </div>
    </div>
  );
};
