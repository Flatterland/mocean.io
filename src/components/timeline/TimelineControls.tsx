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
  ChevronRight,
  MousePointer,
  Hand,
  Search,
  FastForward,
  Rewind,
  Bookmark,
  Radio
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { formatTime } from '../../utils/math2d';
import { ActiveTool } from '../../types/project';

export const TimelineControls: React.FC = () => {
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    playbackSpeed,
    shuttleForward,
    shuttleReverse,
    shuttlePause,
    isLooping,
    setIsLooping,
    zoom,
    setZoom,
    canvas,
    selectedLayerIds,
    splitLayerAtPlayhead,
    deleteLayers,
    activeTool,
    setActiveTool,
    setMarkIn,
    setMarkOut,
    startMotionPathRecording,
  } = useProjectStore();

  const handleStepFrame = (frames: number) => {
    const frameDuration = 1 / canvas.fps;
    setCurrentTime(currentTime + frames * frameDuration);
  };

  const tools: { id: ActiveTool; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Selection Tool', shortcut: 'V', icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: 'razor', label: 'Razor Tool', shortcut: 'C', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'hand', label: 'Hand Tool', shortcut: 'H', icon: <Hand className="w-3.5 h-3.5" /> },
    { id: 'zoom', label: 'Zoom Tool', shortcut: 'Z', icon: <Search className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-10 bg-[#11131a] border-b border-[#222734] px-4 flex items-center justify-between select-none shrink-0">
      {/* Left: Playback & Shuttle (J-K-L) & Timecode */}
      <div className="flex items-center gap-2.5">
        {/* Premiere Shuttle: J (Reverse) */}
        <button
          onClick={shuttleReverse}
          className={`p-1.5 rounded transition-colors ${
            isPlaying && playbackSpeed < 0
              ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Shuttle Reverse (J) — Press repeatedly for faster speed"
        >
          <Rewind className="w-3.5 h-3.5" />
        </button>

        {/* Play/Pause (K / Space) */}
        <button
          onClick={isPlaying ? shuttlePause : togglePlay}
          className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-glow-accent transition-all active:scale-95"
          title="Play/Pause (Space or K)"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
        </button>

        {/* Premiere Shuttle: L (Forward) */}
        <button
          onClick={shuttleForward}
          className={`p-1.5 rounded transition-colors ${
            isPlaying && playbackSpeed > 0 && playbackSpeed !== 1
              ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Shuttle Forward (L) — Press repeatedly for 2x, 4x"
        >
          <FastForward className="w-3.5 h-3.5" />
        </button>

        {/* Rewind */}
        <button
          onClick={() => setCurrentTime(0)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Rewind to start (Home)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Step frame */}
        <div className="flex items-center">
          <button
            onClick={() => handleStepFrame(-1)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Previous frame (Left Arrow)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStepFrame(1)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Next frame (Right Arrow)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timecode */}
        <div className="bg-[#181b24] px-2.5 py-0.5 rounded-md border border-[#222734] font-mono text-xs font-bold text-indigo-300">
          {formatTime(currentTime, canvas.fps)}
          {playbackSpeed !== 1 && isPlaying && (
            <span className="text-[10px] text-cyan-400 ml-1.5 font-bold font-sans">
              {playbackSpeed > 0 ? `${playbackSpeed}x` : `-${Math.abs(playbackSpeed)}x`}
            </span>
          )}
        </div>

        {/* Loop */}
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

      {/* Center: Premiere Tool Selector & In/Out Mark */}
      <div className="flex items-center gap-2">
        {/* Premiere Tools (V, C, H, Z) */}
        <div className="flex bg-[#181b24] p-0.5 rounded-lg border border-[#222734] gap-0.5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold transition-all ${
                activeTool === tool.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              {tool.icon}
              <span className="font-mono text-[10px]">{tool.shortcut}</span>
            </button>
          ))}
        </div>

        {/* Record Motion Path Gesture Button */}
        {selectedLayerIds.length > 0 && (
          <button
            onClick={() => startMotionPathRecording(selectedLayerIds[0])}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            title="Record Freehand Mouse Path Motion"
          >
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Draw Path</span>
          </button>
        )}

        {/* Mark In / Out */}
        <div className="flex bg-[#181b24] p-0.5 rounded-lg border border-[#222734] gap-0.5 text-xs font-mono">
          <button
            onClick={() => setMarkIn()}
            className="px-1.5 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700"
            title="Mark In point (I)"
          >
            [ I
          </button>
          <button
            onClick={() => setMarkOut()}
            className="px-1.5 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700"
            title="Mark Out point (O)"
          >
            O ]
          </button>
        </div>

        {/* Split Clip */}
        <button
          onClick={() => {
            if (selectedLayerIds.length > 0) {
              splitLayerAtPlayhead(selectedLayerIds[0]);
            }
          }}
          disabled={selectedLayerIds.length === 0}
          className="flex items-center gap-1 px-2 py-1 bg-[#181b24] hover:bg-[#222734] disabled:opacity-40 text-slate-300 text-xs font-medium rounded-md border border-[#222734] transition-colors"
          title="Split Layer (Ctrl+K or S)"
        >
          <Scissors className="w-3 h-3 text-indigo-400" />
          <span>Cut</span>
        </button>

        {selectedLayerIds.length > 0 && (
          <button
            onClick={() => deleteLayers(selectedLayerIds)}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
            title="Delete Selected (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right: Timeline Zoom */}
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
