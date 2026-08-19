export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'vector' | 'text';
  muted: boolean;
  locked: boolean;
  solo: boolean;
  height: number;
}

export interface PlayheadState {
  currentTime: number; // in seconds
  isPlaying: boolean;
  isLooping: boolean;
  zoom: number; // pixels per second in timeline ruler (e.g. 100px/s)
  scrollLeft: number;
}

export interface DraggingClipState {
  layerId: string;
  initialStartTime: number;
  initialEndTime: number;
  initialMouseX: number;
  mode: 'move' | 'trim-start' | 'trim-end';
}
