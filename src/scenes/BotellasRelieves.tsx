import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

/** Botella PET de perfil. `ribs` anillos; `crush` aplastamiento 0..1; `glow` resalta anillos. */
const Bottle: React.FC<{ribs?: boolean; crush?: number; glow?: number; liquid?: string}> = ({ribs = true, crush = 0, glow = 0, liquid = '#9fd3ff'}) => {
  const W = 110, H = 520, d = 70 * crush;
  const body = `M -30 ${-H / 2 - 60} L 30 ${-H / 2 - 60} L 30 ${-H / 2 - 20} Q ${W} ${-H / 2 + 30} ${W} ${-H / 2 + 120} Q ${W - d} 0 ${W} ${H / 2 - 30}
    Q ${W} ${H / 2} ${W - 30} ${H / 2} L ${-W + 30} ${H / 2} Q ${-W} ${H / 2} ${-W} ${H / 2 - 30} Q ${-W + d} 0 ${-W} ${-H / 2 + 120} Q ${-W} ${-H / 2 + 30} -30 ${-H / 2 - 20} Z`;
  return <g transform={`scale(1 ${1 - .25 * crush})`}>
    <path d={body} fill={liquid} fillOpacity=".25" stroke="#cfe8ff" strokeWidth="6"/>
    {ribs && [-100, -40, 20, 80, 140].map(y => <path key={y} d={`M ${-W + 4} ${y} Q 0 ${y + 16} ${W - 4} ${y}`} fill="none" stroke={glow > 0 ? YELLOW : '#e8f4ff'} strokeWidth={glow > 0 ? 12 : 8} opacity=".9"/>)}
    <rect x={-40} y={-H / 2 - 100} width={80} height={44} rx={8} fill="#2f7fd8"/>
  </g>;
};

/** Fondo petaloide visto desde abajo (5 patitas). */
const Petaloid: React.FC<{glow: number; t: number}> = ({glow, t}) => <g>
  <circle r={210} fill="#9fd3ff" fillOpacity=".15" stroke="#cfe8ff" strokeWidth="6"/>
  {Array.from({length: 5}, (_, i) => <ellipse key={i} cx={0} cy={-120} rx={62} ry={84} fill="#cfe8ff" fillOpacity=".35" stroke="#e8f4ff" strokeWidth="5" transform={`rotate(${i * 72})`}/>)}
  {glow > 0 && Array.from({length: 10}, (_, i) => <g key={i} transform={`rotate(${i * 36 + t * 10})`} opacity={glow}>
    <line x1={0} y1={-40} x2={0} y2={-150} stroke={YELLOW} strokeWidth="8"/><path d="M -12 -140 L 0 -170 L 12 -140 Z" fill={YELLOW}/>
  </g>)}
</g>;

export const BotellasRelieves: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {resistente: B('resistente', .1), delgado: B('delgado', .18), aplastaria: B('aplastaria', .24), anillos: B('anillos', .32), costillas: B('costillas', .38),
    refresco: B('refresco', .5), patitas: B('patitas', .56), gas: B('gas', .62), infle: B('infle', .72), plastico: B('plastico', .9, 0)};
  T.plastico = B('plastico', .9, T.infle);
  const crush = prog(t, T.aplastaria - .2, T.aplastaria + .8);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.delgado} cy={760}>
      <g transform="translate(540 780) scale(1.2)"><Bottle glow={prog(t, .4, 1)}/></g>
    </Shot>
    {/* Lisa se aplasta; con anillos aguanta */}
    <Shot t={t} from={T.delgado - .2} to={T.refresco} cy={760}>
      {[300, 780].map((x, i) => <g key={x}>
        <g transform={`translate(${x} ${870 + (i ? 0 : 60 * crush)}) scale(.85)`}><Bottle ribs={i === 1} crush={i ? 0 : crush} glow={i && t > T.anillos ? 1 : 0}/></g>
        <g transform={`translate(${x} ${505 + (i ? 0 : 110 * crush)})`} opacity={prog(t, T.delgado, T.delgado + .4)}>
          {[0, 1, 2].map(k => <rect key={k} x={-110} y={-k * 44} width={220} height={40} rx={10} fill="#5c6f84" stroke="#3b4a5a" strokeWidth="3"/>)}
        </g>
      </g>)}
      <Mark ok={false} x={300} y={1180} t={t} at={T.aplastaria + .5} until={T.refresco} size={70}/>
      <Mark ok x={780} y={1180} t={t} at={T.anillos} until={T.refresco} size={70}/>
      <Label x={780} y={1080} text="COMO COSTILLAS" color={YELLOW} size={36} o={prog(t, T.costillas, T.costillas + .4)}/>
    </Shot>
    {/* Fondo de 5 patitas reparte la presión del gas */}
    <Shot t={t} from={T.refresco - .2} to={T.plastico} cy={760}>
      <g transform="translate(540 760) scale(1.25)"><Petaloid glow={prog(t, T.gas, T.gas + .5)} t={t}/></g>
      <Label x={540} y={1100} text="5 PATITAS" color={CYAN} size={56} o={prog(t, T.patitas, T.patitas + .4)}/>
      <Mark ok x={880} y={520} t={t} at={T.infle + .3} until={T.plastico}/>
    </Shot>
    <Shot t={t} from={T.plastico - .2} to={duration + 1} cy={760}>
      <g transform="translate(540 800) scale(1.2)"><Bottle glow={1} liquid="#ff6a3d"/></g>
      <Label x={540} y={1180} text="MENOS PLÁSTICO" color={GREEN} size={60} o={prog(t, T.plastico, T.plastico + .4)}/>
    </Shot>

    <Chip text="NO SON DECORACIÓN" y={330} t={t} at={T.resistente} until={T.delgado} color={YELLOW}/>
    <Chip text="LISA SE APLASTARÍA" y={330} t={t} at={T.delgado} until={T.anillos} color={RED} ink="#fff"/>
    <Chip text="LOS ANILLOS LE DAN RIGIDEZ" y={330} t={t} at={T.anillos} until={T.refresco} color={GREEN} size={36}/>
    <Chip text="EL GAS EMPUJA DESDE ADENTRO" y={330} t={t} at={T.gas} until={T.infle} color={CYAN} size={36}/>
    <Chip text="LAS PATITAS REPARTEN LA FUERZA" y={330} t={t} at={T.infle} until={T.plastico} color={YELLOW} size={34}/>
    <Chip text="FUERTE CON MENOS PLÁSTICO" y={330} t={t} at={T.plastico} color={GREEN} size={36}/>
  </Stage>;
};
