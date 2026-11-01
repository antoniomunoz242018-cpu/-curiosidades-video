import React from 'react';
import {YELLOW} from './common';

/** Avión comercial de lado mirando a la derecha, centrado en (0,0), largo ~760. */
export const AirlinerSide: React.FC<{exhaust?: number; gear?: number; stripe?: string; engineOff?: boolean}> = ({exhaust = 0, gear = 0, stripe = '#2f7fd8', engineOff = false}) => <g>
  <path d="M -330 -10 L -390 -150 L -330 -150 L -230 -40 Z" fill="#dfe6ec" stroke="#9aa7b3" strokeWidth="3"/>
  <path d="M -330 -10 L -390 -150 L -362 -150 L -300 -30 Z" fill={stripe}/>
  {gear > 0 && <g opacity={gear}>
    <rect x={-60} y={40} width={10} height={60 * gear} fill="#5c6670"/><circle cx={-55} cy={40 + 60 * gear} r={16} fill="#1d2733"/>
    <rect x={250} y={40} width={8} height={50 * gear} fill="#5c6670"/><circle cx={254} cy={40 + 50 * gear} r={12} fill="#1d2733"/>
  </g>}
  <path d="M -360 -40 H 280 C 340 -40 380 -20 390 0 C 380 22 340 44 280 44 H -320 C -350 44 -365 20 -372 0 Z" fill="#f4f8fb" stroke="#9aa7b3" strokeWidth="3"/>
  <rect x={-360} y={10} width={740} height={8} fill={stripe}/>
  {Array.from({length: 16}, (_, i) => <rect key={i} x={-270 + i * 32} y={-22} width={14} height={16} rx={6} fill="#1d3550"/>)}
  <path d="M 330 -24 L 362 -24 L 376 -8 L 340 -8 Z" fill="#1d3550"/>
  <path d="M -380 6 L -440 22 L -380 30 Z" fill="#dfe6ec"/>
  <path d="M -40 26 L -170 120 L -120 124 L 80 34 Z" fill="#c9d3dc" stroke="#9aa7b3" strokeWidth="3"/>
  <g transform="translate(-80 74)">
    <rect x={-60} y={-22} width={130} height={44} rx={22} fill={engineOff ? '#7d858e' : '#b8c2cc'} stroke="#7d858e" strokeWidth="3"/>
    {exhaust > 0 && <path d={`M -60 -14 L ${-60 - 140 * exhaust} 0 L -60 14 Z`} fill="#ffb347" opacity={.7 * exhaust}/>}
  </g>
</g>;

/** Avión de frente: fuselaje, alas largas y, opcional, winglets (0..1 de lo levantados). */
export const AirlinerFront: React.FC<{winglet?: number; glowTip?: number}> = ({winglet = 1, glowTip = 0}) => {
  const tip = (s: number) => {
    const x = s * 470, a = winglet * 75 * s;
    return <g transform={`translate(${x} -6) rotate(${-a})`}>
      <path d={`M 0 -6 L ${s * 70} -4 L ${s * 70} 6 L 0 10 Z`} fill="#dfe6ec" stroke="#9aa7b3" strokeWidth="3"/>
      {glowTip > 0 && <circle cx={s * 50} cy={0} r={60} fill="url(#spot)" opacity={glowTip}/>}
    </g>;
  };
  return <g>
    <path d="M -470 -10 L -60 18 L 60 18 L 470 -10 L 470 4 L 60 40 L -60 40 L -470 4 Z" fill="#dfe6ec" stroke="#9aa7b3" strokeWidth="3"/>
    {tip(-1)}{tip(1)}
    {[-1, 1].map(s => <ellipse key={s} cx={s * 190} cy={56} rx={44} ry={44} fill="#b8c2cc" stroke="#7d858e" strokeWidth="4"/>)}
    {[-1, 1].map(s => <circle key={`c${s}`} cx={s * 190} cy={56} r={26} fill="#3b434c"/>)}
    <ellipse cx={0} cy={0} rx={92} ry={98} fill="#f4f8fb" stroke="#9aa7b3" strokeWidth="4"/>
    <path d="M -50 -40 Q 0 -66 50 -40 L 44 -24 Q 0 -44 -44 -24 Z" fill="#1d3550"/>
    <path d="M -6 -98 L -10 -230 L 10 -230 L 6 -98 Z" fill="#dfe6ec" stroke="#9aa7b3" strokeWidth="3"/>
  </g>;
};

/** Perfil de ala (corte) con flujo de aire y flecha de sustentación. */
export const Airfoil: React.FC<{t: number; lift: number; flip?: boolean; w?: number}> = ({t, lift, flip = false, w = 560}) => {
  const s = flip ? -1 : 1;
  return <g transform={`scale(1 ${s})`}>
    {[-150, -95, -45, 55, 105, 160].map((y, i) => {
      const over = y < 0, bend = over ? -60 : -14;
      return <path key={i} d={`M ${-w * .9} ${y} C ${-w * .3} ${y}, ${-w * .2} ${y + bend * (1 - Math.abs(y) / 220)}, 0 ${y + bend * (1 - Math.abs(y) / 220)} S ${w * .4} ${y}, ${w * .9} ${y}`}
        fill="none" stroke={over ? '#7fd1ff' : '#cfe8ff'} strokeWidth={over ? 6 : 4} strokeDasharray={over ? '18 12' : '22 18'} strokeDashoffset={-t * (over ? 260 : 170)} opacity=".85"/>;
    })}
    <path d={`M ${-w / 2} 10 C ${-w / 2} -50, ${-w * .1} -70, ${w / 2} 4 C ${w * .1} 20, ${-w * .3} 34, ${-w / 2} 10 Z`} fill="#dfe6ec" stroke="#9aa7b3" strokeWidth="4"/>
    {lift > 0 && <g opacity={lift}>
      <line x1={0} y1={-40} x2={0} y2={-40 - 200 * lift} stroke={YELLOW} strokeWidth="16" strokeLinecap="round"/>
      <path d={`M -26 ${-40 - 200 * lift} L 0 ${-80 - 200 * lift} L 26 ${-40 - 200 * lift} Z`} fill={YELLOW}/>
    </g>}
  </g>;
};

/** Pequeño texto con sombra para etiquetas dentro de las escenas. */
export const Label: React.FC<{x: number; y: number; text: string; color?: string; size?: number; o?: number; anchor?: 'start' | 'middle' | 'end'}> =
  ({x, y, text, color = '#fff', size = 38, o = 1, anchor = 'middle'}) =>
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="900" fill={color} opacity={o} fontFamily="Arial Black, Arial"
      style={{filter: 'drop-shadow(0 3px 8px rgba(0,0,0,.7))'}}>{text}</text>;
