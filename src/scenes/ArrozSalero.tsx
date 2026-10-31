import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, rnd, RED, GREEN, CYAN} from './common';

const W = 340, H = 520; // cuerpo del salero
const SALT = Array.from({length: 150}, (_, i) => ({x: (rnd(i) - .5) * (W - 60), y: 40 + rnd(i + 500) * (H - 120)}));
const RICE = Array.from({length: 7}, (_, i) => ({x: (rnd(i + 900) - .5) * (W - 110), y: 80 + rnd(i + 950) * (H - 200), a: rnd(i + 990) * 180}));
const CLUMPS = [[-80, 140], [60, 230], [-30, 330], [90, 390], [-100, 420]];

/** Salero en sección: cuerpo de vidrio, tapa metálica con agujeros, sal y arroz. */
const Shaker: React.FC<{t: number; clump: number; wet: number; riceWet: number; plug: number; tilt: number; riceGlow: number}> = ({t, clump, wet, riceWet, plug, tilt, riceGlow}) => {
  const holes = [-60, -20, 20, 60];
  return <g transform={`rotate(${tilt})`}>
    {/* contenido */}
    <g transform={`translate(0 ${-H / 2})`}>
      {SALT.map((g, i) => {
        const c = CLUMPS[i % CLUMPS.length];
        const x = g.x + (c[0] + (rnd(i + 70) - .5) * 40 - g.x) * clump;
        const y = g.y + (c[1] + (rnd(i + 80) - .5) * 40 - g.y) * clump;
        return <rect key={i} x={x - 6} y={y - 6} width={12} height={12} rx={2} fill={clump > .3 ? '#c8ccd0' : '#ffffff'}
          opacity={.95} transform={`rotate(${rnd(i + 30) * 90} ${x} ${y})`}/>;
      })}
      {RICE.map((r, i) => <g key={i} transform={`translate(${r.x} ${r.y + Math.sin(t * 2 + i) * 3 * riceGlow}) rotate(${r.a})`}>
        {riceGlow > 0 && <ellipse rx={44} ry={22} fill={riceWet > .3 ? CYAN : '#ffd84d'} opacity={.5 * riceGlow} filter="url(#blur6)"/>}
        <ellipse rx={30} ry={9} fill={riceWet > .5 ? '#d9f4ff' : '#f6ecd0'} stroke="#c9b98f" strokeWidth="2"/>
      </g>)}
      {/* gotas atrapadas en la sal */}
      {wet > 0 && CLUMPS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={16} fill={CYAN} opacity={.6 * wet * (1 - riceWet)}/>)}
    </g>
    {/* vidrio */}
    <path d={`M ${-W / 2} ${-H / 2} L ${-W / 2 + 10} ${H / 2 - 30} Q ${-W / 2 + 14} ${H / 2} ${-W / 2 + 44} ${H / 2} L ${W / 2 - 44} ${H / 2} Q ${W / 2 - 14} ${H / 2} ${W / 2 - 10} ${H / 2 - 30} L ${W / 2} ${-H / 2} Z`}
      fill="#9fd3ff" fillOpacity=".08" stroke="#cfe8ff" strokeOpacity=".7" strokeWidth="6"/>
    <path d={`M ${-W / 2 + 34} ${-H / 2 + 30} L ${-W / 2 + 44} ${H / 2 - 50}`} stroke="#fff" strokeOpacity=".25" strokeWidth="16" strokeLinecap="round"/>
    {/* tapa */}
    <path d={`M ${-W / 2 - 14} ${-H / 2 + 6} L ${-W / 2 - 14} ${-H / 2 - 70} Q 0 ${-H / 2 - 150} ${W / 2 + 14} ${-H / 2 - 70} L ${W / 2 + 14} ${-H / 2 + 6} Z`} fill="#b8c2cc" stroke="#7d8b98" strokeWidth="4"/>
    {holes.map((x, i) => <g key={x}>
      <circle cx={x} cy={-H / 2 - 98 + Math.abs(x) * .35} r={11} fill="#2a3440"/>
      {plug > 0 && <circle cx={x} cy={-H / 2 - 98 + Math.abs(x) * .35} r={11 * prog(plug, i * .15, i * .15 + .4)} fill="#c8ccd0"/>}
    </g>)}
  </g>;
};

