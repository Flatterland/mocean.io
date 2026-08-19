import React, { useState } from 'react';
import { Layer } from '../../types/layer';
import { useProjectStore } from '../../store/projectStore';
import { Type, Square, Image as ImageIcon, Video as VideoIcon, Sparkles, Repeat, LogOut, ArrowRightCircle } from 'lucide-react';
import { MOTION_PRESETS } from '../../presets/motionPresets';

interface TrackItemProps {
  layer: Layer;
  zoom: number;
}

export const TrackItem: React.FC<TrackItemProps> = ({ layer, zoom }) => {
  const {
    selectedLayerIds,
    selectLayer,
    updateLayer,
    splitLayerAtPlayhead,
    activeTool,
    saveHistory,
    canvas,
  } = useProjectStore();

  const isSelected = selectedLayerIds.includes(layer.id);
  const left = layer.startTime * zoom;
  const width = Math.max(20, (layer.endTime - layer.startTime) * zoom);

  const [dragMode, setDragMode] = useState<'move' | 'trim-left' | 'trim-right' | null>(null);

  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'trim-left' | 'trim-right') => {
    e.stopPropagation();

    // Razor Tool click on clip
    if (activeTool === 'razor') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickedTime = layer.startTime + clickX / zoom;
      splitLayerAtPlayhead(layer.id, clickedTime);
      return;
    }

    selectLayer(layer.id, e.shiftKey);
    saveHistory();
    setDragMode(mode);

    const startMouseX = e.clientX;
    const initialStart = layer.startTime;
    const initialEnd = layer.endTime;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaTime = deltaX / zoom;

      if (mode === 'move') {
        const duration = initialEnd - initialStart;
        let nextStart = Math.max(0, initialStart + deltaTime);
        if (nextStart + duration > canvas.duration) {
          nextStart = canvas.duration - duration;
        }
        updateLayer(layer.id, {
          startTime: nextStart,
          endTime: nextStart + duration,
        });
      } else if (mode === 'trim-left') {
        const nextStart = Math.max(0, Math.min(initialEnd - 0.2, initialStart + deltaTime));
        updateLayer(layer.id, { startTime: nextStart });
      } else if (mode === 'trim-right') {
        const nextEnd = Math.min(canvas.duration, Math.max(initialStart + 0.2, initialEnd + deltaTime));
        updateLayer(layer.id, { endTime: nextEnd });
      }
    };

    const handleMouseUp = () => {
      setDragMode(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getBadgeColors = () => {
    switch (layer.type) {
      case 'text':
        return 'from-indigo-600/90 to-purple-700/90 border-indigo-500/70 text-indigo-100';
      case 'shape':
        return 'from-pink-600/90 to-rose-700/90 border-pink-500/70 text-pink-100';
      case 'image':
        return 'from-cyan-600/90 to-blue-700/90 border-cyan-500/70 text-cyan-100';
      case 'video':
        return 'from-emerald-600/90 to-teal-700/90 border-emerald-500/70 text-emerald-100';
      default:
        return 'from-slate-700 to-slate-800 border-slate-600 text-slate-200';
    }
  };

  const inPresetConfig = layer.animations.inPreset ? MOTION_PRESETS[layer.animations.inPreset] : null;
  const loopPresetConfig = layer.animations.loopPreset ? MOTION_PRESETS[layer.animations.loopPreset] : null;
  const outPresetConfig = layer.animations.outPreset ? MOTION_PRESETS[layer.animations.outPreset] : null;

  // Extract all keyframe timestamps
  const allKeyframes: { time: number; property: string }[] = [];
  if (layer.animations.propertyTracks) {
    layer.animations.propertyTracks.forEach((track) => {
      track.keyframes.forEach((kf) => {
        allKeyframes.push({ time: kf.time, property: track.property });
      });
    });
  }

  return (
    <div
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      className={`absolute top-1 bottom-1 rounded-lg border bg-gradient-to-r ${getBadgeColors()} cursor-grab active:cursor-grabbing flex items-center justify-between px-2 text-xs shadow-md transition-shadow group select-none ${
        isSelected ? 'ring-2 ring-white shadow-glow-accent' : 'hover:brightness-110'
      }`}
      style={{ left, width }}
    >
      {/* Left Trim Handle */}
      <div
        onMouseDown={(e) => handleMouseDown(e, 'trim-left')}
        className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/50 rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
        title="Trim start"
      />

      {/* Clip Content & Motion Badges */}
      <div className="flex items-center gap-1.5 overflow-hidden truncate">
        {layer.type === 'text' && <Type className="w-3 h-3 shrink-0" />}
        {layer.type === 'shape' && <Square className="w-3 h-3 shrink-0" />}
        {layer.type === 'image' && <ImageIcon className="w-3 h-3 shrink-0" />}
        {layer.type === 'video' && <VideoIcon className="w-3 h-3 shrink-0 text-emerald-300" />}

        <span className="font-semibold text-[11px] truncate">{layer.name}</span>

        {inPresetConfig && width > 120 && (
          <span className="flex items-center gap-0.5 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono border border-white/10 shrink-0">
            <ArrowRightCircle className="w-2.5 h-2.5 text-emerald-300" />
            <span className="truncate max-w-[80px]">{inPresetConfig.name}</span>
          </span>
        )}

        {loopPresetConfig && width > 200 && (
          <span className="flex items-center gap-0.5 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono border border-white/10 shrink-0">
            <Repeat className="w-2.5 h-2.5 text-cyan-300" />
            <span className="truncate max-w-[80px]">{loopPresetConfig.name}</span>
          </span>
        )}

        {outPresetConfig && width > 280 && (
          <span className="flex items-center gap-0.5 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono border border-white/10 shrink-0">
            <LogOut className="w-2.5 h-2.5 text-rose-300" />
            <span className="truncate max-w-[80px]">{outPresetConfig.name}</span>
          </span>
        )}
      </div>

      {/* Keyframe Diamond Indicators */}
      {allKeyframes.map((kf, i) => (
        <div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 border border-black transform rotate-45 pointer-events-none shadow-sm"
          style={{ left: `${(kf.time / (layer.endTime - layer.startTime)) * 100}%` }}
          title={`Keyframe: ${kf.property} at ${kf.time.toFixed(2)}s`}
        />
      ))}

      {/* Right Trim Handle */}
      <div
        onMouseDown={(e) => handleMouseDown(e, 'trim-right')}
        className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/50 rounded-r cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
        title="Trim end"
      />
    </div>
  );
};
