import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, rnd, RED, GREEN, YELLOW} from './common';

const DENIM = '#2f5d8f', DENIM_D = '#244a73', STITCH = '#e8a33c', COPPER = '#c77b3b';

/** Parte delantera de unos jeans con el bolsillo grande y el pequeño. `rivets` = remaches visibles (0..1). */
const Jeans: React.FC<{rivets: number; glowSmall: number}> = ({rivets, glowSmall}) => <g>
  <path d="M -900 -520 H 620 V 720 H -900 Z" fill={DENIM}/>
  {Array.from({length: 80}, (_, i) => <line key={i} x1={-900 + i * 22} y1={-520} x2={-900 + i * 22 - 200} y2={720} stroke={DENIM_D} strokeWidth="3" opacity=".5"/>)}
  <rect x={-900} y={-520} width={1520} height={90} fill={DENIM_D}/>
  <path d="M -900 -440 H 620" stroke={STITCH} strokeWidth="5" strokeDasharray="14 10"/>
  {/* bolsillo grande (abertura curva) */}
  <path d="M -420 -300 Q -120 -260 -60 -430" fill="none" stroke={STITCH} strokeWidth="6" strokeDasharray="14 10"/>
  <path d="M -420 -280 Q -110 -240 -40 -430" fill="none" stroke={DENIM_D} strokeWidth="14"/>
  {/* bolsillo pequeño */}
  <path d="M -330 -330 L -150 -350 L -140 -170 L -320 -150 Z" fill={DENIM} stroke={STITCH} strokeWidth="6" strokeDasharray="12 8"/>
  {glowSmall > 0 && <path d="M -330 -330 L -150 -350 L -140 -170 L -320 -150 Z" fill={YELLOW} opacity={.25 * glowSmall}/>}
  {rivets > 0 && [[-60, -430], [-420, -300], [-330, -330], [-150, -350]].map(([x, y], i) =>
    <circle key={i} cx={x} cy={y} r={16 * prog(rivets, i * .2, i * .2 + .4, easeOut)} fill={COPPER} stroke="#8a4f22" strokeWidth="4"/>)}
</g>;

/** Reloj de bolsillo con cadena. */
const Watch: React.FC<{t: number; scratched?: number}> = ({t, scratched = 0}) => <g>
  <circle r={70} fill="#d9a93c" stroke="#a87a1e" strokeWidth="8"/>
  <circle r={54} fill="#fff7e0"/>
  {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-46} x2={0} y2={-38} stroke="#5a4a2a" strokeWidth="4" transform={`rotate(${i * 30})`}/>)}
  <line x1={0} y1={0} x2={0} y2={-34} stroke="#2a2a2a" strokeWidth="5" strokeLinecap="round" transform={`rotate(${t * 30})`}/>
  <line x1={0} y1={0} x2={24} y2={0} stroke="#2a2a2a" strokeWidth="6" strokeLinecap="round" transform={`rotate(${t * 3})`}/>
  <rect x={-10} y={-92} width={20} height={22} rx={5} fill="#a87a1e"/>
  {scratched > 0 && <g stroke={RED} strokeWidth="5" opacity={scratched}><line x1={-40} y1={-20} x2={10} y2={30}/><line x1={-10} y1={-40} x2={30} y2={10}/><line x1={20} y1={-30} x2={-30} y2={35}/></g>}
</g>;

