import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, rnd, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const ORANGE = '#ff7a1a';
/** Caja negra (naranja) en perspectiva isométrica simple. */
const Box: React.FC<{glow?: number}> = ({glow = 0}) => <g>
  {glow > 0 && <circle r={260} fill={ORANGE} opacity={.25 * glow} filter="url(#soft)"/>}
  <path d="M -170 -60 L 0 -150 L 170 -60 L 0 30 Z" fill="#ff9a4d"/>
  <path d="M -170 -60 L 0 30 L 0 210 L -170 120 Z" fill={ORANGE}/>
  <path d="M 170 -60 L 0 30 L 0 210 L 170 120 Z" fill="#d95f0e"/>
  {[0, 1].map(i => <path key={i} d={`M -170 ${-10 + i * 90} L 0 ${80 + i * 90} L 0 ${100 + i * 90} L -170 ${10 + i * 90} Z`} fill="#fff" opacity=".9"/>)}
  {[0, 1].map(i => <path key={`r${i}`} d={`M 170 ${-10 + i * 90} L 0 ${80 + i * 90} L 0 ${100 + i * 90} L 170 ${10 + i * 90} Z`} fill="#e8e8e8" opacity=".9"/>)}
  <ellipse cx={0} cy={-60} rx={60} ry={30} fill="#3b434c"/>
</g>;

