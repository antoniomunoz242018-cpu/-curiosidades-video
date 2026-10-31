import React from 'react';
import {interpolate} from 'remotion';
import type {Caption} from '../types';
import {beat, clamp, easeOut, prog, window01} from './helpers';

export const RED = '#ff4d4d', GREEN = '#3ddc97', CYAN = '#5fe3ff', YELLOW = '#ffd84d', INK = '#0b1214';

/** Momento de una palabra clave; si no aparece, una fracción de la duración. */
export const beats = (captions: Caption[], duration: number) =>
  (key: string, frac: number, after = 0) => beat(captions, key, frac * duration, after);

/** Lienzo SVG 1080×1920 con fondo tipo plano técnico, filtros comunes y cuadrícula en movimiento. */
export const Stage: React.FC<{t: number; top?: string; mid?: string; children: React.ReactNode}> = ({t, top = '#14365a', mid = '#0a1a2e', children}) =>
  <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
    <defs>
      <radialGradient id="stage-bg" cx="50%" cy="40%" r="75%"><stop offset="0" stopColor={top}/><stop offset=".6" stopColor={mid}/><stop offset="1" stopColor="#040a12"/></radialGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="shadow"><feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity=".5"/></filter>
      <radialGradient id="hot"><stop offset="0" stopColor={RED} stopOpacity=".95"/><stop offset=".4" stopColor={RED} stopOpacity=".45"/><stop offset="1" stopColor={RED} stopOpacity="0"/></radialGradient>
      <radialGradient id="good"><stop offset="0" stopColor={GREEN} stopOpacity=".8"/><stop offset="1" stopColor={GREEN} stopOpacity="0"/></radialGradient>
      <radialGradient id="spot"><stop offset="0" stopColor={YELLOW} stopOpacity=".55"/><stop offset="1" stopColor={YELLOW} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#stage-bg)"/>
    <g opacity=".07" stroke="#9fd3ff" strokeWidth="1.5">
      {Array.from({length: 20}, (_, i) => <line key={`v${i}`} x1={i * 60 - (t * 8) % 60} y1="0" x2={i * 60 - (t * 8) % 60} y2="1920"/>)}
      {Array.from({length: 33}, (_, i) => <line key={`h${i}`} x1="0" y1={i * 60} x2="1080" y2={i * 60}/>)}
    </g>
    {children}
  </svg>;

/** Letrero tipo píldora que aparece con un pequeño rebote. */
export const Chip: React.FC<{text: string; y: number; t: number; at: number; until?: number; color?: string; ink?: string; x?: number; size?: number}> =
  ({text, y, t, at: at0, until = 1e9, color = '#ffffff', ink = INK, x = 540, size = 40}) => {
    // Los letreros de arriba esperan a que desaparezca el gancho (primeros 3,2 s).
    const at = y < 560 ? Math.max(at0, 3.25) : at0;
    if (at >= until) return null;
    const o = window01(t, at, until, .3);
    if (o <= 0) return null;
    const k = prog(t, at, at + .35, easeOut);
    const w = text.length * size * .63 + 70;
    return <g transform={`translate(${x} ${y}) scale(${.7 + .3 * k})`} opacity={o}>
      <rect x={-w / 2} y={-size * .95} width={w} height={size * 1.9} rx={size * .95} fill={color} filter="url(#shadow)"/>
      <text x={0} y={size * .33} textAnchor="middle" fontSize={size} fontWeight="900" fill={ink} fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">{text}</text>
    </g>;
  };

/** Texto grande sin fondo (números, años…). */
export const BigText: React.FC<{text: string; x?: number; y: number; t: number; at: number; until?: number; size?: number; color?: string}> =
  ({text, x = 540, y, t, at, until = 1e9, size = 150, color = '#fff'}) => {
    const o = window01(t, at, until, .3);
    if (o <= 0) return null;
    const k = prog(t, at, at + .4, easeOut);
    return <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight="900" fill={color} opacity={o}
      fontFamily="Arial Black, Arial, sans-serif" transform={`translate(${x} ${y}) scale(${1.3 - .3 * k}) translate(${-x} ${-y})`}
      style={{filter: 'drop-shadow(0 8px 20px rgba(0,0,0,.6))'}}>{text}</text>;
  };

/** Marca ✓ o ✗ que se dibuja con trazo. */
export const Mark: React.FC<{ok: boolean; x: number; y: number; t: number; at: number; until?: number; size?: number}> = ({ok, x, y, t, at, until = 1e9, size = 90}) => {
  const o = window01(t, at, until, .25);
  if (o <= 0) return null;
  const k = prog(t, at, at + .4, easeOut);
  const c = ok ? GREEN : RED;
  return <g transform={`translate(${x} ${y}) scale(${size / 90})`} opacity={o}>
    <circle r={60 * (0.6 + .4 * k)} fill={c} filter="url(#shadow)"/>
    <path d={ok ? 'M -26 2 L -8 22 L 28 -20' : 'M -22 -22 L 22 22 M 22 -22 L -22 22'} stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none"
      strokeDasharray="120" strokeDashoffset={120 * (1 - k)}/>
  </g>;
};

/** Flecha recta animada (crece desde el origen). */
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; t: number; at: number; until?: number; color?: string; width?: number}> =
  ({x1, y1, x2, y2, t, at, until = 1e9, color = YELLOW, width = 12}) => {
    const o = window01(t, at, until, .25);
    if (o <= 0) return null;
    const k = prog(t, at, at + .45, easeOut);
    const ex = x1 + (x2 - x1) * k, ey = y1 + (y2 - y1) * k;
    const a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return <g opacity={o}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeLinecap="round"/>
      <path d={`M 0 ${-width * 1.8} L ${width * 2.6} 0 L 0 ${width * 1.8} Z`} fill={color} transform={`translate(${ex} ${ey}) rotate(${a})`}/>
    </g>;
  };

/** Escena que entra y sale con fundido y un leve zoom. */
export const Shot: React.FC<{t: number; from: number; to: number; children: React.ReactNode; cx?: number; cy?: number}> = ({t, from, to, children, cx = 540, cy = 860}) => {
  const o = window01(t, from, to, .35);
  if (o <= 0) return null;
  const k = prog(t, from - .1, from + .6, easeOut);
  const s = .9 + .1 * k + .03 * interpolate(t, [from, to], [0, 1], clamp);
  return <g opacity={o} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>{children}</g>;
};

/** Generador pseudoaleatorio estable (mismo resultado en cada fotograma). */
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
