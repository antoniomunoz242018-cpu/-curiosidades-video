import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, rnd, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const Rain: React.FC<{t: number}> = ({t}) => <g opacity=".5">
  {Array.from({length: 40}, (_, i) => {
    const y = ((rnd(i) * 1200 + t * 1400) % 1300) - 100;
    return <line key={i} x1={rnd(i + 5) * 1080} y1={y} x2={rnd(i + 5) * 1080 - 14} y2={y + 50} stroke="#9fd3ff" strokeWidth="3"/>;
  })}
</g>;

/** Huella de la llanta vista desde abajo: banda con canales; gotas que salen por los canales. */
const Footprint: React.FC<{t: number; flow: number}> = ({t, flow}) => <g>
  <rect x={-200} y={-300} width={400} height={600} rx={60} fill="#1b1f24"/>
  {[-120, -40, 40, 120].map(x => <rect key={x} x={x - 14} y={-300} width={28} height={600} fill="#2f7fd8" opacity=".35"/>)}
  {Array.from({length: 7}, (_, i) => <path key={i} d={`M -200 ${-260 + i * 90} L -60 ${-220 + i * 90} M 200 ${-260 + i * 90} L 60 ${-220 + i * 90}`} stroke="#2f7fd8" strokeWidth="20" opacity=".35"/>)}
  {flow > 0 && Array.from({length: 24}, (_, i) => {
    const p = ((t * .9 + i / 24) % 1), side = i % 2 ? 1 : -1, row = (i * 7) % 7;
    return <circle key={i} cx={side * (60 + p * 340)} cy={-220 + row * 90 - p * 40} r={10} fill={CYAN} opacity={flow * (1 - p * .7)}/>;
  })}
</g>;

export const DibujoLlantas: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {lluvia: B('lluvia', .06), capa: B('capa', .14), flotaria: B('flotaria', .24), acuaplaneo: B('acuaplaneo', .34), canales: B('canales', .42),
    lados: B('lados', .54), litros: B('litros', .66), gasta: B('gasta', .8), peligrosa: B('peligrosa', .92)};
  const lift = prog(t, T.flotaria, T.flotaria + .8);

  return <Stage t={t} top="#22303d" mid="#0f171f">
    <Rain t={t}/>
    {/* 1. Auto en la lluvia */}
    <Shot t={t} from={-1} to={T.capa} cy={760}>
      <rect x={0} y={900} width={1080} height={260} fill="#2b2f36"/>
      <rect x={0} y={900} width={1080} height={16} fill="#5c8fb8" opacity=".6"/>
      <g transform={`translate(540 ${820 + Math.sin(t * 8) * 2})`}>
        <path d="M -330 40 L -300 -60 L -160 -70 L -90 -150 L 120 -150 L 200 -70 L 330 -50 L 340 40 Z" fill="#c43b2f"/>
        <path d="M -80 -140 L 110 -140 L 170 -75 L -140 -72 Z" fill="#9fd3ff" opacity=".7"/>
        {[-210, 220].map(x => <g key={x} transform={`translate(${x} 44)`}><circle r={56} fill="#15171b"/><circle r={28} fill="#8c96a0"/></g>)}
      </g>
    </Shot>
    {/* 2. Sin dibujo: la llanta flota sobre el agua */}
    <Shot t={t} from={T.capa - .2} to={T.canales} cy={760}>
      <rect x={0} y={960} width={1080} height={200} fill="#2b2f36"/>
      <path d={`M 0 960 L 1080 960 L 1080 ${930 - 40 * lift} L 640 ${940 - 70 * lift} Q 520 ${950 - 60 * lift} 420 960 Z`} fill="#2f7fd8" opacity=".7"/>
      <g transform={`translate(540 ${700 - 60 * lift}) rotate(${t * 200})`}>
        <circle r={250} fill="#15171b"/><circle r={130} fill="#8c96a0"/><circle r={40} fill="#3b434c"/>
      </g>
      <Label x={540} y={1100} text="ACUAPLANEO" color={RED} size={64} o={prog(t, T.acuaplaneo, T.acuaplaneo + .4)}/>
      <Mark ok={false} x={880} y={500} t={t} at={T.acuaplaneo} until={T.canales}/>
    </Shot>
    {/* 3. Los canales sacan el agua */}
    <Shot t={t} from={T.canales - .2} to={T.gasta} cy={760}>
      <g transform="translate(540 760)"><Footprint t={t} flow={prog(t, T.canales + .3, T.lados)}/></g>
      <BigText text="DECENAS DE LITROS / SEG" y={1180} t={t} at={T.litros} until={T.gasta} size={56} color={CYAN}/>
    </Shot>
    {/* 4. Nueva vs gastada */}
    <Shot t={t} from={T.gasta - .2} to={duration + 1} cy={760}>
      {[[300, 1, 'NUEVA', GREEN], [780, .15, 'GASTADA', RED]].map(([x, depth, l, c]) => <g key={l as string} transform={`translate(${x} 760)`}>
        <rect x={-180} y={-60} width={360} height={140} rx={30} fill="#15171b"/>
        {[-110, -30, 50, 130].map(gx => <rect key={gx} x={gx - 22} y={-60} width={44} height={110 * (depth as number)} fill="#0f171f"/>)}
        <Label x={0} y={170} text={l as string} color={c as string} size={44}/>
      </g>)}
      <Mark ok x={300} y={540} t={t} at={T.gasta + .4} size={70}/>
      <Mark ok={false} x={780} y={540} t={t} at={T.peligrosa} size={70}/>
    </Shot>

    <Chip text="EXISTE POR LA LLUVIA" y={330} t={t} at={T.lluvia} until={T.capa} color={CYAN}/>
    <Chip text="SE FORMA UNA CAPA DE AGUA" y={330} t={t} at={T.capa} until={T.flotaria} color="#ffffff" size={36}/>
    <Chip text="SIN DIBUJO, FLOTARÍAS" y={330} t={t} at={T.flotaria} until={T.canales} color={RED} ink="#fff"/>
    <Chip text="LOS CANALES SON DESAGÜES" y={330} t={t} at={T.canales} until={T.gasta} color={GREEN} size={36}/>
    <Chip text="GASTADA = PELIGRO CON LLUVIA" y={330} t={t} at={T.gasta} color={RED} ink="#fff" size={36}/>
  </Stage>;
};
