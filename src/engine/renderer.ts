import { CanvasSettings } from '../types/project';
import { Layer } from '../types/layer';
import { computeLayerState, computeGlyphAnimations, AnimatedLayerState } from './animator';
import { layoutText } from './textLayout';
import { degreesToRadians, Point } from '../utils/math2d';

// Image cache to prevent reloading during playback and export
const imageCache = new Map<string, HTMLImageElement>();
// Video element cache for synchronized playback
const videoCache = new Map<string, HTMLVideoElement>();

export function getCachedImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) {
    const img = imageCache.get(src)!;
    return img.complete ? img : null;
  }
  const img = new Image();
  if (src.startsWith('http://') || src.startsWith('https://')) {
    img.crossOrigin = 'anonymous';
  }
  img.src = src;
  imageCache.set(src, img);
  return null;
}

export function getCachedVideo(src: string): HTMLVideoElement {
  if (videoCache.has(src)) {
    return videoCache.get(src)!;
  }
  const video = document.createElement('video');
  if (src.startsWith('http://') || src.startsWith('https://')) {
    video.crossOrigin = 'anonymous';
  }
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.autoplay = false;
  videoCache.set(src, video);
  return video;
}

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  canvasSettings: CanvasSettings;
  layers: Layer[];
  currentTime: number;
  isPlaying?: boolean;
  selectedLayerIds?: string[];
  showGizmos?: boolean;
  showSafeAreas?: boolean;
  viewportScale?: number;
}

export function renderFrame(options: RenderOptions) {
  const {
    ctx,
    canvasSettings,
    layers,
    currentTime,
    isPlaying = false,
    selectedLayerIds = [],
    showGizmos = false,
    showSafeAreas = false,
  } = options;

  const { width, height, backgroundColor } = canvasSettings;

  ctx.save();

  // 1. Clear background
  ctx.fillStyle = backgroundColor || '#090a0f';
  ctx.fillRect(0, 0, width, height);

  // 2. Sort layers by trackIndex / z-order
  const sortedLayers = [...layers].sort((a, b) => a.trackIndex - b.trackIndex);

  // 3. Render active layers
  for (const layer of sortedLayers) {
    if (!layer.visible) continue;

    const state = computeLayerState(layer, currentTime);
    if (!state.isActive || state.style.opacity <= 0) continue;

    renderLayer(ctx, state, currentTime, isPlaying);
  }

  // 4. Render motion path trail for selected layers (if enabled)
  if (showGizmos) {
    for (const layerId of selectedLayerIds) {
      const targetLayer = layers.find((l) => l.id === layerId);
      if (targetLayer && targetLayer.animations.motionPath?.points?.length) {
        renderMotionPathTrail(ctx, targetLayer.animations.motionPath.points);
      }
    }
  }

  // 5. Safe area guides (if enabled)
  if (showSafeAreas) {
    renderSafeAreas(ctx, width, height);
  }

  // 6. Gizmos & Selection overlays
  if (showGizmos && selectedLayerIds.length > 0) {
    for (const layerId of selectedLayerIds) {
      const targetLayer = layers.find((l) => l.id === layerId);
      if (targetLayer && targetLayer.visible) {
        const state = computeLayerState(targetLayer, currentTime);
        renderLayerGizmo(ctx, state);
      }
    }
  }

  ctx.restore();
}

