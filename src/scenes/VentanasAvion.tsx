import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {beat, clamp, easeOut, prog, window01} from './helpers';

// ---------- Piezas reutilizables ----------
const Plane: React.FC<{rounded: boolean; stripe: string; split?: number}> = ({rounded, stripe, split = 0}) => {
  const windows = Array.from({length: 12}, (_, i) => -300 + i * 48);
  const body = <>
    <path d="M -405 -5 L -450 -160 L -385 -160 L -290 -40 Z" fill="url(#metal)"/>
    <path d="M -405 -5 L -450 -160 L -430 -160 L -385 -40 Z" fill={stripe} opacity=".9"/>
    <path d="M -390 -42 H 320 C 380 -42 420 -20 428 0 C 420 22 380 42 320 42 H -360 C -385 42 -400 20 -405 -5 Z" fill="url(#metal)"/>
    <path d="M -390 14 H 410 C 400 30 370 42 320 42 H -360 C -380 42 -394 30 -400 14 Z" fill="#7d8b98" opacity=".55"/>
    <rect x="-390" y="6" width="760" height="6" fill={stripe}/>
    {windows.map(x => <rect key={x} x={x} y={-24} width={22} height={22} rx={rounded ? 9 : 1.5} fill="#16304d" stroke="#0b1a2b" strokeWidth="2"/>)}
    <path d="M 372 -26 L 398 -26 L 412 -10 L 380 -10 Z" fill="#16304d"/>
    <ellipse cx="-372" cy="18" rx="62" ry="9" fill="#aab6c1"/>
    <path d="M -20 22 L -170 128 L -118 132 L 70 30 Z" fill="#c9d3dc"/>
    <rect x="-130" y="58" width="86" height="28" rx="13" fill="#8c99a6"/>
  </>;
  if (!split) return <g>{body}</g>;
  // Ruptura en vuelo: la parte delantera y la trasera se separan.
  return <g>
    <g clipPath="url(#rear)" transform={`translate(${-split * 70} ${split * 50}) rotate(${-split * 12} -60 0)`}>{body}</g>
    <g clipPath="url(#front)" transform={`translate(${split * 90} ${split * 30}) rotate(${split * 9} -60 0)`}>{body}</g>
    {Array.from({length: 10}, (_, i) => <rect key={i} x={-70 + (i % 5) * 10} y={-30 + Math.floor(i / 5) * 30} width={8 + (i % 3) * 4} height={6 + (i % 2) * 5}
      fill="#c9d3dc" opacity={1 - split * .6}
      transform={`translate(${(i - 5) * 22 * split} ${(i % 4 - 1.5) * 50 * split + 120 * split * split}) rotate(${i * 47 * split})`}/>)}
  </g>;
};

const Chip: React.FC<{text: string; y: number; t: number; at: number; until?: number; color: string; ink?: string}> = ({text, y, t, at, until = 1e9, color, ink = '#0b1214'}) => {
  const o = window01(t, at, until, .3);
  if (o <= 0) return null;
  const k = prog(t, at, at + .35, easeOut);
  const w = text.length * 25 + 70;
  return <g transform={`translate(540 ${y}) scale(${.7 + .3 * k})`} opacity={o}>
    <rect x={-w / 2} y={-38} width={w} height={76} rx={38} fill={color} filter="url(#shadow)"/>
    <text x={0} y={13} textAnchor="middle" fontSize="40" fontWeight="900" fill={ink} fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">{text}</text>
  </g>;
};

const Clouds: React.FC<{t: number; speed: number}> = ({t, speed}) => <g opacity=".5">
  {Array.from({length: 7}, (_, i) => {
    const x = ((i * 233 - t * speed * (1 + i % 3 * .4)) % 1500 + 1500) % 1500 - 200;
    return <ellipse key={i} cx={x} cy={300 + (i * 211) % 1100} rx={150 + (i % 3) * 70} ry={34 + (i % 2) * 14} fill="#c9dcef" opacity={.12 + (i % 3) * .05} filter="url(#soft)"/>;
  })}
</g>;

