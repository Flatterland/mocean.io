import { Layer, Transform, LayerStyle } from '../types/layer';
import { GlyphLayout } from './textLayout';
import { evaluateEasing } from './easings';
import { MOTION_PRESETS } from '../presets/motionPresets';
import { clamp, lerp } from '../utils/math2d';
import { AnimatableProperty } from '../types/animation';

export interface AnimatedGlyphState {
  char: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  blur: number;
  visible: boolean;
}

export interface AnimatedLayerState {
  layer: Layer;
  isActive: boolean;
  transform: Transform;
  style: LayerStyle;
  glyphs?: AnimatedGlyphState[];
  maskWipeProgress?: number;
  strokeDashOffset?: number;
  glitchOffset?: { x: number; y: number };
}

export function computeLayerState(layer: Layer, currentTime: number): AnimatedLayerState {
  const isActive = currentTime >= layer.startTime && currentTime <= layer.endTime;

  const transform: Transform = { ...layer.transform };
  const style: LayerStyle = { ...layer.style };

  if (!isActive) {
    return {
      layer,
      isActive: false,
      transform,
      style: { ...style, opacity: 0 },
    };
  }

  const localTime = currentTime - layer.startTime;
  const timeRemaining = layer.endTime - currentTime;

  const {
    inPreset,
    inDuration,
    outPreset,
    outDuration,
    loopPreset,
    loopSpeed = 1,
    propertyTracks,
    motionPath,
  } = layer.animations;

  let currentScaleX = 1;
  let currentScaleY = 1;
  let currentOffsetX = 0;
  let currentOffsetY = 0;
  let currentRotation = 0;
  let currentOpacity = 1;
  let currentBlur = style.blur || 0;
  let maskWipeProgress = 1;
  let glitchOffset = { x: 0, y: 0 };
  let strokeDashOffset = 0;

  // 1. EVALUATE FREEHAND MOUSE MOTION PATH (if present)
  if (motionPath && motionPath.points && motionPath.points.length > 1) {
    const points = motionPath.points;
    const pathTotalTime = points[points.length - 1].time;
    // Map localTime into path duration
    const clampedTime = Math.max(0, Math.min(pathTotalTime, localTime));

    // Find bounding points
    let p0 = points[0];
    let p1 = points[points.length - 1];

    for (let i = 0; i < points.length - 1; i++) {
      if (clampedTime >= points[i].time && clampedTime <= points[i + 1].time) {
        p0 = points[i];
        p1 = points[i + 1];
        break;
      }
    }

    const segmentDuration = p1.time - p0.time;
    const factor = segmentDuration > 0 ? (clampedTime - p0.time) / segmentDuration : 0;

    transform.x = lerp(p0.x, p1.x, factor);
    transform.y = lerp(p0.y, p1.y, factor);
  }

  // 2. EVALUATE CUSTOM PROPERTY KEYFRAMES
  if (propertyTracks && propertyTracks.length > 0) {
    propertyTracks.forEach((track) => {
      if (!track.keyframes || track.keyframes.length === 0) return;

      const kfs = [...track.keyframes].sort((a, b) => a.time - b.time);

      let val: number;
      if (localTime <= kfs[0].time) {
        val = kfs[0].value;
      } else if (localTime >= kfs[kfs.length - 1].time) {
        val = kfs[kfs.length - 1].value;
      } else {
        // Interpolate between two keyframes
        let k0 = kfs[0];
        let k1 = kfs[1];
        for (let i = 0; i < kfs.length - 1; i++) {
          if (localTime >= kfs[i].time && localTime <= kfs[i + 1].time) {
            k0 = kfs[i];
            k1 = kfs[i + 1];
            break;
          }
        }
        const span = k1.time - k0.time;
        const rawProgress = span > 0 ? (localTime - k0.time) / span : 0;
        const progress = evaluateEasing(k1.easing || 'easeOutQuad', rawProgress);
        val = lerp(k0.value, k1.value, progress);
      }

      switch (track.property) {
        case 'x':
          transform.x = val;
          break;
        case 'y':
          transform.y = val;
          break;
        case 'z':
          transform.z = val;
          break;
        case 'scaleX':
          transform.scaleX = val;
          break;
        case 'scaleY':
          transform.scaleY = val;
          break;
        case 'rotation':
          transform.rotation = val;
          break;
        case 'rotateX':
          transform.rotateX = val;
          break;
        case 'rotateY':
          transform.rotateY = val;
          break;
        case 'opacity':
          style.opacity = val;
          break;
        case 'blur':
          style.blur = val;
          break;
        case 'extrusionDepth':
          style.extrusionDepth = val;
          break;
        default:
          break;
      }
    });
  }

  // 3. EVALUATE ENTRANCE (IN) PRESET
  if (inPreset && localTime < inDuration) {
    const config = MOTION_PRESETS[inPreset];
    const progress = clamp(localTime / inDuration, 0, 1);
    const eased = evaluateEasing(config ? config.easing : 'easeOutExpo', progress);

    switch (inPreset) {
      case 'text_kinetic_pop':
      case 'shape_elastic_pop': {
        const s = evaluateEasing('springSnappy', progress);
        currentScaleX = s;
        currentScaleY = s;
        currentOffsetY = (1 - eased) * 60;
        currentOpacity = clamp(progress * 3, 0, 1);
        break;
      }

      case 'text_word_stagger_up':
      case 'text_smooth_fade_slide': {
        currentOffsetY = (1 - eased) * 80;
        currentOpacity = eased;
        break;
      }

      case 'text_blur_flare_in': {
        currentScaleX = 0.85 + 0.15 * eased;
        currentScaleY = 0.85 + 0.15 * eased;
        currentBlur += (1 - eased) * 24;
        currentOpacity = eased;
        break;
      }

      case 'text_elastic_zoom': {
        const s = 2.4 - 1.4 * evaluateEasing('easeOutElastic', progress);
        currentScaleX = s;
        currentScaleY = s;
        currentOpacity = clamp(progress * 2, 0, 1);
        break;
      }

      case 'text_flip_drop': {
        currentOffsetY = -(1 - eased) * 120;
        currentScaleY = Math.abs(Math.cos((1 - eased) * Math.PI * 1.5));
        currentOpacity = clamp(progress * 2, 0, 1);
        break;
      }

      case 'shape_spin_bloom': {
        const s = evaluateEasing('easeOutBack', progress);
        currentScaleX = s;
        currentScaleY = s;
        currentRotation = (1 - eased) * -180;
        currentOpacity = clamp(progress * 2.5, 0, 1);
        break;
      }

      case 'shape_dash_draw': {
        strokeDashOffset = (1 - eased) * 1000;
        break;
      }

      case 'image_drop_bounce': {
        const b = evaluateEasing('easeOutBounce', progress);
        currentOffsetY = -(1 - b) * 300;
        currentRotation = (1 - eased) * -15;
        break;
      }

      case 'image_parallax_tilt': {
        currentScaleX = 1.2 - 0.2 * eased;
        currentScaleY = 1.2 - 0.2 * eased;
        currentOffsetX = (1 - eased) * 80;
        currentOpacity = eased;
        break;
      }

      case 'text_glitch_reveal': {
        if (progress < 1) {
          glitchOffset = {
            x: (Math.random() - 0.5) * 16 * (1 - progress),
            y: (Math.random() - 0.5) * 8 * (1 - progress),
          };
          currentOpacity = Math.random() > 0.2 ? 1 : 0.4;
        }
        break;
      }

      case 'text_mask_wipe_left':
      case 'text_mask_wipe_up': {
        maskWipeProgress = eased;
        break;
      }

      default:
        break;
    }
  }

  // 4. EVALUATE CONTINUOUS (LOOP) PRESET
  if (loopPreset) {
    switch (loopPreset) {
      case 'loop_breathing_pulse': {
        const pulse = Math.sin(localTime * 2.5 * loopSpeed) * 0.05;
        currentScaleX *= 1 + pulse;
        currentScaleY *= 1 + pulse;
        break;
      }

      case 'loop_floating_hover': {
        currentOffsetY += Math.sin(localTime * 2 * loopSpeed) * 12;
        currentRotation += Math.cos(localTime * 1.5 * loopSpeed) * 1.5;
        break;
      }

      case 'loop_neon_glow_pulse': {
        const glow = 0.5 + 0.5 * Math.sin(localTime * 4 * loopSpeed);
        style.shadowBlur = (style.shadowBlur || 15) * (0.6 + 0.8 * glow);
        break;
      }

      case 'loop_shake_vibe': {
        currentOffsetX += Math.sin(localTime * 30) * 3;
        currentOffsetY += Math.cos(localTime * 35) * 3;
        break;
      }

      case 'image_ken_burns': {
        const kbProgress = (localTime % 8) / 8;
        currentScaleX *= 1 + kbProgress * 0.15;
        currentScaleY *= 1 + kbProgress * 0.15;
        currentOffsetX += kbProgress * 20;
        break;
      }

      default:
        break;
    }
  }

  // 5. EVALUATE EXIT (OUT) PRESET
  if (outPreset && timeRemaining < outDuration && timeRemaining >= 0) {
    const outProgress = 1 - timeRemaining / outDuration;
    const config = MOTION_PRESETS[outPreset];
    const eased = evaluateEasing(config ? config.easing : 'easeInQuad', outProgress);

    switch (outPreset) {
      case 'text_out_fade_down': {
        currentOffsetY += eased * 80;
        currentOpacity *= 1 - eased;
        break;
      }

      case 'text_out_blur_disperse': {
        currentScaleX *= 1 + eased * 0.3;
        currentScaleY *= 1 + eased * 0.3;
        currentBlur += eased * 30;
        currentOpacity *= 1 - eased;
        break;
      }

      case 'text_out_elastic_shrink': {
        const s = Math.max(0, 1 - evaluateEasing('easeInBack', outProgress));
        currentScaleX *= s;
        currentScaleY *= s;
        currentOpacity *= 1 - outProgress;
        break;
      }

      case 'text_out_glitch_vanish': {
        glitchOffset = {
          x: (Math.random() - 0.5) * 25 * outProgress,
          y: (Math.random() - 0.5) * 12 * outProgress,
        };
        currentOpacity *= Math.random() > outProgress ? 1 : 0;
        break;
      }

      case 'text_out_mask_wipe': {
        maskWipeProgress = 1 - eased;
        break;
      }

      default:
        break;
    }
  }

  // Merge computed transforms
  transform.x += currentOffsetX;
  transform.y += currentOffsetY;
  transform.scaleX *= currentScaleX;
  transform.scaleY *= currentScaleY;
  transform.rotation += currentRotation;

  style.opacity = Math.max(0, Math.min(1, style.opacity * currentOpacity));
  style.blur = Math.max(0, currentBlur);

  return {
    layer,
    isActive: true,
    transform,
    style,
    maskWipeProgress,
    strokeDashOffset,
    glitchOffset,
  };
}

