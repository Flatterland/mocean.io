import { MotionPresetType, PropertyTrack } from './animation';

export type LayerType = 'text' | 'shape' | 'image' | 'video' | 'vector' | 'audio' | 'group';

export type ShapeType = 'rectangle' | 'circle' | 'star' | 'polygon' | 'triangle' | 'arrow' | 'pill' | 'heart';

export interface GradientStop {
  color: string;
  offset: number; // 0.0 to 1.0
}

export interface GradientFill {
  type: 'linear' | 'radial';
  angle: number; // in degrees
  stops: GradientStop[];
}

export interface LayerStyle {
  fill: string; // Hex, rgba, or gradient
  gradient?: GradientFill;
  stroke: string;
  strokeWidth: number;
  strokeDash?: number[];
  opacity: number; // 0.0 to 1.0
  blur: number; // in px
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  blendMode: GlobalCompositeOperation;
  extrusionDepth?: number; // 3D thickness / slab depth in px (e.g. 0 to 60)
  extrusionColor?: string; // 3D side wall bevel color
}

export interface Transform {
  x: number; // Center X in canvas coordinates
  y: number; // Center Y in canvas coordinates
  z?: number; // 3D depth offset in canvas Z-coordinates (default 0)
  scaleX: number; // default 1
  scaleY: number; // default 1
  rotation: number; // in degrees (Z-rotation)
  rotateX?: number; // 3D pitch tilt in degrees (default 0)
  rotateY?: number; // 3D yaw tilt in degrees (default 0)
  anchorX: number; // 0.5 is center
  anchorY: number; // 0.5 is center
  width: number;
  height: number;
}

export interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number; // in px
  lineHeight: number; // multiplier, e.g. 1.2
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  staggerUnit: 'character' | 'word' | 'line';
}

export interface ShapeProperties {
  shapeType: ShapeType;
  cornerRadius: number;
  points?: number; // for stars/polygons
  innerRadiusRatio?: number; // for stars (e.g. 0.4)
  closed: boolean;
}

export interface VectorProperties {
  svgPath: string;
  viewBox: string;
}

export interface ImageProperties {
  src: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatioLock: boolean;
  brightness: number;
  contrast: number;
  saturate: number;
  hueRotate: number;
}

export interface VideoProperties {
  src: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatioLock: boolean;
  volume: number; // 0.0 to 1.0
  muted: boolean;
  playbackRate: number; // 1.0 default
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
}

export interface AudioProperties {
  src: string;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
}

export interface MotionPathPoint {
  x: number;
  y: number;
  z?: number; // 3D elevation / depth
  time: number; // relative to layer startTime
}

export interface MotionPathData {
  points: MotionPathPoint[];
  showPathTrail: boolean;
}

export interface LayerAnimationSettings {
  inPreset?: MotionPresetType;
  inDuration: number;
  inStagger: number;

  outPreset?: MotionPresetType;
  outDuration: number;

  loopPreset?: MotionPresetType;
  loopSpeed: number;
  loopIntensity: number;

  propertyTracks?: PropertyTrack[];
  motionPath?: MotionPathData;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;

  // Timeline position
  startTime: number;
  endTime: number;
  trackIndex: number;

  // Spatial & style
  transform: Transform;
  style: LayerStyle;
  animations: LayerAnimationSettings;

  // Type specific properties
  text?: TextProperties;
  shape?: ShapeProperties;
  vector?: VectorProperties;
  image?: ImageProperties;
  video?: VideoProperties;
  audio?: AudioProperties;
}
