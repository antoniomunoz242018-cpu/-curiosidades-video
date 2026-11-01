import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, rnd, RED, GREEN, YELLOW} from './common';
import {Label} from './shapes';

const RAIL = 980;
const Rail: React.FC<{t: number}> = ({t}) => <g>
  <rect x={0} y={RAIL} width={1080} height={14} fill="#8c96a0"/>
  {Array.from({length: 14}, (_, i) => <rect key={i} x={((i * 90 - t * 300) % 1260 + 1260) % 1260 - 90} y={RAIL + 14} width={50} height={18} fill="#5c4630"/>)}
</g>;
const Wheel: React.FC<{x: number; r?: number; rot: number}> = ({x, r = 34, rot}) => <g transform={`translate(${x} ${RAIL - r})`}>
  <circle r={r} fill="#2b2f36" stroke="#8c96a0" strokeWidth="5"/><line x1={-r * .8} y1={0} x2={r * .8} y2={0} stroke="#8c96a0" strokeWidth="5" transform={`rotate(${rot})`}/>
</g>;
/** Locomotora + vagones hacia la derecha; x = frente de la locomotora. */
const Train: React.FC<{x: number; rot: number; cars?: number}> = ({x, rot, cars = 3}) => <g transform={`translate(${x} 0)`}>
  <path d={`M -360 ${RAIL - 210} H -60 L 0 ${RAIL - 150} V ${RAIL - 50} H -360 Z`} fill="#f2c200" stroke="#9c7c00" strokeWidth="4"/>
  <rect x={-250} y={RAIL - 260} width={150} height={60} rx={8} fill="#c43b2f"/>
  <rect x={-90} y={RAIL - 190} width={60} height={50} rx={6} fill="#1d3550"/>
  <circle cx={-14} cy={RAIL - 90} r={14} fill="#fff6c8"/>
  {Array.from({length: cars}, (_, i) => <g key={i}>
    <rect x={-380 - (i + 1) * 340} y={RAIL - 200} width={320} height={150} rx={6} fill={['#5c6f84', '#8a5a2b', '#4a6b4f'][i % 3]} stroke="#2b2f36" strokeWidth="4"/>
    <rect x={-375 - i * 340} y={RAIL - 110} width={30} height={10} fill="#2b2f36"/>
    <Wheel x={-650 - i * 340} rot={rot}/><Wheel x={-430 - i * 340} rot={rot}/>
  </g>)}
  <Wheel x={-300} rot={rot}/><Wheel x={-190} rot={rot}/><Wheel x={-80} rot={rot}/>
</g>;

export const TrenesFrenar: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {peso: B('peso', .1), toneladas: B('toneladas', .16), ruedas: B('ruedas', .3), acero: B('acero', .36), bloquearian: B('bloquearian', .5),
    kilometro: B('kilometro', .64), maquinista: B('maquinista', .74), ganarle: B('ganarle', .9)};
  const rot = t * 400;

  return <Stage t={t} top="#2b2418" mid="#14100a">
    {/* 1. El tren y sus miles de toneladas */}
    <Shot t={t} from={-1} to={T.ruedas} cy={760}>
      <Rail t={t}/>
      <Train x={1000} rot={rot}/>
      {Array.from({length: 6}, (_, i) => {
        const k = prog(t, T.toneladas + i * .15, T.toneladas + i * .15 + .35, easeOut);
        return <g key={i} transform={`translate(${280 + (i % 3) * 180} ${560 - Math.floor(i / 3) * 110 - 300 * (1 - k)})`} opacity={k}>
          <rect x={-80} y={-50} width={160} height={100} rx={10} fill="#5c6670" stroke="#2b2f36" strokeWidth="4"/><Label x={0} y={14} text="1000 T" size={32}/>
        </g>;
      })}
    </Shot>
    {/* 2. Acero sobre acero: casi sin agarre */}
    <Shot t={t} from={T.ruedas - .2} to={T.kilometro} cy={760}>
      <g transform="translate(540 540) scale(2.6)">
        <circle cx={0} cy={0} r={60} fill="#3b434c" stroke="#c9ced3" strokeWidth="6"/>
        <circle r={22} fill="#8c96a0"/>
        <line x1={-50} y1={0} x2={50} y2={0} stroke="#c9ced3" strokeWidth="6" transform={`rotate(${t > T.bloquearian ? 30 : rot})`}/>
        <rect x={-120} y={60} width={240} height={14} fill="#c9ced3"/>
      </g>
      {[['LLANTA + ASFALTO', .9, GREEN], ['ACERO + ACERO', .2, RED]].map(([l, v, c], i) =>
        <g key={l as string} transform={`translate(150 ${920 + i * 90})`} opacity={prog(t, T.acero, T.acero + .5)}>
          <Label x={0} y={16} text={l as string} anchor="start" size={34}/>
          <rect x={450} y={-16} width={340} height={40} rx={20} fill="#1d3550"/><rect x={450} y={-16} width={340 * (v as number)} height={40} rx={20} fill={c as string}/>
        </g>)}
      {t > T.bloquearian && Array.from({length: 18}, (_, i) => {
        const p = (t * 2 + i / 18) % 1;
        return <circle key={i} cx={540 - 30 + p * (-200 - rnd(i) * 200)} cy={735 - p * 120 * rnd(i + 2) + p * p * 160} r={6} fill={i % 2 ? YELLOW : '#ff8a3d'} opacity={1 - p}/>;
      })}
    </Shot>
    {/* 3. Más de un kilómetro para detenerse */}
    <Shot t={t} from={T.kilometro - .2} to={duration + 1} cy={760}>
      <Rail t={t * (1 - prog(t, T.kilometro, T.ganarle))}/>
      {(() => {
        const k = prog(t, T.kilometro, T.ganarle, (p) => 1 - Math.pow(1 - p, 2));
        const x = interpolate(k, [0, 1], [-200, 900], clamp);
        return <g>
          <g transform={`translate(${x} 0) scale(.6) translate(0 ${RAIL * .66})`}><Train x={0} rot={rot * (1 - k)} cars={2}/></g>
          <line x1={60} y1={1080} x2={1020} y2={1080} stroke={YELLOW} strokeWidth="6" strokeDasharray="16 10"/>
          <Label x={540} y={1060} text="+1 KM" color={YELLOW} size={60}/>
        </g>;
      })()}
      {/* auto en el cruce */}
      {t > T.maquinista && <g transform="translate(980 880)">
        <rect x={-60} y={-40} width={120} height={60} rx={14} fill="#2f7fd8"/><circle cx={-35} cy={22} r={14} fill="#111"/><circle cx={35} cy={22} r={14} fill="#111"/>
      </g>}
      <Mark ok={false} x={880} y={560} t={t} at={T.ganarle}/>
    </Shot>

    <Chip text="MILES DE TONELADAS" y={330} t={t} at={T.toneladas} until={T.ruedas} color="#ffffff"/>
    <Chip text="ACERO SOBRE ACERO: POCO AGARRE" y={330} t={t} at={T.acero} until={T.bloquearian} color={RED} ink="#fff" size={34}/>
    <Chip text="SI FRENA DE GOLPE, PATINA" y={330} t={t} at={T.bloquearian} until={T.kilometro} color={YELLOW} size={36}/>
    <Chip text="MÁS DE 1 KM PARA DETENERSE" y={330} t={t} at={T.kilometro} until={T.ganarle} color={YELLOW} size={36}/>
    <Chip text="NUNCA LE GANES AL TREN" y={330} t={t} at={T.ganarle} color={RED} ink="#fff"/>
  </Stage>;
};
