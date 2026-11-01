import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const DECK = 800;
/** Puente de lado: tramos con juntas. `grow` (-1..1) dilata/contrae; `rigid`: una sola pieza que se tuerce. */
const Bridge: React.FC<{grow: number; rigid?: number; glowJoints?: number}> = ({grow, rigid = 0, glowJoints = 0}) => {
  const spans = 3, w = 300, gap = 18 - 12 * grow;
  const x0 = 540 - (spans * w + (spans - 1) * gap) / 2;
  return <g>
    {[0, 1, 2, 3].map(i => <rect key={i} x={x0 - 30 + i * (w + gap) - (i === 3 ? gap : 0)} y={DECK + 30} width={50} height={300} fill="#8c96a0"/>)}
    <rect x={0} y={DECK + 330} width={1080} height={60} fill="#3b4a3a"/>
    {rigid > 0 ? <path d={`M ${x0} ${DECK} Q 540 ${DECK - 70 * rigid} ${1080 - x0} ${DECK} L ${1080 - x0} ${DECK + 30} Q 540 ${DECK + 30 - 70 * rigid} ${x0} ${DECK + 30} Z`} fill="#c9ced3" stroke="#7d858e" strokeWidth="4"/>
      : Array.from({length: spans}, (_, i) => <rect key={i} x={x0 + i * (w + gap)} y={DECK} width={w} height={30} fill="#c9ced3" stroke="#7d858e" strokeWidth="4"/>)}
    {!rigid && glowJoints > 0 && [1, 2].map(i => <circle key={i} cx={x0 + i * (w + gap) - gap / 2} cy={DECK + 15} r={34} fill="url(#spot)" opacity={glowJoints}/>)}
    {rigid > .5 && [x0 + 10, 1070 - x0].map((x, i) => <polyline key={i} points={`${x},${DECK + 30} ${x + (i ? -12 : 12)},${DECK + 70} ${x - (i ? -4 : 4)},${DECK + 110} ${x + (i ? -16 : 16)},${DECK + 160}`}
      fill="none" stroke={RED} strokeWidth="6"/>)}
  </g>;
};

export const PuentesJuntas: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {juntas: B('juntas', .12), calor: B('calor', .2), frio: B('frio', .26), verano: B('verano', .34), centimetros: B('centimetros', .44),
    rigida: B('rigida', .52), agrietarse: B('agrietarse', .6), espacio: B('espacio', .7), pie: B('pie', .9)};
  const season = t < T.frio ? prog(t, T.calor, T.calor + .6) : 1 - 2 * prog(t, T.frio, T.frio + .6) ;
  const car = ((t * 260) % 1400) - 200;

  return <Stage t={t} top="#1d3f66" mid="#0d2038">
    {/* 1. Tac tac: las juntas */}
    <Shot t={t} from={-1} to={T.calor} cy={760}>
      <Bridge grow={0} glowJoints={prog(t, T.juntas, T.juntas + .4)}/>
      <g transform={`translate(${car} ${DECK - 40})`}>
        <rect x={-70} y={-40} width={140} height={50} rx={14} fill="#2f7fd8"/><circle cx={-40} cy={14} r={18} fill="#111"/><circle cx={40} cy={14} r={18} fill="#111"/>
      </g>
      <Label x={540} y={620} text="TAC TAC" color={YELLOW} size={64} o={window01(t, .6, T.calor)}/>
    </Shot>
    {/* 2. Calor: crece / frío: se encoge */}
    <Shot t={t} from={T.calor - .2} to={T.rigida} cy={760}>
      <Bridge grow={season} glowJoints={1}/>
      <g transform="translate(900 560)">
        {season > 0 ? <g><circle r={60} fill="#ffcc00"/>{Array.from({length: 8}, (_, i) => <line key={i} x1={0} y1={-80} x2={0} y2={-105} stroke="#ffcc00" strokeWidth="8" transform={`rotate(${i * 45 + t * 30})`}/>)}</g>
          : <g stroke={CYAN} strokeWidth="10" strokeLinecap="round">{[0, 60, 120].map(a => <line key={a} x1={0} y1={-70} x2={0} y2={70} transform={`rotate(${a})`}/>)}</g>}
      </g>
      <Label x={540} y={700} text={season > 0 ? 'SE ESTIRA' : 'SE ENCOGE'} color={season > 0 ? '#ffcc00' : CYAN} size={56}/>
      <Label x={540} y={1240} text="HASTA DECENAS DE CENTÍMETROS" size={36} o={prog(t, T.centimetros, T.centimetros + .4)}/>
    </Shot>
    {/* 3. Sin juntas: se agrieta */}
    <Shot t={t} from={T.rigida - .2} to={T.espacio} cy={760}>
      <Bridge grow={0} rigid={.01 + prog(t, T.rigida + .4, T.agrietarse + .4)}/>
      <Mark ok={false} x={880} y={560} t={t} at={T.agrietarse} until={T.espacio}/>
    </Shot>
    {/* 4. Junta tipo peine: deja espacio para moverse */}
    <Shot t={t} from={T.espacio - .2} to={duration + 1} cy={760}>
      {(() => {
        const mv = Math.sin(t * 1.6) * 30;
        return <g transform="translate(540 760)">
          <rect x={-420} y={-60} width={380 + mv} height={120} fill="#c9ced3" stroke="#7d858e" strokeWidth="4"/>
          <rect x={40 + mv} y={-60} width={380 - mv} height={120} fill="#c9ced3" stroke="#7d858e" strokeWidth="4"/>
          {Array.from({length: 5}, (_, i) => <rect key={i} x={-40 + mv} y={-56 + i * 24} width={70} height={12} fill="#8c96a0"/>)}
          {Array.from({length: 4}, (_, i) => <rect key={`b${i}`} x={-10 + mv} y={-44 + i * 24} width={70} height={12} fill="#5c6670"/>)}
        </g>;
      })()}
      <Label x={540} y={980} text="JUNTA DE DILATACIÓN" color={YELLOW} size={48}/>
      <Mark ok x={880} y={560} t={t} at={T.pie}/>
    </Shot>

    <Chip text="SE LLAMAN JUNTAS DE DILATACIÓN" y={330} t={t} at={T.juntas} until={T.calor} color={YELLOW} size={34}/>
    <Chip text="CON CALOR CRECE, CON FRÍO SE ENCOGE" y={330} t={t} at={T.calor} until={T.rigida} color="#ffffff" size={32}/>
    <Chip text="SIN JUNTAS SE AGRIETARÍA" y={330} t={t} at={T.rigida} until={T.espacio} color={RED} ink="#fff" size={36}/>
    <Chip text="ESPACIO PARA MOVERSE" y={330} t={t} at={T.espacio} until={T.pie} color={GREEN}/>
    <Chip text="ESE HUECO LO MANTIENE EN PIE" y={330} t={t} at={T.pie} color={YELLOW} size={36}/>
  </Stage>;
};