export const ArrozSalero: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {
    proposito: B('proposito', .1), humedad: B('humedad', .16), estufa: B('estufa', .25), pegan: B('pegan', .33), tapan: B('tapan', .4),
    absorbe: B('absorbe', .48), suelta: B('suelta', .58), grandes: B('grandes', .66), tires: B('tires', .82),
  };
  const riceGlow = window01(t, .6, T.humedad + .4, .3) + prog(t, T.absorbe, T.absorbe + .4) * (1 - prog(t, T.tires, T.tires + .5));
  const wet = prog(t, T.humedad, T.pegan);
  const clump = prog(t, T.pegan, T.pegan + 1) * (1 - prog(t, T.absorbe + .6, T.suelta));
  const plug = prog(t, T.tapan, T.tapan + 1) * (1 - prog(t, T.absorbe + .6, T.suelta));
  const riceWet = prog(t, T.absorbe, T.absorbe + 1.2);
  const tilt = 150 * prog(t, T.grandes, T.grandes + .8, easeOut);
  const shakeY = t > T.grandes + .8 ? Math.sin(t * 22) * 18 : 0;
  const cx = 540, cy = 900 + shakeY;
  // la tapa del salero en coordenadas del lienzo (para que la sal caiga desde ahí)
  const ang = tilt * Math.PI / 180, capR = (H / 2 + 100) * 1.3;
  const capX = cx + Math.sin(ang) * capR, capY = cy - Math.cos(ang) * capR;
  const pour = t - (T.grandes + .9);

  return <Stage t={t}>
    {/* vapor de la estufa y gotas de humedad que viajan hacia la sal */}
    {window01(t, T.humedad - .2, T.absorbe + .4) > 0 && <g opacity={window01(t, T.humedad - .2, T.absorbe + .4)}>
      {Array.from({length: 4}, (_, i) => <path key={i} d={`M ${150 + i * 50} 1450 q 30 -60 0 -120 q -30 -60 0 -120 q 30 -60 0 -120`} fill="none" stroke="#cfe8ff" strokeOpacity=".35" strokeWidth="10" strokeLinecap="round"
        strokeDasharray="60 40" strokeDashoffset={-t * 120 - i * 30}/>)}
      {Array.from({length: 12}, (_, i) => {
        const p = ((t * .35 + i / 12) % 1);
        const sx = i % 2 ? 80 : 1000, sy = 400 + (i * 97) % 900;
        return <path key={`d${i}`} d="M 0 -18 C 10 -4 14 4 14 10 A 14 14 0 0 1 -14 10 C -14 4 -10 -4 0 -18 Z" fill={CYAN} opacity={.8 * (1 - p)}
          transform={`translate(${sx + (cx - sx) * p} ${sy + (cy - sy) * p}) scale(${1.3 - p * .6})`}/>;
      })}
    </g>}

    <g transform={`translate(${cx} ${cy}) scale(1.3)`}><Shaker t={t} clump={clump} wet={wet} riceWet={riceWet} plug={plug} tilt={tilt} riceGlow={Math.min(1, riceGlow)}/></g>

    {/* sal que cae suelta al servir */}
    {pour > 0 && Array.from({length: 40}, (_, i) => {
      const life = ((pour * 1.4 + i / 40) % 1);
      return <rect key={i} x={capX + (rnd(i) - .5) * 70 + life * (rnd(i + 3) - .5) * 60} y={capY + life * 520} width={10} height={10} fill="#fff" opacity={1 - life}/>;
    })}

    <Chip text="ESTÁ AHÍ A PROPÓSITO" y={330} t={t} at={T.proposito} until={T.humedad} color="#ffd84d"/>
    <Chip text="LA SAL ATRAPA HUMEDAD" y={330} t={t} at={T.humedad + .2} until={T.pegan} color={CYAN}/>
    <Chip text="GRUMOS = AGUJEROS TAPADOS" y={330} t={t} at={T.pegan + .2} until={T.absorbe} color={RED} ink="#fff"/>
    <Chip text="EL ARROZ SE QUEDA LA HUMEDAD" y={330} t={t} at={T.absorbe + .2} until={T.grandes} color={GREEN}/>
    <Chip text="EL ARROZ NO CABE POR LOS AGUJEROS" y={330} t={t} at={T.grandes + .3} until={T.tires} color="#ffffff" size={34}/>
    <Chip text="NO LO TIRES" y={330} t={t} at={T.tires} color="#ffd84d" size={48}/>
    <Mark ok={false} x={870} y={560} t={t} at={T.tapan + .3} until={T.absorbe + .4}/>
    <Mark ok x={870} y={560} t={t} at={T.suelta} until={T.grandes}/>
  </Stage>;
};
