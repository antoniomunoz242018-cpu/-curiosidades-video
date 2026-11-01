import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW} from './common';
import {Label} from './shapes';

const LR = '#ff3b30', LY = '#ffcc00', LG = '#34c759';
/** Semáforo vertical. `on`: 0 rojo, 1 amarillo, 2 verde, -1 ninguno. `gray`: vista sin colores. */
const Light: React.FC<{on: number; gray?: boolean; s?: number}> = ({on, gray = false, s = 1}) => {
  const cols = [LR, LY, LG].map(c => gray ? '#d0d0d0' : c);
  return <g transform={`scale(${s})`}>
    <rect x={-90} y={-280} width={180} height={560} rx={40} fill="#1b1f24" stroke="#3b434c" strokeWidth="6"/>
    <rect x={-12} y={280} width={24} height={300} fill="#3b434c"/>
    {[0, 1, 2].map(i => <g key={i} transform={`translate(0 ${-170 + i * 170})`}>
      {on === i && <circle r={110} fill={cols[i]} opacity=".3" filter="url(#soft)"/>}
      <circle r={62} fill={on === i ? cols[i] : '#2b3138'}/>
    </g>)}
  </g>;
};

export const Semaforos: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {trenes: B('trenes', .08), ferrocarriles: B('ferrocarriles', .16), rojo: B('rojo', .26), lejos: B('lejos', .32), niebla: B('niebla', .4),
    peligro: B('peligro', .48), verde: B('verde', .56), amarillo: B('amarillo', .64), arriba: B('arriba', .78)};
  const cycle = Math.floor(t / .8) % 3;

  return <Stage t={t} top="#1d2433" mid="#0d1118">
    <Shot t={t} from={-1} to={T.ferrocarriles} cy={760}>
      <g transform="translate(540 700)"><Light on={2 - cycle}/></g>
    </Shot>
    {/* Señales de tren */}
    <Shot t={t} from={T.ferrocarriles - .2} to={T.lejos} cy={760}>
      <rect x={0} y={1040} width={1080} height={14} fill="#8c96a0"/>
      <g transform="translate(300 700)">
        <rect x={-14} y={0} width={28} height={340} fill="#3b434c"/>
        <rect x={-70} y={-160} width={140} height={180} rx={20} fill="#1b1f24"/>
        <circle cx={0} cy={-110} r={40} fill={t > T.rojo ? LR : '#2b3138'}/><circle cx={0} cy={-30} r={40} fill={t > T.rojo ? '#2b3138' : LG}/>
      </g>
      <g transform={`translate(${1100 - 300 * prog(t, T.ferrocarriles, T.lejos)} 960)`}>
        <path d="M 0 -120 H 260 V 60 H -40 Z" fill="#2b2f36"/><rect x={180} y={-200} width={50} height={80} fill="#2b2f36"/>
        <circle cx={40} cy={70} r={34} fill="#5c6670"/><circle cx={190} cy={70} r={34} fill="#5c6670"/>
      </g>
    </Shot>
    {/* La luz roja llega más lejos en la niebla */}
    <Shot t={t} from={T.lejos - .2} to={T.verde} cy={760}>
      {[LR, LY, LG].map((c, i) => {
        const reach = [880, 720, 600][i] * prog(t, T.lejos, T.lejos + 1.2, easeOut);
        return <g key={c} transform={`translate(110 ${560 + i * 180})`}>
          <circle r={40} fill={c}/>
          <path d={`M 40 -24 L ${40 + reach} -60 L ${40 + reach} 60 L 40 24 Z`} fill={c} opacity=".35"/>
          <Label x={70 + reach} y={14} text={['ROJO', 'AMARILLO', 'VERDE'][i]} color={c} size={34} anchor="end" o={prog(t, T.lejos + .8, T.lejos + 1.2)}/>
        </g>;
      })}
      <rect x={0} y={420} width={1080} height={720} fill="#c9d3dc" opacity={.28 * prog(t, T.niebla, T.niebla + .5)}/>
      <Mark ok x={930} y={560} t={t} at={T.lejos + 1.3} until={T.verde}/>
    </Shot>
    {/* Verde avanza, amarillo previene */}
    <Shot t={t} from={T.verde - .2} to={T.arriba} cy={760}>
      <g transform="translate(360 760)"><Light on={t > T.amarillo ? 1 : 2}/></g>
      <Label x={760} y={600} text="ALTO" color={LR} size={56} o={.5}/>
      <Label x={760} y={770} text="PRECAUCIÓN" color={LY} size={50} o={t > T.amarillo ? 1 : .3}/>
      <Label x={760} y={940} text="AVANZA" color={LG} size={56} o={t > T.amarillo ? .3 : 1}/>
    </Shot>
    {/* Sin distinguir colores: la posición lo dice */}
    <Shot t={t} from={T.arriba - .2} to={duration + 1} cy={760}>
      <g transform="translate(330 760)"><Light on={0}/></g>
      <g transform="translate(750 760)"><Light on={0} gray/></g>
      <path d="M 860 590 L 940 590" stroke={YELLOW} strokeWidth="10"/><path d="M 900 560 L 860 590 L 900 620" fill="none" stroke={YELLOW} strokeWidth="10"/>
      <Label x={750} y={1180} text="SIN COLORES" size={34} o={.8}/>
      <Mark ok x={880} y={440} t={t} at={T.arriba + .6}/>
    </Shot>

    <Chip text="VIENEN DE LOS TRENES" y={330} t={t} at={T.trenes} until={T.rojo} color={YELLOW}/>
    <Chip text="EL ROJO SE VE DESDE MÁS LEJOS" y={330} t={t} at={T.rojo} until={T.peligro} color={RED} ink="#fff" size={34}/>
    <Chip text="Y YA SIGNIFICABA PELIGRO" y={330} t={t} at={T.peligro} until={T.verde} color={RED} ink="#fff" size={36}/>
    <Chip text="VERDE AVANZA, AMARILLO PREVIENE" y={330} t={t} at={T.verde} until={T.arriba} color={GREEN} size={34}/>
    <Chip text="EL ROJO SIEMPRE VA ARRIBA" y={330} t={t} at={T.arriba} color="#ffffff" size={36}/>
  </Stage>;
};
