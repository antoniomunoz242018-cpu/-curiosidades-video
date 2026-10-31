import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
const KEY = 84, GAP = 8;
const keyPos = (r: number, c: number) => ({x: -((ROWS[r].length * (KEY + GAP)) / 2) + c * (KEY + GAP) + r * 22, y: (r - 1) * (KEY + GAP)});

/** Teclado con las teclas resaltables. `left`/`right`: dedos sobre la fila central. */
const Keyboard: React.FC<{t: number; bump: number; leftHand: number; rightHand: number; typing: number}> = ({t, bump, leftHand, rightHand, typing}) => <g>
  <rect x={-520} y={-190} width={1040} height={380} rx={34} fill="#141c26" stroke="#2c3c50" strokeWidth="6"/>
  {ROWS.map((row, r) => [...row].map((ch, c) => {
    const {x, y} = keyPos(r, c);
    const home = r === 1 && ((c <= 3 && leftHand > 0) || (c >= 6 && rightHand > 0));
    const fj = r === 1 && (ch === 'F' || ch === 'J');
    const pressed = typing > 0 && Math.sin(t * 18 + c * 2.3 + r * 5) > .85;
    const lift = pressed ? 5 : 0;
    return <g key={`${r}${c}`} transform={`translate(${x} ${y + lift})`}>
      <rect x={-KEY / 2} y={-KEY / 2} width={KEY} height={KEY} rx={12} fill={fj && bump > 0 ? '#2a3a20' : home ? '#203247' : '#222d3a'}
        stroke={fj && bump > 0 ? YELLOW : home ? CYAN : '#36485c'} strokeWidth={fj && bump > 0 ? 5 : 3}/>
      <text x={-22} y={-8} fontSize="28" fontWeight="800" fill="#cfe0f0" fontFamily="Arial, sans-serif">{ch}</text>
      {fj && <rect x={-16} y={22} width={32} height={7} rx={3.5} fill={bump > 0 ? YELLOW : '#56687c'}/>}
      {fj && bump > 0 && <circle cx={0} cy={25} r={30 + 6 * Math.sin(t * 6)} fill="url(#spot)" opacity={bump}/>}
    </g>;
  }))}
  <rect x={-260} y={150} width={520} height={30} rx={10} fill="#222d3a" stroke="#36485c" strokeWidth="3"/>
</g>;

/** Yemas de los dedos sobre la fila central. */
const Fingers: React.FC<{side: -1 | 1; k: number}> = ({side, k}) => {
  if (k <= 0) return null;
  const cols = side < 0 ? [0, 1, 2, 3] : [6, 7, 8, 9];
  return <g opacity={k}>
    {cols.map((c, i) => {
      const {x, y} = keyPos(1, c);
      const index = (side < 0 && c === 3) || (side > 0 && c === 6);
      return <ellipse key={c} cx={x} cy={y - 10 - (1 - k) * 160 - (index ? 0 : 0)} rx={30} ry={38} fill={index ? '#ffcf9e' : '#f2b98a'} stroke={index ? YELLOW : 'none'} strokeWidth="6" opacity=".95"/>;
    })}
  </g>;
};

export const TeclasFJ: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {rayita: B('rayita', .1), defecto: B('defecto', .16), marcas: B('marcas', .2), escribir: B('escribir', .27),
    izq: B('izquierda', .33), der: B('derecha', .44), tocar: B('tocar', .55), ojos: B('ojos', .66), laptops: B('laptops', .78), rapido: B('rapido', .92)};
  const zoom = prog(t, T.rayita - .2, T.rayita + .8) * (1 - prog(t, T.marcas, T.marcas + .8));
  const kx = -keyPos(1, 3).x * zoom * .9, ks = 1 + 1.4 * zoom;
  const left = prog(t, T.izq, T.izq + .6, easeOut), right = prog(t, T.der, T.der + .6, easeOut);
  const typing = window01(t, T.rapido - .2, duration + 1);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.laptops}>
      <g transform={`translate(${540 + kx} 900) scale(${.98 * ks})`}>
        <Keyboard t={t} bump={prog(t, .3, 1)} leftHand={left} rightHand={right} typing={0}/>
        <Fingers side={-1} k={left}/><Fingers side={1} k={right}/>
      </g>
      {/* ojos mirando la pantalla, no el teclado */}
      {window01(t, T.ojos, T.laptops + .2) > 0 && <g opacity={window01(t, T.ojos, T.laptops + .2)} transform="translate(540 1180)">
        <rect x={-150} y={-30} width={300} height={170} rx={18} fill="#0d1a28" stroke={CYAN} strokeWidth="6"/>
        {[-50, 50].map(x => <g key={x}><ellipse cx={x} cy={55} rx={40} ry={28} fill="#fff"/><circle cx={x} cy={45 + 4 * Math.sin(t * 2)} r={14} fill="#0b1214"/></g>)}
      </g>}
    </Shot>
    <Shot t={t} from={T.laptops - .2} to={duration + 1}>
      <g transform="translate(540 820)">
        <path d="M -420 -300 H 420 V 120 H -420 Z" fill="#0d1a28" stroke="#5c6f84" strokeWidth="14" strokeLinejoin="round"/>
        <rect x={-390} y={-270} width={780} height={360} fill="#10263c"/>
        {Array.from({length: 6}, (_, i) => <rect key={i} x={-350} y={-230 + i * 52} height={20} rx={10}
          width={680 * Math.min(1, Math.max(0, (t - T.rapido) * .9 - i * .35 + (i < 2 ? 1 : 0)))} fill="#cfe0f0" opacity=".55"/>)}
        <path d="M -520 120 H 520 L 470 200 H -470 Z" fill="#5c6f84"/>
        <g transform="translate(0 330) scale(.82)"><Keyboard t={t} bump={1} leftHand={1} rightHand={1} typing={typing}/><Fingers side={-1} k={1}/><Fingers side={1} k={1}/></g>
      </g>
    </Shot>

    <Chip text="ESA RAYITA EN RELIEVE" y={330} t={t} at={T.rayita} until={T.defecto} color={YELLOW}/>
    <Chip text="NO ES UN DEFECTO" y={330} t={t} at={T.defecto} until={T.marcas} color={RED} ink="#fff"/>
    <Chip text="MARCAS PARA TUS ÍNDICES" y={330} t={t} at={T.marcas + .1} until={T.izq} color={YELLOW}/>
    <Chip text="MANO IZQUIERDA: A S D F" y={330} t={t} at={T.izq} until={T.der} color={CYAN}/>
    <Chip text="MANO DERECHA: J K L Ñ" y={330} t={t} at={T.der} until={T.tocar} color={CYAN}/>
    <Chip text="POSICIÓN CORRECTA SIN MIRAR" y={330} t={t} at={T.tocar} until={T.laptops} color={GREEN} size={36}/>
    <Chip text="TAMBIÉN EN LAPTOPS" y={330} t={t} at={T.laptops} until={T.rapido} color="#ffffff"/>
    <Chip text="ESCRIBES MÁS RÁPIDO" y={330} t={t} at={T.rapido} color={GREEN}/>
    <Mark ok x={880} y={600} t={t} at={T.tocar + .3} until={T.laptops}/>
  </Stage>;
};
