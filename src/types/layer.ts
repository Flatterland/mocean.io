import { MotionPresetType, PropertyTrack } from './animation';

export type LayerType = 'text' | 'shape' | 'image' | 'vector' | 'audio' | 'group';

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
}

export interface Transform {
  x: number; // Center X in canvas coordinates
  y: number; // Center Y in canvas coordinates
  scaleX: number; // default 1
  scaleY: number; // default 1
  rotation: number; // in degrees
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
  brightness: number; // 1.0 default
  contrast: number; // 1.0 default
  saturate: number; // 1.0 default
  hueRotate: number; // in degrees
}

export interface AudioProperties {
  src: string;
  volume: number; // 0 to 1
  muted: boolean;
  fadeIn: number; // duration in seconds
  fadeOut: number; // duration in seconds
}

export interface LayerAnimationSettings {
  inPreset?: MotionPresetType;
  inDuration: number; // e.g. 0.8s
  inStagger: number; // e.g. 0.04s per char/word

  outPreset?: MotionPresetType;
  outDuration: number; // e.g. 0.6s

  loopPreset?: MotionPresetType;
  loopSpeed: number; // e.g. 1.0 multiplier
  loopIntensity: number; // e.g. 1.0 multiplier

  propertyTracks?: PropertyTrack[];
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;

  // Timeline position
  startTime: number; // in seconds
  endTime: number; // in seconds
  trackIndex: number; // Vertical track row in timeline

  // Spatial & style
  transform: Transform;
  style: LayerStyle;
  animations: LayerAnimationSettings;

  // Type specific properties
  text?: TextProperties;
  shape?: ShapeProperties;
  vector?: VectorProperties;
  image?: ImageProperties;
  audio?: AudioProperties;
}
