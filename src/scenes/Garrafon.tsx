import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, Arrow, rnd, RED, GREEN, YELLOW, CYAN} from './common';

/** Garrafón de 20 L de perfil. `ribs`: con anillos; `dent`: abolladura de los costados (0..1); `level`: nivel de agua. */
const Jug: React.FC<{ribs?: boolean; dent?: number; level?: number; glowRibs?: number; inverted?: boolean}> = ({ribs = true, dent = 0, level = .85, glowRibs = 0, inverted = false}) => {
  const W = 170, H = 420, d = dent * 60;
  const body = `M ${-W} ${-H / 2 + 60} Q ${-W} ${-H / 2} ${-W + 70} ${-H / 2 - 30} L -42 ${-H / 2 - 70} L -42 ${-H / 2 - 120} L 42 ${-H / 2 - 120} L 42 ${-H / 2 - 70} L ${W - 70} ${-H / 2 - 30} Q ${W} ${-H / 2} ${W} ${-H / 2 + 60}
    Q ${W - d} 0 ${W} ${H / 2 - 30} Q ${W} ${H / 2} ${W - 30} ${H / 2} L ${-W + 30} ${H / 2} Q ${-W} ${H / 2} ${-W} ${H / 2 - 30} Q ${-W + d} 0 ${-W} ${-H / 2 + 60} Z`;
  const waterTop = H / 2 - (H + 40) * level;
  return <g>
    <defs><clipPath id={`jug-${ribs ? 'r' : 's'}-${Math.round(dent * 10)}`}><path d={body}/></clipPath></defs>
    <path d={body} fill="#9fd3ff" fillOpacity=".18" stroke="#bfe3ff" strokeWidth="6"/>
    <g clipPath={`url(#jug-${ribs ? 'r' : 's'}-${Math.round(dent * 10)})`}>
      {/* boca abajo, el agua se va hacia el cuello */}
      <rect x={-W - 20} y={inverted ? -H / 2 - 130 : waterTop} width={W * 2 + 40} height={inverted ? (H + 40) * level : H} fill="#4aa8ff" opacity=".45"/>
    </g>
    {ribs && [-120, -40, 40, 120].map(y => <g key={y}>
      <path d={`M ${-W + 4} ${y} Q 0 ${y + 18} ${W - 4} ${y}`} fill="none" stroke={glowRibs > 0 ? YELLOW : '#d8eeff'} strokeWidth={glowRibs > 0 ? 12 : 8} opacity={.9}/>
    </g>)}
    <rect x={-50} y={-H / 2 - 150} width={100} height={36} rx={8} fill="#2f7fd8"/>
    <path d={`M ${-W + 40} ${-H / 2 + 40} L ${-W + 52} ${H / 2 - 60}`} stroke="#fff" strokeOpacity=".3" strokeWidth="18" strokeLinecap="round"/>
  </g>;
};

export const Garrafon: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {anillos: B('anillos', .08), fuerte: B('fuerte', .14), delgado: B('delgado', .2), doblaria: B('doblaria', .26), apilarlo: B('apilarlo', .34),
    golpes: B('golpes', .42), cuello: B('cuello', .54), voltearlo: B('voltearlo', .64), aire: B('aire', .7), glu: B('glu', .8), curva: B('curva', .92)};
  const squash = prog(t, T.doblaria - .2, T.doblaria + .8);
  const flip = prog(t, T.voltearlo - .2, T.voltearlo + .8, easeOut);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.delgado} cy={760}>
      <g transform="translate(540 790) scale(1.25)"><Jug glowRibs={prog(t, T.anillos, T.anillos + .4)}/></g>
    </Shot>
    {/* Sin anillos se dobla; con anillos aguanta */}
    <Shot t={t} from={T.delgado - .2} to={T.cuello} cy={760}>
      <g transform={`translate(300 ${820 + 40 * squash}) scale(.9 ${.9 - .15 * squash})`}><Jug ribs={false} dent={squash}/></g>
      <g transform="translate(780 820) scale(.9)"><Jug glowRibs={prog(t, T.apilarlo, T.apilarlo + .4)}/></g>
      {/* peso encima */}
      {[300, 780].map((x, i) => <g key={x} transform={`translate(${x} ${430 + (i === 0 ? 40 * squash : 0)})`} opacity={prog(t, T.delgado, T.delgado + .4)}>
        <rect x={-120} y={-60} width={240} height={90} rx={12} fill="#5c6f84"/>
        <text y={6} textAnchor="middle" fontSize="40" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">20 L</text>
      </g>)}
      <Mark ok={false} x={300} y={1130} t={t} at={T.doblaria + .4} until={T.cuello}/>
      <Mark ok x={780} y={1130} t={t} at={T.apilarlo + .2} until={T.cuello}/>
      {t > T.golpes && t < T.cuello && <g opacity={window01(t, T.golpes, T.cuello)}>
        <Arrow x1={1020} y1={700} x2={900} y2={760} t={t} at={T.golpes} until={T.cuello} color={YELLOW}/>
      </g>}
    </Shot>
    {/* Cuello angosto: embona en el dispensador; el agua sale cuando entra aire */}
    <Shot t={t} from={T.cuello - .2} to={T.curva} cy={760}>
      <rect x={380} y={900} width={320} height={260} rx={20} fill="#e8eef4"/>
      <rect x={480} y={880} width={120} height={30} rx={8} fill="#c9d3dc"/>
      <g transform={`translate(540 ${560 + 130 * flip}) rotate(${180 * flip}) scale(.75)`}><Jug level={.85} inverted={flip > .5}/></g>
      {t > T.aire && Array.from({length: 8}, (_, i) => {
        const p = (t * .9 + i / 8) % 1;
        return <circle key={i} cx={540 + (rnd(i) - .5) * 120} cy={760 - p * 330} r={10 + rnd(i + 2) * 10} fill="none" stroke="#fff" strokeWidth="4" opacity={1 - p}/>;
      })}
      {t > T.glu && <text x={640} y={640} fontSize="62" fontWeight="900" fill={CYAN} fontFamily="Arial Black, Arial"
        transform={`rotate(-8 760 640) scale(${1 + .06 * Math.sin(t * 12)})`} opacity={window01(t, T.glu, T.curva)}>GLU GLU</text>}
    </Shot>
    <Shot t={t} from={T.curva - .2} to={duration + 1} cy={760}>
      <g transform="translate(540 790) scale(1.2)"><Jug glowRibs={1}/></g>
      <Mark ok x={860} y={560} t={t} at={T.curva + .3}/>
    </Shot>

    <Chip text="LOS ANILLOS LO HACEN FUERTE" y={330} t={t} at={T.anillos} until={T.delgado} color={YELLOW} size={36}/>
    <Chip text="SIN ANILLOS SE DOBLARÍA" y={330} t={t} at={T.delgado} until={T.apilarlo} color={RED} ink="#fff"/>
    <Chip text="CON ANILLOS AGUANTA EL PESO" y={330} t={t} at={T.apilarlo} until={T.cuello} color={GREEN} size={36}/>
    <Chip text="EL CUELLO EMBONA EN EL DISPENSADOR" y={330} t={t} at={T.cuello} until={T.aire} color="#ffffff" size={32}/>
    <Chip text="SALE AGUA CUANDO ENTRA AIRE" y={330} t={t} at={T.aire} until={T.curva} color={CYAN} size={36}/>
    <Chip text="CADA CURVA TIENE UN TRABAJO" y={330} t={t} at={T.curva} color={YELLOW} size={36}/>
  </Stage>;
};
