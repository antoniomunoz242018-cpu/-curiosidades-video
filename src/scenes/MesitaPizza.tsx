import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, rnd, RED, GREEN, YELLOW} from './common';

const Pepperoni = Array.from({length: 11}, (_, i) => ({a: i * 2.4 + rnd(i) * .6, r: 70 + rnd(i + 20) * 150}));

/** Pizza vista desde arriba con la mesita en el centro. */
const PizzaTop: React.FC<{tripod: number}> = ({tripod}) => <g>
  <rect x={-330} y={-330} width={660} height={660} rx={14} fill="#c89a5b" stroke="#a87a42" strokeWidth="8"/>
  <circle r={290} fill="#d9963f"/><circle r={258} fill="#f3c34f"/>
  {Pepperoni.map((p, i) => <circle key={i} cx={Math.cos(p.a) * p.r} cy={Math.sin(p.a) * p.r} r={30} fill="#b8322a"/>)}
  {tripod > 0 && <g transform={`scale(${tripod})`}>
    <circle r={60} fill="url(#spot)"/>
    {[0, 120, 240].map(a => <rect key={a} x={-6} y={-42} width={12} height={42} rx={4} fill="#f4f4f4" transform={`rotate(${a})`}/>)}
    <circle r={22} fill="#ffffff" stroke="#d0d0d0" strokeWidth="3"/>
  </g>}
</g>;

/** Corte lateral: caja, pizza y tapa. `sag` hunde la tapa; `tripod` la sostiene. */
const Section: React.FC<{t: number; sag: number; tripod: number; steam: number; stuck: number}> = ({t, sag, tripod, steam, stuck}) => {
  const lidY = -150, cheeseY = -20, dip = (cheeseY - lidY - 8) * sag;
  return <g>
    <path d="M -440 60 H 440 V 90 H -440 Z" fill="#b07f45"/>
    <path d="M -420 60 V -160 M 420 60 V -160" stroke="#b07f45" strokeWidth="18"/>
    <path d="M -380 60 Q -380 0 -330 0 H 330 Q 380 0 380 60 Z" fill="#d9963f"/>
    <rect x={-330} y={cheeseY} width={660} height={22} rx={10} fill="#f3c34f"/>
    {[-250, -120, 20, 160, 280].map(x => <ellipse key={x} cx={x} cy={cheeseY - 2} rx={36} ry={8} fill="#b8322a"/>)}
    {steam > 0 && Array.from({length: 6}, (_, i) => <path key={i} d={`M ${-280 + i * 110} ${cheeseY - 20} q 20 -30 0 -60 q -20 -30 0 -60`} fill="none" stroke="#fff" strokeOpacity={.35 * steam}
      strokeWidth="9" strokeLinecap="round" strokeDasharray="30 22" strokeDashoffset={-t * 70 - i * 12}/>)}
    {stuck > 0 && [-60, -20, 25, 65].map(x => <path key={x} d={`M ${x} ${cheeseY} Q ${x + 8} ${(cheeseY + lidY + dip) / 2} ${x} ${lidY + dip + 10}`} stroke="#f3c34f" strokeWidth="7" fill="none" opacity={stuck}/>)}
    {tripod > 0 && <g opacity={tripod} transform={`translate(0 ${cheeseY}) scale(1 ${tripod})`}>
      <path d="M -40 0 L -16 -122 M 40 0 L 16 -122 M 0 0 V -122" stroke="#f4f4f4" strokeWidth="12" strokeLinecap="round"/>
      <rect x={-48} y={-134} width={96} height={14} rx={7} fill="#fff"/>
    </g>}
    <path d={`M -440 ${lidY} Q 0 ${lidY + dip * 2} 440 ${lidY} V ${lidY - 22} Q 0 ${lidY - 22 + dip * 2} -440 ${lidY - 22} Z`} fill="#c89a5b" stroke={stuck > .5 ? RED : '#a87a42'} strokeWidth="5"/>
  </g>;
};

export const MesitaPizza: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {cajas: B('cajas', .14), vapor: B('vapor', .2), hunden: B('hunden', .28), toca: B('toca', .34), arruina: B('arruina', .4),
    tripode: B('tripode', .48), patento: B('patento', .64), millones: B('millones', .82)};
  const sag = prog(t, T.vapor, T.toca + .3) * (1 - prog(t, T.tripode, T.tripode + .8));
  const stuck = window01(t, T.toca, T.tripode + .3, .25);
  const tripodUp = prog(t, T.tripode, T.tripode + .8, easeOut);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.cajas}>
      <g transform={`translate(540 880) rotate(${-8 + 8 * prog(t, 0, 1.2, easeOut)}) scale(1.15)`}><PizzaTop tripod={prog(t, .4, 1.2, easeOut)}/></g>
    </Shot>
    <Shot t={t} from={T.cajas - .2} to={T.patento}>
      <g transform="translate(540 940) scale(1.08 1.6)"><Section t={t} sag={sag} tripod={tripodUp} steam={window01(t, T.vapor - .3, T.tripode + .5)} stuck={stuck}/></g>
      <Mark ok={false} x={540} y={1180} t={t} at={T.arruina} until={T.tripode}/>
      <Mark ok x={540} y={1180} t={t} at={T.tripode + .8} until={T.patento}/>
    </Shot>
    <Shot t={t} from={T.patento - .2} to={T.millones}>
      <BigText text="AÑOS 80" y={880} t={t} at={T.patento} size={190} color={YELLOW}/>
      <g transform="translate(540 1090) scale(.5)"><PizzaTop tripod={1}/></g>
    </Shot>
    <Shot t={t} from={T.millones - .2} to={duration + 1}>
      {Array.from({length: 20}, (_, i) => {
        const k = prog(t, T.millones + i * .05, T.millones + i * .05 + .4, easeOut);
        return <g key={i} transform={`translate(${190 + (i % 4) * 233} ${560 + Math.floor(i / 4) * 180}) scale(${.22 * k})`}><PizzaTop tripod={1}/></g>;
      })}
    </Shot>

    <Chip text="¿PARA QUÉ SIRVE?" y={330} t={t} at={3.2} until={T.cajas} color={YELLOW}/>
    <Chip text="EL VAPOR ABLANDA EL CARTÓN" y={330} t={t} at={T.vapor} until={T.toca} color="#ffffff" size={36}/>
    <Chip text="LA TAPA SE PEGA AL QUESO" y={330} t={t} at={T.toca} until={T.tripode} color={RED} ink="#fff"/>
    <Chip text="SOSTIENE EL CENTRO" y={330} t={t} at={T.tripode + .3} until={T.patento} color={GREEN}/>
    <Chip text="MILLONES DE PIZZAS AL DÍA" y={330} t={t} at={T.millones} color={YELLOW}/>
  </Stage>;
};
