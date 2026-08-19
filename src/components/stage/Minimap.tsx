import React, { useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { MapPin, Navigation } from 'lucide-react';

interface MinimapProps {
  stageContainerWidth: number;
  stageContainerHeight: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  stageContainerWidth,
  stageContainerHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    canvas,
    layers,
    viewportZoom,
    viewportPan,
    setViewportPan,
    showGrid,
  } = useProjectStore();

  const minimapWidth = 140;
  const minimapHeight = (140 * canvas.height) / canvas.width;
  const scale = minimapWidth / canvas.width;

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0c0d14';
    ctx.fillRect(0, 0, minimapWidth, minimapHeight);

    // Border
    ctx.strokeStyle = '#222734';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, minimapWidth, minimapHeight);

    // Draw miniature layer boxes
    layers.forEach((l) => {
      if (!l.visible) return;
      const lx = l.transform.x * scale;
      const ly = l.transform.y * scale;
      const lw = Math.max(2, l.transform.width * scale);
      const lh = Math.max(2, l.transform.height * scale);

      ctx.fillStyle =
        l.type === 'text'
          ? 'rgba(99, 102, 241, 0.6)'
          : l.type === 'shape'
          ? 'rgba(255, 0, 127, 0.6)'
          : 'rgba(0, 242, 254, 0.6)';
      ctx.fillRect(lx - lw / 2, ly - lh / 2, lw, lh);
    });

    // Draw visible viewport rectangle
    const visibleWidthOnCanvas = stageContainerWidth / viewportZoom;
    const visibleHeightOnCanvas = stageContainerHeight / viewportZoom;

    const visibleCenterX = canvas.width / 2 - viewportPan.x / viewportZoom;
    const visibleCenterY = canvas.height / 2 - viewportPan.y / viewportZoom;

    const rectX = (visibleCenterX - visibleWidthOnCanvas / 2) * scale;
    const rectY = (visibleCenterY - visibleHeightOnCanvas / 2) * scale;
    const rectW = visibleWidthOnCanvas * scale;
    const rectH = visibleHeightOnCanvas * scale;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(rectX, rectY, rectW, rectH);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rectX, rectY, rectW, rectH);
  }, [canvas, layers, viewportZoom, viewportPan, stageContainerWidth, stageContainerHeight]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = clickX / scale;
    const targetCanvasY = clickY / scale;

    const newPanX = (canvas.width / 2 - targetCanvasX) * viewportZoom;
    const newPanY = (canvas.height / 2 - targetCanvasY) * viewportZoom;

    setViewportPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  return (
    <div className="absolute bottom-4 right-4 z-20 bg-[#11131a]/90 backdrop-blur-md p-2 rounded-xl border border-[#222734] shadow-2xl flex flex-col gap-1.5 select-none">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-slate-300">
          <Navigation className="w-3 h-3 text-indigo-400" /> Navigator
        </span>
        <span>{Math.round(viewportZoom * 100)}%</span>
      </div>

      <canvas
        ref={canvasRef}
        width={minimapWidth}
        height={minimapHeight}
        onClick={handleMinimapClick}
        className="rounded border border-[#222734] cursor-crosshair block"
        title="Click to pan viewport"
      />
    </div>
  );
};
