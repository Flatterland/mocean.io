import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { formatTime } from '../../utils/math2d';

export const TimelineControls: React.FC = () => {
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    isLooping,
    setIsLooping,
    zoom,
    setZoom,
    canvas,
    selectedLayerIds,
    splitLayerAtPlayhead,
    deleteLayers,
  } = useProjectStore();

  const handleStepFrame = (frames: number) => {
    const frameDuration = 1 / canvas.fps;
    setCurrentTime(currentTime + frames * frameDuration);
  };

  return (
    <div className="h-10 bg-[#11131a] border-b border-[#222734] px-4 flex items-center justify-between select-none shrink-0">
      {/* Left: Playback Controls & Timecode */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-glow-accent transition-all active:scale-95"
          title="Play/Pause (Space)"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        {/* Rewind to start */}
        <button
          onClick={() => setCurrentTime(0)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Rewind to start (Home)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Step frame back/forward */}
        <div className="flex items-center">
          <button
            onClick={() => handleStepFrame(-1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Previous frame"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStepFrame(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Next frame"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timecode display */}
        <div className="bg-[#181b24] px-3 py-1 rounded-md border border-[#222734] font-mono text-xs font-bold text-indigo-300">
          {formatTime(currentTime, canvas.fps)}
          <span className="text-slate-500 font-normal ml-1">/ {formatTime(canvas.duration, canvas.fps)}</span>
        </div>

        {/* Loop toggle */}
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`p-1.5 rounded transition-colors ${
            isLooping
              ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Loop Playback"
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Split & Edit Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (selectedLayerIds.length > 0) {
              splitLayerAtPlayhead(selectedLayerIds[0]);
            }
          }}
          disabled={selectedLayerIds.length === 0}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181b24] hover:bg-[#222734] disabled:opacity-40 disabled:hover:bg-[#181b24] text-slate-300 text-xs font-medium rounded-md border border-[#222734] transition-colors"
          title="Split Layer at Playhead (S)"
        >
          <Scissors className="w-3.5 h-3.5 text-indigo-400" />
          <span>Split (S)</span>
        </button>

        {selectedLayerIds.length > 0 && (
          <button
            onClick={() => deleteLayers(selectedLayerIds)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-medium rounded-md border border-rose-800/40 transition-colors"
            title="Delete Selected (Del)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Right: Timeline Zoom Slider */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom(zoom - 20)}
          className="text-slate-400 hover:text-white"
          title="Zoom Out Timeline"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min="50"
          max="300"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
          className="w-24 accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded"
        />

        <button
          onClick={() => setZoom(zoom + 20)}
          className="text-slate-400 hover:text-white"
          title="Zoom In Timeline"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