export const BolsilloJeans: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {origen: B('origen', .1), levi: B('levi', .14), mil: B('mil', .22), mineros: B('mineros', .3), grande: B('grande', .4),
    golpeaban: B('golpeaban', .44), chiquito: B('chiquito', .54), hoy: B('hoy', .66), usamos: B('usamos', .76), nacio: B('nacio', .88)};
  // reloj que rebota dentro del bolsillo grande
  const bounce = t > T.grande ? Math.abs(Math.sin((t - T.grande) * 7)) * 90 * interpolate(t, [T.grande, T.chiquito], [1, .3], clamp) : 0;
  const intoSmall = prog(t, T.chiquito, T.chiquito + 1, easeOut);
  const coins = window01(t, .5, T.origen, .3);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.levi}>
      <g transform="translate(1010 1400) scale(2)"><Jeans rivets={0} glowSmall={prog(t, .3, 1)}/></g>
      {[0, 1, 2].map(i => <g key={i} opacity={coins} transform={`translate(${330 + i * 110} ${520 + Math.sin(t * 3 + i) * 14})`}>
        <circle r={44} fill="#c9ccd0" stroke="#8c9096" strokeWidth="6"/><text y={14} textAnchor="middle" fontSize="40" fontWeight="900" fill="#6b7076" fontFamily="Arial Black">$</text>
      </g>)}
      <Mark ok={false} x={760} y={520} t={t} at={.8} until={T.levi}/>
    </Shot>
    <Shot t={t} from={T.levi - .2} to={T.mineros}>
      <BigText text="1873" y={640} t={t} at={T.mil - .3} size={200} color={YELLOW}/>
      <g transform="translate(540 1150) scale(.9)"><Jeans rivets={prog(t, T.levi, T.levi + 1.6)} glowSmall={0}/></g>
      <Chip text="REMACHES DE COBRE" y={800} t={t} at={T.levi + .3} until={T.mineros} color="#e0a46b"/>
    </Shot>
    <Shot t={t} from={T.mineros - .2} to={T.hoy}>
      <g transform="translate(1010 1400) scale(2)"><Jeans rivets={1} glowSmall={prog(t, T.chiquito, T.chiquito + .6)}/></g>
      {/* cadena + reloj */}
      {(() => {
        const bx = interpolate(intoSmall, [0, 1], [760, 540]), by = interpolate(intoSmall, [0, 1], [1010 - bounce, 900]);
        const s = interpolate(intoSmall, [0, 1], [1.3, 1.1]);
        return <g>
          <path d={`M 1000 560 Q ${(700 + bx) / 2} ${by - 160} ${bx} ${by - 90 * s}`} fill="none" stroke="#d9a93c" strokeWidth="7" strokeDasharray="10 6"/>
          <g transform={`translate(${bx} ${by}) scale(${s}) rotate(${Math.sin(t * 2) * 10})`}><Watch t={t} scratched={prog(t, T.golpeaban, T.golpeaban + .8) * (1 - intoSmall)}/></g>
        </g>;
      })()}
      <Mark ok={false} x={880} y={1180} t={t} at={T.golpeaban} until={T.chiquito}/>
      <Mark ok x={880} y={1180} t={t} at={T.chiquito + 1} until={T.hoy}/>
    </Shot>
    <Shot t={t} from={T.hoy - .2} to={T.nacio}>
      <g transform="translate(1010 1400) scale(2)"><Jeans rivets={1} glowSmall={1}/></g>
      {['$', '🔑', '🎟'].map((s, i) => {
        const k = prog(t, T.usamos + i * .5, T.usamos + i * .5 + .7, easeOut);
        return <g key={i} opacity={prog(t, T.hoy, T.hoy + .4)} transform={`translate(${interpolate(k, [0, 1], [380 + i * 170, 540])} ${interpolate(k, [0, 1], [560, 900])}) scale(${1 - .5 * k})`}>
          <rect x={-56} y={-56} width={112} height={112} rx={28} fill={i === 0 ? '#c9ccd0' : i === 1 ? '#d9a93c' : '#e8eef4'}/>
          {i === 0 && <text y={20} textAnchor="middle" fontSize="60" fontWeight="900" fill="#6b7076" fontFamily="Arial Black">$</text>}
          {i === 1 && <g fill="#8a6514"><circle cx={-18} cy={0} r={20}/><rect x={-4} y={-6} width={50} height={12}/><rect x={30} y={4} width={8} height={16}/></g>}
          {i === 2 && <g><rect x={-34} y={-22} width={68} height={44} rx={6} fill="#ff8a8a"/><line x1={8} y1={-22} x2={8} y2={22} stroke="#fff" strokeWidth="4" strokeDasharray="6 4"/></g>}
        </g>;
      })}
    </Shot>
    <Shot t={t} from={T.nacio - .2} to={duration + 1}>
      <g transform={`translate(540 880) scale(${2.4 - .3 * prog(t, T.nacio, T.nacio + 2)})`}><Watch t={t}/></g>
    </Shot>

    <Chip text="NO ES PARA MONEDAS" y={330} t={t} at={.5} until={T.levi} color={RED} ink="#fff"/>
    <Chip text="LEVI STRAUSS Y JACOB DAVIS" y={330} t={t} at={T.levi} until={T.mineros} color="#ffffff" size={36}/>
    <Chip text="MINEROS Y VAQUEROS" y={330} t={t} at={T.mineros} until={T.grande} color={YELLOW}/>
    <Chip text="EN EL BOLSILLO GRANDE SE GOLPEABA" y={330} t={t} at={T.grande} until={T.chiquito} color={RED} ink="#fff" size={32}/>
    <Chip text="A LA MEDIDA DE UN RELOJ" y={330} t={t} at={T.chiquito} until={T.hoy} color={GREEN}/>
    <Chip text="HOY: MONEDAS, LLAVES, BOLETOS" y={330} t={t} at={T.hoy + .2} until={T.nacio} color="#ffffff" size={34}/>
    <Chip text="NACIÓ PARA GUARDAR LA HORA" y={330} t={t} at={T.nacio} color={YELLOW} size={38}/>
  </Stage>;
};
