import { EasingType } from '../types/animation';

export function evaluateEasing(type: EasingType, t: number): number {
  let clampT = Math.max(0, Math.min(1, t));

  switch (type) {
    case 'linear':
      return clampT;

    case 'easeInQuad':
      return clampT * clampT;
    case 'easeOutQuad':
      return clampT * (2 - clampT);
    case 'easeInOutQuad':
      return clampT < 0.5 ? 2 * clampT * clampT : -1 + (4 - 2 * clampT) * clampT;

    case 'easeInCubic':
      return clampT * clampT * clampT;
    case 'easeOutCubic': {
      const t1 = clampT - 1;
      return t1 * t1 * t1 + 1;
    }
    case 'easeInOutCubic':
      return clampT < 0.5 ? 4 * clampT * clampT * clampT : (clampT - 1) * (2 * clampT - 2) * (2 * clampT - 2) + 1;

    case 'easeInQuart':
      return clampT * clampT * clampT * clampT;
    case 'easeOutQuart': {
      const t1 = clampT - 1;
      return 1 - t1 * t1 * t1 * t1;
    }
    case 'easeInOutQuart': {
      const t1 = clampT - 1;
      return clampT < 0.5 ? 8 * clampT * clampT * clampT * clampT : 1 - 8 * t1 * t1 * t1 * t1;
    }

    case 'easeInExpo':
      return clampT === 0 ? 0 : Math.pow(2, 10 * (clampT - 1));
    case 'easeOutExpo':
      return clampT === 1 ? 1 : 1 - Math.pow(2, -10 * clampT);
    case 'easeInOutExpo': {
      if (clampT === 0) return 0;
      if (clampT === 1) return 1;
      let tExp = clampT * 2;
      if (tExp < 1) return 0.5 * Math.pow(2, 10 * (tExp - 1));
      tExp -= 1;
      return 0.5 * (-Math.pow(2, -10 * tExp) + 2);
    }

    case 'easeInBack': {
      const s = 1.70158;
      return clampT * clampT * ((s + 1) * clampT - s);
    }
    case 'easeOutBack': {
      const s = 1.70158;
      const t1 = clampT - 1;
      return t1 * t1 * ((s + 1) * t1 + s) + 1;
    }
    case 'easeInOutBack': {
      const s = 1.70158 * 1.525;
      let t2 = clampT * 2;
      if (t2 < 1) return 0.5 * (t2 * t2 * ((s + 1) * t2 - s));
      t2 -= 2;
      return 0.5 * (t2 * t2 * ((s + 1) * t2 + s) + 2);
    }

    case 'easeOutElastic': {
      const p = 0.3;
      return Math.pow(2, -10 * clampT) * Math.sin(((clampT - p / 4) * (2 * Math.PI)) / p) + 1;
    }
    case 'easeInOutElastic': {
      const p = 0.45;
      const t3 = clampT * 2;
      if (t3 === 0) return 0;
      if (t3 === 2) return 1;
      if (t3 < 1) {
        return -0.5 * (Math.pow(2, 10 * (t3 - 1)) * Math.sin(((t3 - 1 - p / 4) * (2 * Math.PI)) / p));
      }
      return Math.pow(2, -10 * (t3 - 1)) * Math.sin(((t3 - 1 - p / 4) * (2 * Math.PI)) / p) * 0.5 + 1;
    }

    case 'easeOutBounce': {
      let t4 = clampT;
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t4 < 1 / d1) {
        return n1 * t4 * t4;
      } else if (t4 < 2 / d1) {
        return n1 * (t4 -= 1.5 / d1) * t4 + 0.75;
      } else if (t4 < 2.5 / d1) {
        return n1 * (t4 -= 2.25 / d1) * t4 + 0.9375;
      } else {
        return n1 * (t4 -= 2.625 / d1) * t4 + 0.984375;
      }
    }

    case 'springWobbly': {
      const w = 18;
      const z = 0.4;
      return 1 - Math.exp(-z * w * clampT) * Math.cos(w * Math.sqrt(1 - z * z) * clampT);
    }

    case 'springGentle': {
      const w = 12;
      const z = 0.8;
      return 1 - Math.exp(-z * w * clampT) * Math.cos(w * Math.sqrt(1 - z * z) * clampT);
    }

    case 'springSnappy': {
      const w = 22;
      const z = 0.65;
      return 1 - Math.exp(-z * w * clampT) * Math.cos(w * Math.sqrt(1 - z * z) * clampT);
    }

    default:
      return clampT;
  }
}