// ---------- Escena ----------
export const VentanasAvion: React.FC<SceneProps> = ({time: t, captions, duration, accent}) => {
  const T = {
    comet: beat(captions, 'comet', 5),
    crash: beat(captions, 'desintegraron', 9),
    press: beat(captions, 'presion', 14),
    corner: beat(captions, 'esquinas', 18),
    crack: beat(captions, 'grietas', 21),
    curve: beat(captions, 'curva', 25),
    hoy: beat(captions, 'hoy', 28),
  };
  const red = '#ff4d4d', cyan = '#5fe3ff';

  // Escena 1: el Comet en vuelo, acercamiento a las ventanas y ruptura.
  const s1 = window01(t, -1, T.press, .4);
  const zoom = 1 + .55 * prog(t, T.comet, T.crash - .2);
  const split = prog(t, T.crash, T.crash + 1.6, easeOut);
  const shake = t > T.crash ? Math.sin(t * 70) * 14 * interpolate(t, [T.crash, T.crash + .9], [1, 0], clamp) : 0;
  const flash = t > T.crash ? interpolate(t, [T.crash, T.crash + .12, T.crash + .8], [0, .5, 0], clamp) : 0;
  const fly = interpolate(t, [0, 1.2], [-260, 0], {...clamp, easing: easeOut});

  // Escena 2: la ventana y las fuerzas.
  const s2 = window01(t, T.press - .3, T.hoy, .4);
  const enter2 = prog(t, T.press - .3, T.press + .5, easeOut);
  const round = prog(t, T.curve, T.curve + 1.2);
  const r = 6 + 124 * round;
  const stress = prog(t, T.corner - .2, T.corner + .6);
  const glow = stress * (1 - round);
  const crack = prog(t, T.crack, T.crack + 1.6, easeOut) * (1 - prog(t, T.curve, T.curve + .6));
  const half = 150;
  const lineColor = (i: number) => {
    const inner = Math.abs(i) <= 2;
    return round > .5 ? cyan : inner ? red : '#ffb3a6';
  };
  const flow = (y0: number, i: number) => {
    // Línea de tensión que rodea la ventana: con esquinas rectas se amontona en ellas; con curvas fluye suave.
    const pass = Math.abs(y0) < half + 60;
    if (!pass) return `M -470 ${y0} H 470`;
    const s = Math.sign(y0 || 1);
    const yo = s * (half + 26 + Math.abs(y0) * .22);
    const soft = 60 + 140 * round;
    return `M -470 ${y0} H ${-half - soft} C ${-half - soft * .3} ${y0}, ${-half - 10} ${yo}, ${-half + 30} ${yo} H ${half - 30} C ${half + 10} ${yo}, ${half + soft * .3} ${y0}, ${half + soft} ${y0} H 470`;
  };
  const arrows = [0, 45, 90, 135, 180, 225, 270, 315];
  const pulse = (Math.sin(t * 5) + 1) / 2;

  // Escena 3: hoy, avión moderno con ventanas redondeadas.
  const s3 = window01(t, T.hoy - .3, duration + 1, .4);
  const fly3 = interpolate(t, [T.hoy - .3, T.hoy + 1], [300, 0], {...clamp, easing: easeOut});

  return <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
    <defs>
      <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stopColor="#14365a"/><stop offset=".6" stopColor="#0a1a2e"/><stop offset="1" stopColor="#040a12"/></radialGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f8fb"/><stop offset=".55" stopColor="#c9d3dc"/><stop offset="1" stopColor="#8794a1"/></linearGradient>
      <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c4ced8"/><stop offset=".5" stopColor="#9aa8b6"/><stop offset="1" stopColor="#6e7d8c"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2c5d8a"/><stop offset=".5" stopColor="#123150"/><stop offset="1" stopColor="#081a2c"/></linearGradient>
      <radialGradient id="hot"><stop offset="0" stopColor={red} stopOpacity=".95"/><stop offset=".4" stopColor={red} stopOpacity=".45"/><stop offset="1" stopColor={red} stopOpacity="0"/></radialGradient>
      <clipPath id="rear"><rect x="-600" y="-400" width="540" height="800"/></clipPath>
      <clipPath id="front"><rect x="-60" y="-400" width="700" height="800"/></clipPath>
      <filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="glowf"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="shadow"><feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity=".5"/></filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    {/* Cuadrícula tipo plano técnico */}
    <g opacity=".07" stroke="#9fd3ff" strokeWidth="1.5">
      {Array.from({length: 20}, (_, i) => <line key={`v${i}`} x1={i * 60 - (t * 8) % 60} y1="0" x2={i * 60 - (t * 8) % 60} y2="1920"/>)}
      {Array.from({length: 33}, (_, i) => <line key={`h${i}`} x1="0" y1={i * 60} x2="1080" y2={i * 60}/>)}
    </g>

    {s1 > 0 && <g opacity={s1}>
      <Clouds t={t} speed={70}/>
      <g transform={`translate(${540 + fly + shake} ${820 + Math.sin(t * 1.3) * 10}) scale(${zoom}) translate(${-(zoom - 1) * 40} 0)`}>
        <Plane rounded={false} stripe="#c0392b" split={split}/>
      </g>
      <Chip text="1954 · DE HAVILLAND COMET" y={420} t={t} at={T.comet} until={T.crash + .2} color="#ffffff"/>
      <Chip text="SE ROMPIÓ EN PLENO VUELO" y={420} t={t} at={T.crash + .3} until={T.press} color={red} ink="#fff"/>
      <rect width="1080" height="1920" fill={red} opacity={flash}/>
    </g>}

    {s2 > 0 && <g opacity={s2} transform={`translate(540 820) scale(${.82 + .18 * enter2})`}>
      {/* Placa del fuselaje con remaches */}
      <rect x="-470" y="-470" width="940" height="940" rx="28" fill="url(#plate)"/>
      {Array.from({length: 13}, (_, i) => [-440, 440].map(x => <circle key={`${i}${x}`} cx={x} cy={-420 + i * 70} r="7" fill="#5c6a78"/>))}
      {Array.from({length: 13}, (_, i) => [-440, 440].map(y => <circle key={`r${i}${y}`} cx={-420 + i * 70} cy={y} r="7" fill="#5c6a78"/>))}
      {/* Líneas de tensión */}
      {stress > 0 && <g opacity={stress} fill="none" strokeLinecap="round">
        {[-4, -3, -2, -1, 1, 2, 3, 4].map(i => {
          const y0 = i * 62;
          return <path key={i} d={flow(y0, i)} stroke={lineColor(i)} strokeWidth={Math.abs(i) <= 2 && round < .5 ? 9 : 6}
            strokeDasharray="22 16" strokeDashoffset={-t * 90} opacity=".9"/>;
        })}
      </g>}
      {/* Puntos calientes en las esquinas */}
      {glow > 0 && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) =>
        <circle key={`${sx}${sy}`} cx={sx * half} cy={sy * half} r={(70 + 30 * pulse) * glow} fill="url(#hot)"/>)}
      {/* Grietas que nacen en las esquinas */}
      {crack > 0 && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) =>
        <polyline key={`c${sx}${sy}`} points={`${sx * half},${sy * half} ${sx * (half + 40)},${sy * (half + 22)} ${sx * (half + 62)},${sy * (half + 70)} ${sx * (half + 110)},${sy * (half + 92)} ${sx * (half + 135)},${sy * (half + 150)} ${sx * (half + 190)},${sy * (half + 172)}`}
          fill="none" stroke="#1a0b0b" strokeWidth="8" strokeLinejoin="round" strokeDasharray="420" strokeDashoffset={420 * (1 - crack)}/>)}
      {/* La ventana: de cuadrada a redondeada */}
      <rect x={-half - 22} y={-half - 22} width={(half + 22) * 2} height={(half + 22) * 2} rx={r + 18} fill="#4b5865"/>
      <rect x={-half} y={-half} width={half * 2} height={half * 2} rx={r} fill="url(#glass)" stroke={round > .5 ? cyan : '#0b1a2b'} strokeWidth={round > .5 ? 6 : 4}/>
      <path d={`M ${-half + 40} ${-half + 60} L ${-half + 110} ${-half + 25}`} stroke="#ffffff" strokeOpacity=".35" strokeWidth="14" strokeLinecap="round"/>
      {/* Presión de la cabina empujando hacia fuera */}
      {window01(t, T.press, T.corner + .3) > 0 && <g opacity={window01(t, T.press, T.corner + .3)}>
        {arrows.map(a => {
          const d = 230 + 30 * ((t * 1.6 + a / 90) % 1);
          return <g key={a} transform={`rotate(${a}) translate(${d} 0)`}>
            <path d="M -40 0 H 20" stroke="#ffd84d" strokeWidth="12" strokeLinecap="round"/>
            <path d="M 18 -20 L 48 0 L 18 20 Z" fill="#ffd84d"/>
          </g>;
        })}
      </g>}
    </g>}
    {s2 > 0 && <g opacity={s2}>
      <Chip text="PRESIÓN DE LA CABINA" y={300} t={t} at={T.press + .2} until={T.corner} color="#ffd84d"/>
      <Chip text="LA TENSIÓN SE ACUMULA AQUÍ" y={300} t={t} at={T.corner + .2} until={T.curve} color={red} ink="#fff"/>
      <Chip text="✓ LA CURVA REPARTE LA FUERZA" y={300} t={t} at={T.curve + .4} until={T.hoy} color="#3ddc97"/>
    </g>}

    {s3 > 0 && <g opacity={s3}>
      <Clouds t={t} speed={90}/>
      <g transform={`translate(${551 + fly3} ${830 + Math.sin(t * 1.3) * 10}) scale(1.02)`}>
        <Plane rounded stripe={accent}/>
      </g>
      <Chip text="HOY: ESQUINAS REDONDEADAS" y={420} t={t} at={T.hoy + .3} color="#3ddc97"/>
    </g>}
  </svg>;
};