function renderLayer(
  ctx: CanvasRenderingContext2D,
  state: AnimatedLayerState,
  currentTime: number,
  isPlaying: boolean
) {
  const { layer, transform, style, maskWipeProgress = 1, glitchOffset } = state;

  ctx.save();

  ctx.globalAlpha = style.opacity;
  ctx.globalCompositeOperation = style.blendMode || 'source-over';

  if (style.blur > 0) {
    ctx.filter = `blur(${style.blur}px)`;
  }

  if (style.shadowBlur > 0) {
    ctx.shadowColor = style.shadowColor || 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = style.shadowBlur;
    ctx.shadowOffsetX = style.shadowOffsetX || 0;
    ctx.shadowOffsetY = style.shadowOffsetY || 0;
  }

  const posX = transform.x + (glitchOffset?.x || 0);
  const posY = transform.y + (glitchOffset?.y || 0);

  ctx.translate(posX, posY);
  ctx.rotate(degreesToRadians(transform.rotation));
  ctx.scale(transform.scaleX, transform.scaleY);

  if (maskWipeProgress < 1) {
    ctx.beginPath();
    const clipWidth = transform.width * maskWipeProgress;
    ctx.rect(-transform.width / 2, -transform.height / 2, clipWidth, transform.height);
    ctx.clip();
  }

  switch (layer.type) {
    case 'text':
      renderTextLayer(ctx, state, currentTime);
      break;
    case 'shape':
      renderShapeLayer(ctx, state);
      break;
    case 'image':
      renderImageLayer(ctx, state);
      break;
    case 'video':
      renderVideoLayer(ctx, state, currentTime, isPlaying);
      break;
    default:
      break;
  }

  ctx.restore();
}

