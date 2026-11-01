import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';
import {Airfoil, Label} from './shapes';

/** Helicóptero de lado (mirando a la derecha). Rotor principal como disco borroso. */
const HeliSide: React.FC<{t: number; rotor?: number}> = ({t, rotor = 1}) => <g>
  <path d="M -380 -60 L -150 -40 L -150 -10 L -380 -40 Z" fill="#c43b2f"/>
  <circle cx={-390} cy={-55} r={44} fill="none" stroke="#8c96a0" strokeWidth="6" opacity=".7"/>
  <line x1={-390} y1={-99} x2={-390} y2={-11} stroke="#cfe8ff" strokeWidth="6" transform={`rotate(${t * 2400} -390 -55)`}/>
  <path d="M -170 -110 Q -170 -170 -40 -170 L 90 -170 Q 200 -150 210 -60 Q 200 20 90 20 L -120 20 Q -170 10 -170 -40 Z" fill="#e8322b" stroke="#9c1f1a" strokeWidth="4"/>
  <path d="M 70 -150 Q 170 -140 190 -70 L 90 -70 Z" fill="#9fd3ff"/>
  <rect x={-20} y={-200} width={40} height={30} fill="#5c6670"/>
  <line x1={-140} y1={60} x2={160} y2={60} stroke="#5c6670" strokeWidth="10" strokeLinecap="round"/>
  <line x1={-80} y1={20} x2={-90} y2={60} stroke="#5c6670" strokeWidth="8"/><line x1={100} y1={20} x2={110} y2={60} stroke="#5c6670" strokeWidth="8"/>
  <ellipse cx={0} cy={-205} rx={420} ry={14} fill="#cfe8ff" opacity={.25 * rotor}/>
  <line x1={-420 * Math.cos(t * 30)} y1={-205} x2={420 * Math.cos(t * 30)} y2={-205} stroke="#3b434c" strokeWidth="10" strokeLinecap="round"/>
</g>;

/** Vista superior: rotor de 4 palas girando y cola. */
const HeliTop: React.FC<{t: number; bodyRot: number; tailPush: number}> = ({t, bodyRot, tailPush}) => <g transform={`rotate(${bodyRot})`}>
  <path d="M -60 -90 Q 0 -150 60 -90 L 60 80 Q 0 120 -60 80 Z" fill="#e8322b" stroke="#9c1f1a" strokeWidth="4"/>
  <rect x={-14} y={80} width={28} height={300} rx={10} fill="#c43b2f"/>
  <rect x={14} y={340} width={14} height={70} rx={5} fill="#5c6670"/>
  {tailPush > 0 && <g opacity={tailPush}><line x1={40} y1={375} x2={170} y2={375} stroke={GREEN} strokeWidth="14" strokeLinecap="round"/><path d="M 170 352 L 210 375 L 170 398 Z" fill={GREEN}/></g>}
  <g transform={`rotate(${-t * 400})`}>
    {[0, 90, 180, 270].map(a => <rect key={a} x={-14} y={-380} width={28} height={360} rx={12} fill="#3b434c" transform={`rotate(${a})`}/>)}
    <rect x={-14} y={-380} width={28} height={360} rx={12} fill={YELLOW}/>
    <circle r={30} fill="#8c96a0"/>
  </g>
</g>;

export const Helicoptero: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {pala: B('pala', .12), girar: B('girar', .2), quieto: B('quieto', .26), cola: B('cola', .44), giraria: B('giraria', .52),
    motor: B('motor', .7), planeando: B('planeando', .88)};
  const spinBad = t > T.giraria && t < T.giraria + 1.2 ? (t - T.giraria) * 60 : 0;
  const descend = prog(t, T.motor, duration - .5);

  return <Stage t={t} top="#1d3f66" mid="#0d2038">
    {/* 1. Quieto en el aire */}
    <Shot t={t} from={-1} to={T.pala} cy={760}>
      <g transform={`translate(560 ${760 + Math.sin(t * 2) * 10}) scale(1.05)`}><HeliSide t={t}/></g>
      {[-200, 0, 200].map(x => <path key={x} d={`M ${560 + x} 520 V 640`} stroke="#cfe8ff" strokeWidth="6" strokeDasharray="14 12" strokeDashoffset={-t * 200} opacity=".6"/>)}
    </Shot>
    {/* 2. Cada pala es un ala que gira */}
    <Shot t={t} from={T.pala - .2} to={T.cola} cy={760}>
      <g transform="translate(540 640) scale(.8)"><HeliTop t={t} bodyRot={0} tailPush={0}/></g>
      <g transform="translate(540 1040) scale(.6)" opacity={prog(t, T.girar, T.girar + .5)}><Airfoil t={t} lift={prog(t, T.quieto, T.quieto + .8)}/></g>
      <Label x={540} y={1150} text="CADA PALA = UN ALA" color={YELLOW} size={44} o={prog(t, T.pala + .3, T.pala + .8)}/>
    </Shot>
    {/* 3. El rotor de cola evita que gire sobre sí mismo */}
    <Shot t={t} from={T.cola - .2} to={T.motor} cy={760}>
      <g transform="translate(540 700) scale(.85)"><HeliTop t={t} bodyRot={spinBad} tailPush={prog(t, T.giraria + 1, T.giraria + 1.5)}/></g>
      {t > T.giraria && t < T.giraria + 1.2 && <path d="M 300 380 A 300 300 0 0 1 780 380" fill="none" stroke={RED} strokeWidth="12" strokeDasharray="22 14"/>}
      <Mark ok={false} x={880} y={1060} t={t} at={T.giraria} until={T.giraria + 1.2}/>
      <Mark ok x={880} y={1060} t={t} at={T.giraria + 1.5} until={T.motor}/>
    </Shot>
    {/* 4. Autorrotación: sin motor, baja planeando */}
    <Shot t={t} from={T.motor - .2} to={duration + 1} cy={760}>
      <rect x={0} y={1100} width={1080} height={80} fill="#2b3a2a"/>
      <g transform={`translate(560 ${560 + 420 * descend}) scale(.9)`}><HeliSide t={t * .8}/></g>
      {[-220, 0, 220].map(x => <g key={x} opacity={prog(t, T.motor + .4, T.motor + .8)}>
        <path d={`M ${560 + x} ${560 + 420 * descend + 90} V ${560 + 420 * descend - 80}`} stroke={CYAN} strokeWidth="10" strokeLinecap="round"/>
        <path d={`M ${542 + x} ${560 + 420 * descend - 70} L ${560 + x} ${560 + 420 * descend - 104} L ${578 + x} ${560 + 420 * descend - 70} Z`} fill={CYAN}/>
      </g>)}
      <Mark ok x={880} y={560} t={t} at={T.planeando + .6}/>
    </Shot>

    <Chip text="SUS ALAS GIRAN" y={330} t={t} at={.5} until={T.pala} color={YELLOW}/>
    <Chip text="EL AIRE PASA AUNQUE ESTÉ QUIETO" y={330} t={t} at={T.girar} until={T.cola} color={CYAN} size={32}/>
    <Chip text="SIN COLA, GIRARÍA SOBRE SÍ" y={330} t={t} at={T.cola} until={T.giraria + 1.2} color={RED} ink="#fff" size={36}/>
    <Chip text="EL ROTOR DE COLA LO DETIENE" y={330} t={t} at={T.giraria + 1.2} until={T.motor} color={GREEN} size={36}/>
    <Chip text="SIN MOTOR: BAJA PLANEANDO" y={330} t={t} at={T.motor + .3} color={GREEN} size={36}/>
  </Stage>;
};