export function computeGlyphAnimations(
  layer: Layer,
  glyphs: GlyphLayout[],
  currentTime: number
): AnimatedGlyphState[] {
  const localTime = currentTime - layer.startTime;
  const { inPreset, inDuration, inStagger = 0.03, staggerUnit = 'character' } = {
    ...layer.animations,
    staggerUnit: layer.text?.staggerUnit || 'character',
  };

  return glyphs.map((glyph, index) => {
    let unitIndex = glyph.charIndex;
    if (staggerUnit === 'word') unitIndex = glyph.wordIndex;
    else if (staggerUnit === 'line') unitIndex = glyph.lineIndex;

    const charStartTime = unitIndex * inStagger;
    const charLocalTime = localTime - charStartTime;

    let charX = glyph.x;
    let charY = glyph.y;
    let charScaleX = 1;
    let charScaleY = 1;
    let charRotation = 0;
    let charOpacity = 1;
    let charBlur = 0;
    let visible = true;

    if (inPreset && inPreset.startsWith('text_')) {
      if (charLocalTime < 0) {
        visible = false;
        charOpacity = 0;
      } else if (charLocalTime < inDuration) {
        const p = clamp(charLocalTime / inDuration, 0, 1);
        const config = MOTION_PRESETS[inPreset];
        const eased = evaluateEasing(config ? config.easing : 'easeOutExpo', p);

        switch (inPreset) {
          case 'text_typewriter': {
            visible = true;
            charOpacity = 1;
            break;
          }

          case 'text_letter_bounce': {
            const bounce = evaluateEasing('springWobbly', p);
            charY -= (1 - bounce) * 90;
            charScaleX = bounce;
            charScaleY = bounce;
            charOpacity = clamp(p * 2.5, 0, 1);
            break;
          }

          case 'text_kinetic_pop': {
            const pop = evaluateEasing('springSnappy', p);
            charScaleX = pop;
            charScaleY = pop;
            charY += (1 - eased) * 40;
            charOpacity = clamp(p * 3, 0, 1);
            break;
          }

          case 'text_word_stagger_up': {
            charY += (1 - eased) * 60;
            charOpacity = eased;
            break;
          }

          case 'text_blur_flare_in': {
            charBlur = (1 - eased) * 18;
            charOpacity = eased;
            charScaleX = 0.8 + 0.2 * eased;
            charScaleY = 0.8 + 0.2 * eased;
            break;
          }

          case 'text_flip_drop': {
            charY -= (1 - eased) * 80;
            charScaleY = Math.abs(Math.cos((1 - eased) * Math.PI));
            charRotation = (1 - eased) * 20;
            charOpacity = clamp(p * 2, 0, 1);
            break;
          }

          default:
            break;
        }
      }
    }

    // Continuous letter wave
    if (layer.animations.loopPreset === 'loop_kinetic_wave') {
      const wavePhase = localTime * 4 - index * 0.3;
      charY += Math.sin(wavePhase) * 10;
      charScaleY *= 1 + Math.cos(wavePhase) * 0.15;
    }

    return {
      char: glyph.char,
      x: charX,
      y: charY,
      scaleX: charScaleX,
      scaleY: charScaleY,
      rotation: charRotation,
      opacity: charOpacity,
      blur: charBlur,
      visible,
    };
  });
}
