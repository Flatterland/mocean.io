export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9' | 'custom';

export type ResolutionPreset = '4K' | '1440p' | '1080p' | '720p' | '4K_Vertical' | '1080p_Vertical' | 'Square_HD' | 'Custom';

export type WorkspaceLayout = 'default' | 'timeline' | 'typography' | 'minimal';

export type ActiveTool = 'select' | 'razor' | 'hand' | 'zoom' | 'motion-record';

export type StageMode = '2d' | '3d';

export interface ThreeDViewSettings {
  rotateX: number; // degrees
  rotateY: number; // degrees
  zoom: number; // multiplier
  panX: number;
  panY: number;
  layerSpacing: number; // px separation along Z
  perspective: number; // px
  showWireframes: boolean;
  showDepthLines: boolean;
  showLayerBadges: boolean;
  autoRotate: boolean;
}

export interface CanvasSettings {
  width: number;
  height: number;
  fps: number; // 30 or 60
  duration: number; // in seconds, e.g. 5.0
  backgroundColor: string;
  aspectRatio: AspectRatio;
  preset: ResolutionPreset;
  markIn?: number;
  markOut?: number;
}

export interface ExportSettings {
  resolution: ResolutionPreset;
  width: number;
  height: number;
  fps: number;
  format: 'mp4' | 'webm' | 'gif' | 'png_sequence';
  codec: 'avc1.640033' | 'avc1.4d002a' | 'vp9' | 'vp8';
  bitrateMbps: number;
}

export const RESOLUTION_PRESETS: Record<ResolutionPreset, { name: string; width: number; height: number; aspectRatio: AspectRatio }> = {
  '4K': { name: '4K Ultra HD (16:9)', width: 3840, height: 2160, aspectRatio: '16:9' },
  '1440p': { name: '2K Quad HD (16:9)', width: 2560, height: 1440, aspectRatio: '16:9' },
  '1080p': { name: 'Full HD (16:9)', width: 1920, height: 1080, aspectRatio: '16:9' },
  '720p': { name: 'HD (16:9)', width: 1280, height: 720, aspectRatio: '16:9' },
  '4K_Vertical': { name: '4K Vertical Reels / TikTok (9:16)', width: 2160, height: 3840, aspectRatio: '9:16' },
  '1080p_Vertical': { name: 'Full HD Vertical (9:16)', width: 1080, height: 1920, aspectRatio: '9:16' },
  'Square_HD': { name: 'Square HD (1:1)', width: 1080, height: 1080, aspectRatio: '1:1' },
  'Custom': { name: 'Custom Resolution', width: 1920, height: 1080, aspectRatio: 'custom' },
};
