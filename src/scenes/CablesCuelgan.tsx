import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const P1 = 140, P2 = 940, TOP = 560;
const Pole: React.FC<{x: number; lean?: number}> = ({x, lean = 0}) => <g transform={`rotate(${lean} ${x} 1120)`}>
  <rect x={x - 18} y={TOP - 40} width={36} height={620} fill="#7a5a3a"/>
  <rect x={x - 90} y={TOP - 30} width={180} height={18} fill="#5c4630"/>
</g>;
/** Cable entre postes con flecha de comba `sag` (px). */
const cable = (sag: number, wind = 0) => `M ${P1} ${TOP} Q ${540 + wind} ${TOP + 2 * sag} ${P2} ${TOP}`;

export const CablesCuelgan: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {tensaras: B('tensaras', .1), fuerza: B('fuerza', .18), peso: B('peso', .26), frio: B('frio', .34), verano: B('verano', .4), invierno: B('invierno', .46),
    reventar: B('reventar', .54), curva: B('curva', .62), viento: B('viento', .72), catenaria: B('catenaria', .9)};
  const tight = prog(t, T.tensaras, T.tensaras + .8);
  const tension = 1 + 9 * tight;
  const winter = prog(t, T.invierno, T.invierno + .8);
  const snap = t > T.reventar + .2;

  return <Stage t={t} top="#1d3f66" mid="#0d2038">
    <rect x={0} y={1120} width={1080} height={40} fill="#2b3a2a"/>
    {/* 1. Cuelgan a propósito */}
    <Shot t={t} from={-1} to={T.tensaras} cy={760}>
      <Pole x={P1}/><Pole x={P2}/>
      <path d={cable(120)} fill="none" stroke="#1b1f24" strokeWidth="10"/>
      <g transform={`translate(540 ${TOP + 120 + Math.sin(t * 3) * 3})`}><ellipse cx={0} cy={-26} rx={26} ry={20} fill="#3b434c"/><circle cx={18} cy={-42} r={12} fill="#3b434c"/><path d="M 28 -42 L 42 -38 L 28 -34 Z" fill={YELLOW}/></g>
    </Shot>
    {/* 2. Recto = fuerza enorme */}
    <Shot t={t} from={T.tensaras - .2} to={T.frio} cy={760}>
      <Pole x={P1} lean={4 * tight}/><Pole x={P2} lean={-4 * tight}/>
      <path d={cable(120 * (1 - tight) + 4)} fill="none" stroke={tight > .8 ? RED : '#1b1f24'} strokeWidth="10"/>
      <g transform="translate(540 960)">
        <rect x={-300} y={-24} width={600} height={48} rx={24} fill="#1d3550"/>
        <rect x={-300} y={-24} width={60 * tension} height={48} rx={24} fill={tension > 7 ? RED : YELLOW}/>
        <Label x={0} y={-50} text="TENSIÓN" size={38}/>
      </g>
      <Mark ok={false} x={880} y={460} t={t} at={T.peso} until={T.frio}/>
    </Shot>
    {/* 3. El frío lo encoge: si estaba tenso, revienta */}
    <Shot t={t} from={T.frio - .2} to={T.curva} cy={760}>
      <Pole x={P1} lean={snap ? 0 : 3 * winter}/><Pole x={P2} lean={snap ? 0 : -3 * winter}/>
      {!snap ? <path d={cable(40 * (1 - winter) + 2)} fill="none" stroke={winter > .7 ? RED : '#1b1f24'} strokeWidth="10"/>
        : <g><path d={`M ${P1} ${TOP} Q 300 ${TOP + 200} 260 ${TOP + 420}`} fill="none" stroke="#1b1f24" strokeWidth="10"/>
          <path d={`M ${P2} ${TOP} Q 780 ${TOP + 200} 820 ${TOP + 420}`} fill="none" stroke="#1b1f24" strokeWidth="10"/>
          <circle cx={540} cy={TOP + 60} r={90} fill="url(#hot)"/></g>}
      <g transform="translate(540 980)">
        {t < T.invierno ? <g><circle r={50} fill="#ffcc00"/><Label x={0} y={110} text="VERANO" color="#ffcc00" size={40}/></g>
          : <g stroke={CYAN} strokeWidth="10" strokeLinecap="round">{[0, 60, 120].map(a => <line key={a} x1={0} y1={-55} x2={0} y2={55} transform={`rotate(${a})`}/>)}<Label x={0} y={120} text="INVIERNO" color={CYAN} size={40}/></g>}
      </g>
    </Shot>
    {/* 4. La curva da margen: calor, frío y viento */}
    <Shot t={t} from={T.curva - .2} to={duration + 1} cy={760}>
      <Pole x={P1}/><Pole x={P2}/>
      <path d={cable(110 + 25 * Math.sin(t * 1.3), 60 * Math.sin(t * 2.1) * prog(t, T.viento, T.viento + .5))} fill="none" stroke={t > T.catenaria ? YELLOW : '#1b1f24'} strokeWidth="10"/>
      <Label x={540} y={1000} text="CATENARIA" color={YELLOW} size={80} o={prog(t, T.catenaria, T.catenaria + .5)}/>
      <Mark ok x={880} y={460} t={t} at={T.curva + .5}/>
    </Shot>

    <Chip text="CUELGAN A PROPÓSITO" y={330} t={t} at={.4} until={T.tensaras} color={YELLOW}/>
    <Chip text="RECTOS = FUERZA ENORME" y={330} t={t} at={T.tensaras} until={T.frio} color={RED} ink="#fff"/>
    <Chip text="EL FRÍO ENCOGE EL METAL" y={330} t={t} at={T.frio} until={T.curva} color={CYAN}/>
    <Chip text="LA CURVA LE DA MARGEN" y={330} t={t} at={T.curva} until={T.catenaria} color={GREEN}/>
    <Chip text="SE LLAMA CATENARIA" y={330} t={t} at={T.catenaria} color={YELLOW}/>
  </Stage>;
};
