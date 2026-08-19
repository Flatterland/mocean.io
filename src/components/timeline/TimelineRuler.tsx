import React, { useRef } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { formatTime } from '../../utils/math2d';

interface TimelineRulerProps {
  timelineWidth: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ timelineWidth }) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const { canvas, currentTime, setCurrentTime, zoom } = useProjectStore();

  const duration = canvas.duration;
  const totalSeconds = Math.ceil(duration);

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const handleMove = (moveEvent: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left;
      const nextTime = Math.max(0, Math.min(canvas.duration, clickX / zoom));
      setCurrentTime(nextTime);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    if (rulerRef.current) {
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      setCurrentTime(Math.max(0, Math.min(canvas.duration, clickX / zoom)));
    }
  };

  const secondMarkers = [];
  for (let s = 0; s <= totalSeconds; s++) {
    secondMarkers.push(s);
  }

  const markInPx = canvas.markIn !== undefined ? canvas.markIn * zoom : 0;
  const markOutPx = canvas.markOut !== undefined ? canvas.markOut * zoom : canvas.duration * zoom;

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleRulerMouseDown}
      className="h-7 bg-[#0d0e14] border-b border-[#222734] relative cursor-pointer select-none overflow-hidden"
      style={{ width: timelineWidth }}
    >
      {/* Shaded Work Area (In to Out) */}
      {(canvas.markIn !== undefined || canvas.markOut !== undefined) && (
        <div
          className="absolute top-0 bottom-0 bg-indigo-500/15 border-x border-indigo-400/50 pointer-events-none"
          style={{
            left: markInPx,
            width: Math.max(0, markOutPx - markInPx),
          }}
        />
      )}

      {/* Ticks and second numbers */}
      {secondMarkers.map((sec) => {
        const left = sec * zoom;
        return (
          <div key={sec} className="absolute top-0 bottom-0 pointer-events-none" style={{ left }}>
            <div className="h-3 w-[1px] bg-slate-600" />
            <span className="absolute top-2.5 left-1 text-[9px] font-mono text-slate-400 font-medium select-none">
              {sec}s
            </span>

            <div className="absolute top-0 left-[25%] h-1.5 w-[1px] bg-slate-800" style={{ left: zoom * 0.25 }} />
            <div className="absolute top-0 left-[50%] h-2 w-[1px] bg-slate-700" style={{ left: zoom * 0.5 }} />
            <div className="absolute top-0 left-[75%] h-1.5 w-[1px] bg-slate-800" style={{ left: zoom * 0.75 }} />
          </div>
        );
      })}

      {/* Playhead Marker Head */}
      <div
        className="absolute top-0 bottom-0 w-3 -ml-1.5 pointer-events-none z-20"
        style={{ left: currentTime * zoom }}
      >
        <div className="w-3 h-3 bg-red-500 rounded-b-sm shadow-md" />
        <div className="w-[1.5px] h-full bg-red-500 mx-auto shadow-sm" />
      </div>
    </div>
  );
};
