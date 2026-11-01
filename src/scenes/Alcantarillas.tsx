import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const IRON = '#6b7480', IRON_D = '#4a525c';
/** Tapa redonda vista desde arriba, con relieve. */
const RoundCover: React.FC<{r: number; rot?: number}> = ({r, rot = 0}) => <g transform={`rotate(${rot})`}>
  <circle r={r} fill={IRON} stroke={IRON_D} strokeWidth="10"/>
  {[.75, .5].map(f => <circle key={f} r={r * f} fill="none" stroke={IRON_D} strokeWidth="8"/>)}
  {Array.from({length: 8}, (_, i) => <line key={i} x1={0} y1={-r * .25} x2={0} y2={-r * .9} stroke={IRON_D} strokeWidth="8" transform={`rotate(${i * 45})`}/>)}
</g>;

export const Alcantarillas: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {cuadrada: B('cuadrada', .16), diagonal: B('diagonal', .28), circulo: B('circulo', .36), direcciones: B('direcciones', .44),
    rodandola: B('rodandola', .58), acomodarla: B('acomodarla', .7), abajo: B('abajo', .86)};
  const H = 420; // ancho del agujero
  const alignSq = prog(t, T.cuadrada + .4, T.diagonal, easeOut);
  const drop = prog(t, T.diagonal + .2, T.diagonal + 1.4);

  return <Stage t={t} top="#26262a" mid="#141416">
    <rect x={0} y={400} width={1080} height={760} fill="#2f3237"/>
    {/* 1. Tapa redonda sobre su agujero */}
    <Shot t={t} from={-1} to={T.cuadrada} cy={760}>
      <circle cx={540} cy={760} r={H / 2} fill="#050607"/>
      <g transform={`translate(540 ${760 - 200 * (1 - prog(t, .2, 1.2, easeOut))})`}><RoundCover r={H / 2 + 14} rot={t * 20}/></g>
    </Shot>
    {/* 2. Cuadrada: de lado cabe por la diagonal y se cae */}
    <Shot t={t} from={T.cuadrada - .2} to={T.circulo} cy={760}>
      <rect x={540 - H / 2} y={760 - H / 2} width={H} height={H} fill="#050607"/>
      <line x1={540 - H / 2} y1={760 - H / 2} x2={540 + H / 2} y2={760 + H / 2} stroke={YELLOW} strokeWidth="6" strokeDasharray="16 10" opacity={prog(t, T.cuadrada + .3, T.cuadrada + .7)}/>
      <g transform={`translate(540 760) rotate(${45 * alignSq}) scale(${1 - .7 * drop})`} opacity={1 - drop}>
        <rect x={-H / 2} y={-14} width={H} height={28} rx={4} fill={IRON} stroke={IRON_D} strokeWidth="5"/>
      </g>
      <Label x={540} y={1060} text="CABE DE LADO" color={RED} size={44} o={prog(t, T.diagonal, T.diagonal + .4)}/>
      <Mark ok={false} x={880} y={560} t={t} at={T.diagonal + 1} until={T.circulo}/>
    </Shot>
    {/* 3. Círculo: mide lo mismo en todas direcciones */}
    <Shot t={t} from={T.circulo - .2} to={T.rodandola} cy={760}>
      <circle cx={540} cy={760} r={H / 2} fill="#050607"/>
      <circle cx={540} cy={760} r={H / 2 + 14} fill="none" stroke="#8c96a0" strokeWidth="6" strokeDasharray="10 8"/>
      <g transform={`translate(540 760) rotate(${t * 70})`}>
        <rect x={-H / 2 - 14} y={-14} width={H + 28} height={28} rx={4} fill={IRON} stroke={IRON_D} strokeWidth="5"/>
      </g>
      {window01(t, T.direcciones, T.rodandola) > 0 && <g opacity={window01(t, T.direcciones, T.rodandola)} transform={`translate(540 760) rotate(${t * 70 + 90})`}>
        <line x1={-H / 2} y1={0} x2={H / 2} y2={0} stroke={CYAN} strokeWidth="6"/>
      </g>}
      <Label x={540} y={1060} text="NUNCA CABE" color={GREEN} size={44} o={prog(t, T.circulo + .5, T.circulo + .9)}/>
      <Mark ok x={880} y={560} t={t} at={T.direcciones + .4} until={T.rodandola}/>
    </Shot>
    {/* 4. Se mueve rodando */}
    <Shot t={t} from={T.rodandola - .2} to={T.acomodarla} cy={760}>
      <line x1={0} y1={940} x2={1080} y2={940} stroke="#5c6670" strokeWidth="8"/>
      {(() => {
        const k = prog(t, T.rodandola, T.acomodarla, easeOut), x = 180 + 700 * k;
        return <g transform={`translate(${x} 730)`}>
          <ellipse rx={40} ry={210} fill={IRON} stroke={IRON_D} strokeWidth="8"/>
          <line x1={0} y1={-210} x2={0} y2={210} stroke={IRON_D} strokeWidth="6" transform={`scale(.2 1) rotate(${k * 900})`}/>
        </g>;
      })()}
      <Label x={540} y={1060} text="DECENAS DE KILOS" size={44} o={prog(t, T.rodandola + .3, T.rodandola + .7)}/>
    </Shot>
    {/* 5. Embona en cualquier posición */}
    <Shot t={t} from={T.acomodarla - .2} to={duration + 1} cy={760}>
      <circle cx={540} cy={760} r={H / 2} fill="#050607"/>
      <g transform={`translate(540 ${760 - 160 * (1 - prog(t, T.acomodarla, T.acomodarla + .8, easeOut))})`}><RoundCover r={H / 2 + 14} rot={-t * 50}/></g>
      <Mark ok x={880} y={560} t={t} at={T.abajo}/>
    </Shot>

    <Chip text="NUNCA SE CAE POR SU AGUJERO" y={330} t={t} at={.5} until={T.cuadrada} color={GREEN} size={36}/>
    <Chip text="UNA CUADRADA SÍ SE CAE" y={330} t={t} at={T.cuadrada} until={T.circulo} color={RED} ink="#fff"/>
    <Chip text="EL CÍRCULO MIDE LO MISMO SIEMPRE" y={330} t={t} at={T.circulo} until={T.rodandola} color={CYAN} size={32}/>
    <Chip text="SE MUEVE RODANDO" y={330} t={t} at={T.rodandola} until={T.acomodarla} color={YELLOW}/>
    <Chip text="EMBONA EN CUALQUIER POSICIÓN" y={330} t={t} at={T.acomodarla} color={GREEN} size={36}/>
  </Stage>;
};