export const CajaNegra: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {naranjas: B('naranjas', .06), color: B('color', .12), restos: B('restos', .18), franjas: B('franjas', .28), mar: B('mar', .34), semanas: B('semanas', .42),
    sobrevivir: B('sobrevivir', .5), fuego: B('fuego', .58), presion: B('presion', .64), voces: B('voces', .72), datos: B('datos', .78), ocurrir: B('ocurrir', .92)};

  return <Stage t={t}>
    {/* 1. Son naranjas */}
    <Shot t={t} from={-1} to={T.restos} cy={760}>
      <g transform={`translate(540 760) scale(1.3) rotate(${Math.sin(t * .8) * 4})`}><Box glow={prog(t, T.naranjas, T.naranjas + .5)}/></g>
    </Shot>
    {/* 2. Fácil de ver entre los restos */}
    <Shot t={t} from={T.restos - .2} to={T.franjas} cy={760}>
      <rect x={0} y={560} width={1080} height={600} fill="#2b2420"/>
      {Array.from({length: 40}, (_, i) => <path key={i} d={`M 0 0 L ${30 + rnd(i) * 60} ${-10 - rnd(i + 2) * 30} L ${50 + rnd(i + 4) * 50} ${20 + rnd(i + 6) * 20} Z`} fill={['#3b434c', '#1b1f24', '#5c6670'][i % 3]}
        transform={`translate(${rnd(i + 8) * 1080} ${600 + rnd(i + 9) * 520}) rotate(${rnd(i + 10) * 360})`}/>)}
      <g transform="translate(640 860) scale(.45)"><Box glow={1}/></g>
      <circle cx={640} cy={870} r={140 + 10 * Math.sin(t * 5)} fill="none" stroke={YELLOW} strokeWidth="8" opacity={prog(t, T.restos + .4, T.restos + .8)}/>
    </Shot>
    {/* 3. Franjas reflejantes y baliza bajo el agua */}
    <Shot t={t} from={T.franjas - .2} to={T.sobrevivir} cy={760}>
      <rect x={0} y={420} width={1080} height={740} fill="#0d3a5c"/>
      {t > T.mar - .3 && Array.from({length: 4}, (_, i) => {
        const p = ((t - T.mar) * .6 + i / 4) % 1;
        return <circle key={i} cx={540} cy={900} r={60 + p * 420} fill="none" stroke={CYAN} strokeWidth="6" opacity={(1 - p) * .9}/>;
      })}
      <g transform="translate(540 900) scale(.55)"><Box/></g>
      <Label x={540} y={560} text="PING… PING…" color={CYAN} size={56} o={prog(t, T.mar, T.mar + .4)}/>
      <Label x={540} y={1120} text="DURANTE SEMANAS" size={44} o={prog(t, T.semanas, T.semanas + .4)}/>
    </Shot>
    {/* 4. Fuego y presión */}
    <Shot t={t} from={T.sobrevivir - .2} to={T.voces} cy={760}>
      <g transform="translate(540 820) scale(.8)"><Box/></g>
      {t < T.presion && Array.from({length: 12}, (_, i) => {
        const f = .7 + .3 * Math.sin(t * 9 + i);
        return <path key={i} d="M 0 0 Q -30 -60 0 -130 Q 30 -60 0 0 Z" fill={i % 2 ? '#ff8a3d' : '#ffcc00'} opacity={.85 * prog(t, T.fuego - .2, T.fuego + .2)}
          transform={`translate(${300 + i * 45} ${1000}) scale(${f} ${f * 1.3})`}/>;
      })}
      {t > T.presion && [0, 45, 90, 135, 180, 225, 270, 315].map(a => <g key={a} transform={`translate(540 820) rotate(${a}) translate(${300 - 20 * Math.sin(t * 5)} 0)`} opacity={prog(t, T.presion, T.presion + .4)}>
        <path d="M 40 0 H -20" stroke={CYAN} strokeWidth="12" strokeLinecap="round"/><path d="M -16 -18 L -44 0 L -16 18 Z" fill={CYAN}/>
      </g>)}
      <BigText text="+1000°" y={540} t={t} at={T.fuego} until={T.presion} size={130} color="#ff8a3d"/>
    </Shot>
    {/* 5. Voces y datos */}
    <Shot t={t} from={T.voces - .2} to={duration + 1} cy={760}>
      <g transform="translate(540 640)">
        <rect x={-420} y={-120} width={840} height={220} rx={20} fill="#0d1a28" stroke={CYAN} strokeWidth="4"/>
        {Array.from({length: 60}, (_, i) => { const h = 20 + 70 * Math.abs(Math.sin(i * .7 + t * 6)); return <rect key={i} x={-400 + i * 13.5} y={-10 - h / 2} width={8} height={h} rx={4} fill={CYAN}/>; })}
        <Label x={-400} y={-80} text="VOCES DE CABINA" color={CYAN} size={28} anchor="start"/>
      </g>
      <g transform="translate(540 930)" opacity={prog(t, T.datos, T.datos + .4)}>
        <rect x={-420} y={-110} width={840} height={220} rx={20} fill="#0d1a28" stroke={YELLOW} strokeWidth="4"/>
        <polyline points={Array.from({length: 40}, (_, i) => `${-400 + i * 20},${Math.sin(i * .5 + t) * 50 + Math.sin(i * 1.7) * 20}`).join(' ')} fill="none" stroke={YELLOW} strokeWidth="6"/>
        <Label x={-400} y={-70} text="DATOS DEL VUELO" color={YELLOW} size={28} anchor="start"/>
      </g>
      <Mark ok x={880} y={460} t={t} at={T.ocurrir}/>
    </Shot>

    <Chip text="EN REALIDAD SON NARANJAS" y={330} t={t} at={T.naranjas + .3} until={T.restos} color={YELLOW} size={36}/>
    <Chip text="PARA ENCONTRARLAS RÁPIDO" y={330} t={t} at={T.restos} until={T.franjas} color={GREEN} size={36}/>
    <Chip text="EN EL MAR ENVÍAN UNA SEÑAL" y={330} t={t} at={T.mar} until={T.sobrevivir} color={CYAN} size={36}/>
    <Chip text="RESISTEN FUEGO Y PRESIÓN" y={330} t={t} at={T.sobrevivir} until={T.voces} color={RED} ink="#fff"/>
    <Chip text="GUARDAN VOCES Y DATOS" y={330} t={t} at={T.voces} until={T.ocurrir} color="#ffffff"/>
    <Chip text="PARA QUE NO VUELVA A PASAR" y={330} t={t} at={T.ocurrir} color={GREEN} size={36}/>
  </Stage>;
};
