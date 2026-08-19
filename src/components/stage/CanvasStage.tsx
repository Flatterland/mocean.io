import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { renderFrame } from '../../engine/renderer';
import { Point, rotatePoint } from '../../utils/math2d';

interface DragState {
  layerId: string;
  type: 'move' | 'rotate' | 'resize';
  handle?: string;
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
    setCurrentTime,
    isPlaying,
    playbackSpeed,
    viewportZoom,
    setViewportZoom,
    viewportPan,
    setViewportPan,
    showSafeAreas,
    showGrid,
    activeTool,
    setActiveTool,
    isRecordingMotionPath,
    recordingLayerId,
    addMotionPathPoint,
    finishMotionPathRecording,
    selectLayer,
    updateLayer,
    splitLayerAtPlayhead,
    addImageLayer,
    addVideoLayer,
    saveHistory,
  } = useProjectStore();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // Playback Loop with Shuttle Speed (1x, 2x, 4x, -1x, -2x, -4x)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const delta = ((now - lastTime) / 1000) * playbackSpeed;
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
      } else if (nextTime <= 0) {
        if (store.isLooping) {
          nextTime = store.canvas.duration;
        } else {
          nextTime = 0;
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
  }, [isPlaying, playbackSpeed]);

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
      isPlaying,
      selectedLayerIds,
      showGizmos: true,
      showSafeAreas,
    });
  }, [canvas, layers, currentTime, isPlaying, selectedLayerIds, showSafeAreas]);

  // Screen to Canvas Coordinates
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
    // Hand Tool or Middle Click or Alt+Click for panning
    if (activeTool === 'hand' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - viewportPan.x, y: e.clientY - viewportPan.y };
      return;
    }

    if (e.button !== 0) return;

    const coords = screenToCanvasCoords(e.clientX, e.clientY);

    // Zoom Tool Behavior
    if (activeTool === 'zoom') {
      if (e.altKey || e.shiftKey) {
        setViewportZoom(Math.max(0.1, viewportZoom - 0.2));
      } else {
        setViewportZoom(Math.min(4, viewportZoom + 0.2));
      }
      return;
    }

    // Motion Path Dragging Record Mode
    if (activeTool === 'motion-record' && isRecordingMotionPath && recordingLayerId) {
      addMotionPathPoint(coords.x, coords.y, 0);
      return;
    }

    // Find clicked layer
    const sorted = [...layers].sort((a, b) => b.trackIndex - a.trackIndex);
    let hitLayer = null;

    for (const layer of sorted) {
      if (!layer.visible || layer.locked) continue;
      const t = layer.transform;
      const halfW = t.width / 2;
      const halfH = t.height / 2;

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

    // Razor Tool Behavior
    if (activeTool === 'razor') {
      if (hitLayer) {
        splitLayerAtPlayhead(hitLayer.id, currentTime);
      }
      return;
    }

    // Normal Selection & Dragging
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

    const coords = screenToCanvasCoords(e.clientX, e.clientY);

    // Freehand Motion Path Recording
    if (activeTool === 'motion-record' && isRecordingMotionPath && recordingLayerId && e.buttons === 1) {
      const targetLayer = layers.find((l) => l.id === recordingLayerId);
      if (targetLayer) {
        const localTime = Math.max(0, currentTime - targetLayer.startTime);
        addMotionPathPoint(coords.x, coords.y, localTime);
        // Advance time during recording gesture
        setCurrentTime(Math.min(targetLayer.endTime, currentTime + 0.03));
      }
      return;
    }

    if (!dragState) return;

    const dx = coords.x - dragState.startX;
    const dy = coords.y - dragState.startY;

    if (dragState.type === 'move') {
      let nextX = dragState.initialX + dx;
      let nextY = dragState.initialY + dy;

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

  // Drag-and-Drop Video / Image Files onto Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv)$/i);
      const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|svg|webp)$/i);

      if (isVideo) {
        const url = URL.createObjectURL(file);
        addVideoLayer(url, file.name.replace(/\.[^/.]+$/, ''));
      } else if (isImage) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          addImageLayer(src, file.name.replace(/\.[^/.]+$/, ''));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'hand') return 'grab';
    if (activeTool === 'razor') return 'crosshair';
    if (activeTool === 'zoom') return 'zoom-in';
    if (activeTool === 'motion-record') return 'crosshair';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-full h-full relative overflow-hidden flex items-center justify-center select-none"
      style={{
        cursor: getCursor(),
        backgroundImage: showGrid
          ? 'radial-gradient(circle, #222734 1px, transparent 1px)'
          : undefined,
        backgroundSize: '24px 24px',
        backgroundColor: '#090a0f',
      }}
    >
      {/* Canvas Viewport Box */}
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
