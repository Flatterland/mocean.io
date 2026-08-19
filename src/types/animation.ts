export type EasingType =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInOutExpo'
  | 'easeInBack'
  | 'easeOutBack'
  | 'easeInOutBack'
  | 'easeOutElastic'
  | 'easeInOutElastic'
  | 'easeOutBounce'
  | 'springWobbly'
  | 'springGentle'
  | 'springSnappy';

export type MotionPresetType =
  // Text In Presets
  | 'text_kinetic_pop'
  | 'text_typewriter'
  | 'text_word_stagger_up'
  | 'text_letter_bounce'
  | 'text_blur_flare_in'
  | 'text_glitch_reveal'
  | 'text_flip_drop'
  | 'text_mask_wipe_left'
  | 'text_mask_wipe_up'
  | 'text_elastic_zoom'
  | 'text_smooth_fade_slide'
  // Text Out Presets
  | 'text_out_fade_down'
  | 'text_out_blur_disperse'
  | 'text_out_elastic_shrink'
  | 'text_out_glitch_vanish'
  | 'text_out_mask_wipe'
  // Continuous/Loop Presets
  | 'loop_breathing_pulse'
  | 'loop_neon_glow_pulse'
  | 'loop_floating_hover'
  | 'loop_kinetic_wave'
  | 'loop_shake_vibe'
  | 'loop_gradient_shimmer'
  // Shape/Image Presets
  | 'shape_elastic_pop'
  | 'shape_spin_bloom'
  | 'shape_dash_draw'
  | 'image_ken_burns'
  | 'image_drop_bounce'
  | 'image_parallax_tilt';

export type PresetCategory = 'in' | 'out' | 'loop' | 'custom';

export interface MotionPresetConfig {
  id: MotionPresetType;
  name: string;
  category: PresetCategory;
  description: string;
  duration: number;
  staggerDelay?: number;
  easing: EasingType;
  parameters?: Record<string, number | string | boolean>;
}

export type AnimatableProperty =
  | 'x'
  | 'y'
  | 'z'
  | 'scaleX'
  | 'scaleY'
  | 'rotation'
  | 'rotateX'
  | 'rotateY'
  | 'opacity'
  | 'blur'
  | 'extrusionDepth';

export interface Keyframe {
  id: string;
  time: number; // in seconds relative to layer start (0.0 to layerDuration)
  value: number;
  easing: EasingType;
}

export interface PropertyTrack {
  property: AnimatableProperty;
  keyframes: Keyframe[];
}
