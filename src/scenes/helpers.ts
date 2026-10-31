import {interpolate} from 'remotion';
import type {Caption} from '../types';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');

/**
 * Momento (s) en que se pronuncia la primera palabra que empieza por `key`.
 * Así cada escena cambia justo con la voz, sea cual sea su velocidad.
 */
export function beat(captions: Caption[], key: string, fallback: number, after = 0): number {
  const k = norm(key);
  for (const c of captions) for (const w of c.words) if (w.start >= after && norm(w.text).startsWith(k)) return w.start;
  return fallback;
}
/** 0→1 entre dos instantes, con suavizado. */
export const prog = (t: number, a: number, b: number, ease = easeInOut) => ease(interpolate(t, [a, Math.max(a + 0.001, b)], [0, 1], clamp));
/** Visible entre a y b con fundidos de `f` segundos. */
export const window01 = (t: number, a: number, b: number, f = 0.35) => Math.min(interpolate(t, [a, a + f], [0, 1], clamp), interpolate(t, [b - f, b], [1, 0], clamp));
