import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { renderFrame } from '../../engine/renderer';
import { Point, rotatePoint } from '../../utils/math2d';

interface DragState {
  layerId: string;
  type: 'move' | 'rotate' | 'resize';
  handle?: string; // 'tl', 'tr', 'bl', 'br', 'rot'
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialW: number;
  initialH: number;
  initialRot: number;
}

export const CanvasStage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    canvas,
    layers,
    selectedLayerIds,
    currentTime,
    isPlaying,
    viewportZoom,
    viewportPan,
    setViewportPan,
    showSafeAreas,
    showGrid,
    selectLayer,
    updateLayer,
    saveHistory,
  } = useProjectStore();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // Playback Loop via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const store = useProjectStore.getState();
      let nextTime = store.currentTime + delta;

      if (nextTime >= store.canvas.duration) {
        if (store.isLooping) {
          nextTime = 0;
        } else {
          nextTime = store.canvas.duration;
          store.setIsPlaying(false);
        }
      }

      store.setCurrentTime(nextTime);

      if (store.isPlaying) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  // Main Render Frame Trigger
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    renderFrame({
      ctx,
      canvasSettings: canvas,
      layers,
      currentTime,
      selectedLayerIds,
      showGizmos: true,
      showSafeAreas,
    });
  }, [canvas, layers, currentTime, selectedLayerIds, showSafeAreas]);

  // Transform client mouse coordinate into canvas stage coordinate
  const screenToCanvasCoords = useCallback(
    (clientX: number, clientY: number): Point => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();

      const centerX = rect.width / 2 + viewportPan.x;
      const centerY = rect.height / 2 + viewportPan.y;

      const canvasDisplayW = canvas.width * viewportZoom;
      const canvasDisplayH = canvas.height * viewportZoom;

      const canvasTopLeftX = centerX - canvasDisplayW / 2;
      const canvasTopLeftY = centerY - canvasDisplayH / 2;

      const stageX = (clientX - rect.left - canvasTopLeftX) / viewportZoom;
      const stageY = (clientY - rect.top - canvasTopLeftY) / viewportZoom;

      return { x: stageX, y: stageY };
    },
    [canvas.width, canvas.height, viewportZoom, viewportPan]
  );

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Middle click or Alt+Click for panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - viewportPan.x, y: e.clientY - viewportPan.y };
      return;
    }

    if (e.button !== 0) return;

    const coords = screenToCanvasCoords(e.clientX, e.clientY);

    // Check hit test against layers from top to bottom
    const sorted = [...layers].sort((a, b) => b.trackIndex - a.trackIndex);
    let hitLayer = null;

    for (const layer of sorted) {
      if (!layer.visible || layer.locked) continue;
      const t = layer.transform;
      const halfW = t.width / 2;
      const halfH = t.height / 2;

      // Un-rotate click point to test in layer local space
      const localPoint = rotatePoint(coords, { x: t.x, y: t.y }, -t.rotation);

      if (
        localPoint.x >= t.x - halfW &&
        localPoint.x <= t.x + halfW &&
        localPoint.y >= t.y - halfH &&
        localPoint.y <= t.y + halfH
      ) {
        hitLayer = layer;
        break;
      }
    }

    if (hitLayer) {
      selectLayer(hitLayer.id, e.shiftKey);
      saveHistory();
      setDragState({
        layerId: hitLayer.id,
        type: 'move',
        startX: coords.x,
        startY: coords.y,
        initialX: hitLayer.transform.x,
        initialY: hitLayer.transform.y,
        initialW: hitLayer.transform.width,
        initialH: hitLayer.transform.height,
        initialRot: hitLayer.transform.rotation,
      });
    } else {
      if (!e.shiftKey) {
        useProjectStore.getState().clearSelection();
      }
    }
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setViewportPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!dragState) return;

    const coords = screenToCanvasCoords(e.clientX, e.clientY);
    const dx = coords.x - dragState.startX;
    const dy = coords.y - dragState.startY;

    if (dragState.type === 'move') {
      let nextX = dragState.initialX + dx;
      let nextY = dragState.initialY + dy;

      // Smart snapping to center
      if (Math.abs(nextX - canvas.width / 2) < 15) nextX = canvas.width / 2;
      if (Math.abs(nextY - canvas.height / 2) < 15) nextY = canvas.height / 2;

      updateLayer(dragState.layerId, {
        transform: {
          ...layers.find((l) => l.id === dragState.layerId)!.transform,
          x: Math.round(nextX),
          y: Math.round(nextY),
        },
      });
    }
  };

  // Mouse Up Handler
  const handleMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`w-full h-full relative overflow-hidden flex items-center justify-center ${
        isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        backgroundImage: showGrid
          ? 'radial-gradient(circle, #222734 1px, transparent 1px)'
          : undefined,
        backgroundSize: '24px 24px',
        backgroundColor: '#090a0f',
      }}
    >
      {/* Canvas Viewport Container */}
      <div
        className="relative shadow-2xl transition-transform ease-out"
        style={{
          width: canvas.width * viewportZoom,
          height: canvas.height * viewportZoom,
          transform: `translate(${viewportPan.x}px, ${viewportPan.y}px)`,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvas.width}
          height={canvas.height}
          className="w-full h-full block rounded-sm bg-[#090a0f]"
        />
      </div>
    </div>
  );
};
