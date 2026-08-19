import React, { useRef, useEffect } from 'react';
import { TimelineControls } from './TimelineControls';
import { TimelineRuler } from './TimelineRuler';
import { TrackItem } from './TrackItem';
import { useProjectStore } from '../../store/projectStore';
import { Eye, EyeOff, Lock, Unlock, Plus } from 'lucide-react';

export const Timeline: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    canvas,
    layers,
    zoom,
    currentTime,
    setCurrentTime,
    selectedLayerIds,
    selectLayer,
    updateLayer,
    addVideoLayer,
    addImageLayer,
  } = useProjectStore();

  const timelineWidth = Math.max(1200, (canvas.duration + 1) * zoom);
  const sortedLayers = [...layers].sort((a, b) => b.trackIndex - a.trackIndex);

  // Auto-scroll timeline during playback
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const playheadPx = currentTime * zoom;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    if (playheadPx > scrollLeft + clientWidth - 50) {
      container.scrollLeft = playheadPx - clientWidth + 100;
    } else if (playheadPx < scrollLeft) {
      container.scrollLeft = Math.max(0, playheadPx - 50);
    }
  }, [currentTime, zoom]);

  // Drag and drop video/image directly onto timeline tracks
  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleTimelineDrop = (e: React.DragEvent) => {
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

  return (
    <div className="h-64 bg-[#11131a] border-t border-[#222734] flex flex-col select-none shrink-0 z-20">
      {/* Top Controls Bar */}
      <TimelineControls />

      {/* Main Track Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Headers */}
        <div className="w-56 bg-[#0d0e14] border-r border-[#222734] flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="h-7 border-b border-[#222734] px-3 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#0a0b10]">
            <span>Tracks ({sortedLayers.length})</span>
          </div>

          <div className="flex-1">
            {sortedLayers.map((layer) => {
              const isSelected = selectedLayerIds.includes(layer.id);

              return (
                <div
                  key={layer.id}
                  onClick={(e) => selectLayer(layer.id, e.shiftKey)}
                  className={`h-11 border-b border-[#222734]/80 px-3 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-950/40 border-l-2 border-l-indigo-500' : 'hover:bg-[#181b24]'
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-300 truncate max-w-[110px]">
                    {layer.name}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { visible: !layer.visible });
                      }}
                      className={`p-1 rounded hover:bg-slate-700/50 ${
                        layer.visible ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { locked: !layer.locked });
                      }}
                      className={`p-1 rounded hover:bg-slate-700/50 ${
                        layer.locked ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Scrollable Tracks Timeline Canvas */}
        <div
          ref={scrollContainerRef}
          onDragOver={handleTimelineDragOver}
          onDrop={handleTimelineDrop}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#090a0f] custom-scrollbar"
        >
          <TimelineRuler timelineWidth={timelineWidth} />

          <div
            className="relative min-h-[calc(100%-28px)]"
            style={{ width: timelineWidth }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
              setCurrentTime(Math.max(0, Math.min(canvas.duration, clickX / zoom)));
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #181b24 1px, transparent 1px)`,
                backgroundSize: `${zoom}px 100%`,
              }}
            />

            {sortedLayers.map((layer) => (
              <div
                key={layer.id}
                className="h-11 border-b border-[#222734]/60 relative"
              >
                <TrackItem layer={layer} zoom={zoom} />
              </div>
            ))}

            <div
              className="absolute top-0 bottom-0 w-[1.5px] bg-red-500 pointer-events-none z-30 shadow-glow-cyan"
              style={{ left: currentTime * zoom }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