function renderTextLayer(ctx: CanvasRenderingContext2D, state: AnimatedLayerState, currentTime: number) {
  const { layer, style } = state;
  if (!layer.text) return;

  const layout = layoutText(ctx, layer.text);
  const glyphs = computeGlyphAnimations(layer, layout.glyphs, currentTime);

  ctx.font = `${layer.text.fontStyle} ${layer.text.fontWeight} ${layer.text.fontSize}px "${layer.text.fontFamily}", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  let fillStyle: string | CanvasGradient = style.fill;
  if (style.gradient && style.gradient.stops.length > 0) {
    const grad = ctx.createLinearGradient(-layout.totalWidth / 2, 0, layout.totalWidth / 2, 0);
    style.gradient.stops.forEach((s) => grad.addColorStop(s.offset, s.color));
    fillStyle = grad;
  }

  glyphs.forEach((g) => {
    if (!g.visible || g.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha *= g.opacity;

    if (g.blur > 0) {
      ctx.filter = `blur(${g.blur}px)`;
    }

    ctx.translate(g.x, g.y);
    if (g.rotation !== 0) ctx.rotate(degreesToRadians(g.rotation));
    if (g.scaleX !== 1 || g.scaleY !== 1) ctx.scale(g.scaleX, g.scaleY);

    ctx.fillStyle = fillStyle;
    ctx.fillText(g.char, 0, 0);

    if (style.strokeWidth > 0 && style.stroke) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(g.char, 0, 0);
    }

    ctx.restore();
  });
}

function renderShapeLayer(ctx: CanvasRenderingContext2D, state: AnimatedLayerState) {
  const { layer, transform, style, strokeDashOffset = 0 } = state;
  if (!layer.shape) return;

  const w = transform.width;
  const h = transform.height;
  const { shapeType, cornerRadius = 0, points = 5, innerRadiusRatio = 0.4 } = layer.shape;

  ctx.beginPath();

  if (shapeType === 'rectangle' || shapeType === 'pill') {
    const rad = shapeType === 'pill' ? Math.min(w, h) / 2 : cornerRadius;
    if (ctx.roundRect) {
      ctx.roundRect(-w / 2, -h / 2, w, h, rad);
    } else {
      ctx.rect(-w / 2, -h / 2, w, h);
    }
  } else if (shapeType === 'circle') {
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shapeType === 'triangle') {
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.closePath();
  } else if (shapeType === 'star') {
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * innerRadiusRatio;
    const step = Math.PI / points;
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shapeType === 'arrow') {
    const headW = w * 0.4;
    const shaftH = h * 0.35;
    ctx.moveTo(-w / 2, -shaftH / 2);
    ctx.lineTo(w / 2 - headW, -shaftH / 2);
    ctx.lineTo(w / 2 - headW, -h / 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2 - headW, h / 2);
    ctx.lineTo(w / 2 - headW, shaftH / 2);
    ctx.lineTo(-w / 2, shaftH / 2);
    ctx.closePath();
  }

  if (style.fill) {
    let fillStyle: string | CanvasGradient = style.fill;
    if (style.gradient && style.gradient.stops.length > 0) {
      const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      style.gradient.stops.forEach((s) => grad.addColorStop(s.offset, s.color));
      fillStyle = grad;
    }
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  if (style.strokeWidth > 0 && style.stroke) {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;
    if (strokeDashOffset > 0) {
      ctx.setLineDash([20, 10]);
      ctx.lineDashOffset = strokeDashOffset;
    }
    ctx.stroke();
  }
}

function renderImageLayer(ctx: CanvasRenderingContext2D, state: AnimatedLayerState) {
  const { layer, transform } = state;
  if (!layer.image?.src) return;

  const img = getCachedImage(layer.image.src);
  if (img) {
    const w = transform.width;
    const h = transform.height;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-transform.width / 2, -transform.height / 2, transform.width, transform.height);
  }
}

function renderVideoLayer(
  ctx: CanvasRenderingContext2D,
  state: AnimatedLayerState,
  currentTime: number,
  isPlaying: boolean
) {
  const { layer, transform } = state;
  if (!layer.video?.src) return;

  const video = getCachedVideo(layer.video.src);
  const w = transform.width;
  const h = transform.height;

  // Calculate synchronized video seek time
  const localTime = Math.max(0, currentTime - layer.startTime);
  const targetSeekTime = (layer.video.trimStart || 0) + localTime * (layer.video.playbackRate || 1.0);

  if (isPlaying) {
    if (video.paused) {
      video.playbackRate = layer.video.playbackRate || 1.0;
      video.play().catch(() => {});
    }
    // Only adjust seek time if video jumped/drifted by more than 0.6s to avoid seeking stutter
    if (Math.abs(video.currentTime - targetSeekTime) > 0.6) {
      video.currentTime = targetSeekTime;
    }
  } else {
    if (!video.paused) {
      video.pause();
    }
    // Smooth scrubbing when paused
    if (Math.abs(video.currentTime - targetSeekTime) > 0.02) {
      video.currentTime = targetSeekTime;
    }
  }

  // Draw video frame if metadata/dimensions exist (videoWidth > 0 or readyState >= 1)
  if (video.videoWidth > 0 || video.readyState >= 1) {
    try {
      ctx.drawImage(video, -w / 2, -h / 2, w, h);
    } catch {
      drawVideoPlaceholder(ctx, w, h);
    }
  } else {
    drawVideoPlaceholder(ctx, w, h);
  }
}

function drawVideoPlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#181b24';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
}

function renderMotionPathTrail(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Draw points
  ctx.fillStyle = '#00f2fe';
  points.forEach((pt, index) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, index === 0 || index === points.length - 1 ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function renderSafeAreas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);

  const actionX = width * 0.05;
  const actionY = height * 0.05;
  const actionW = width * 0.9;
  const actionH = height * 0.9;
  ctx.strokeRect(actionX, actionY, actionW, actionH);

  ctx.strokeStyle = 'rgba(255, 0, 127, 0.25)';
  const titleX = width * 0.1;
  const titleY = height * 0.1;
  const titleW = width * 0.8;
  const titleH = height * 0.8;
  ctx.strokeRect(titleX, titleY, titleW, titleH);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 20, height / 2);
  ctx.lineTo(width / 2 + 20, height / 2);
  ctx.moveTo(width / 2, height / 2 - 20);
  ctx.lineTo(width / 2, height / 2 + 20);
  ctx.stroke();

  ctx.restore();
}

function renderLayerGizmo(ctx: CanvasRenderingContext2D, state: AnimatedLayerState) {
  const { transform } = state;
  const w = transform.width;
  const h = transform.height;

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.rotate(degreesToRadians(transform.rotation));

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  const handleSize = 8;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;

  const handlePositions = [
    { x: -w / 2, y: -h / 2 },
    { x: 0, y: -h / 2 },
    { x: w / 2, y: -h / 2 },
    { x: w / 2, y: 0 },
    { x: w / 2, y: h / 2 },
    { x: 0, y: h / 2 },
    { x: -w / 2, y: h / 2 },
    { x: -w / 2, y: 0 },
  ];

  handlePositions.forEach((pos) => {
    ctx.fillRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
  });

  const rotDist = 24;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(0, -h / 2 - rotDist);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -h / 2 - rotDist, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#6366f1';
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
