import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, RED, GREEN, YELLOW, CYAN} from './common';
import {AirlinerSide, Airfoil, Label} from './shapes';

const Clouds: React.FC<{t: number; speed: number}> = ({t, speed}) => <g opacity=".45">
  {Array.from({length: 7}, (_, i) => {
    const x = ((i * 233 - t * speed * (1 + i % 3 * .4)) % 1500 + 1500) % 1500 - 200;
    return <ellipse key={i} cx={x} cy={420 + (i * 151) % 700} rx={150 + (i % 3) * 60} ry={30 + (i % 2) * 12} fill="#cfe2f3" opacity=".25" filter="url(#soft)"/>;
  })}
</g>;

export const AvionesPlanean: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {planea: B('planea', .1), alas: B('alas', .16), nariz: B('nariz', .3), altura: B('altura', .36), quince: B('quince', .5),
    diez: B('diez', .62), ciento: B('ciento', .68), hudson: B('hudson', .86)};
  const off = t > .9;
  const glide = interpolate(t, [T.planea, T.alas], [0, 60], clamp);

  return <Stage t={t} top="#1d3f66" mid="#0d2038">
    {/* 1. Motores apagados: no cae, planea */}
    <Shot t={t} from={-1} to={T.alas} cy={760}>
      <Clouds t={t} speed={80}/>
      <g transform={`translate(540 ${700 + glide}) rotate(${off ? 4 : 0}) scale(1.1)`}><AirlinerSide exhaust={off ? 0 : 1} engineOff={off}/></g>
      <Mark ok={false} x={452} y={850 + glide} t={t} at={.9} until={T.planea} size={56}/>
      {t > T.planea && <path d={`M 120 640 Q 540 ${700 + glide} 960 ${820}`} fill="none" stroke={YELLOW} strokeWidth="6" strokeDasharray="20 14" opacity={prog(t, T.planea, T.planea + .4)}/>}
    </Shot>
    {/* 2. Las alas solo necesitan aire rápido */}
    <Shot t={t} from={T.alas - .2} to={T.nariz} cy={760}>
      <g transform="translate(540 780)"><Airfoil t={t} lift={prog(t, T.alas + .3, T.alas + 1)}/></g>
      <Label x={540} y={1040} text="AIRE RÁPIDO = SUSTENTACIÓN" color={CYAN} size={40} o={prog(t, T.alas + .5, T.alas + 1)}/>
    </Shot>
    {/* 3. Cambia altura por velocidad */}
    <Shot t={t} from={T.nariz - .2} to={T.quince} cy={760}>
      <Clouds t={t} speed={140}/>
      <g transform={`translate(540 640) rotate(${6 * prog(t, T.nariz, T.nariz + .6)}) scale(.95)`}><AirlinerSide/></g>
      {[['ALTURA', 1 - .5 * prog(t, T.altura, T.quince), RED], ['VELOCIDAD', .5 + .4 * prog(t, T.altura, T.quince), GREEN]].map(([l, v, c], i) =>
        <g key={l as string} transform={`translate(150 ${920 + i * 100})`}>
          <Label x={0} y={18} text={l as string} anchor="start" size={38}/>
          <rect x={330} y={-16} width={460} height={44} rx={22} fill="#1d3550"/>
          <rect x={330} y={-16} width={460 * (v as number)} height={44} rx={22} fill={c as string}/>
        </g>)}
    </Shot>
    {/* 4. 15 km por cada km que baja */}
    <Shot t={t} from={T.quince - .2} to={T.hudson} cy={760}>
      {(() => {
        const k = prog(t, T.quince, T.quince + 1.2, easeOut);
        return <g>
          <line x1={110} y1={1000} x2={970} y2={1000} stroke="#5c6f84" strokeWidth="8"/>
          <path d={`M 110 600 L ${110 + 860 * k} ${600 + 400 * k}`} stroke={YELLOW} strokeWidth="8" strokeDasharray="20 12"/>
          <g transform={`translate(${110 + 860 * k} ${600 + 400 * k}) rotate(25) scale(.28)`}><AirlinerSide/></g>
          <path d="M 80 600 V 1000" stroke={CYAN} strokeWidth="6"/>
          <Label x={104} y={800} text={t > T.diez ? '10 KM' : '1 KM'} color={CYAN} anchor="start" size={40} o={1}/>
          <Label x={540} y={1060} text={t > T.diez ? '150 KM' : '15 KM'} color={YELLOW} size={56} o={k}/>
        </g>;
      })()}
      <BigText text="+150 KM" y={480} t={t} at={T.ciento} until={T.hudson} size={120} color={GREEN}/>
    </Shot>
    {/* 5. El río Hudson, 2009 */}
    <Shot t={t} from={T.hudson - .2} to={duration + 1} cy={760}>
      <rect x={0} y={860} width={1080} height={300} fill="#1f5f8f"/>
      {Array.from({length: 6}, (_, i) => <path key={i} d={`M ${((i * 230 - t * 60) % 1300 + 1300) % 1300 - 200} ${900 + (i % 3) * 70} q 40 -18 80 0 t 80 0`} stroke="#9fd3ff" strokeWidth="5" fill="none" opacity=".5"/>)}
      <g transform={`translate(540 ${840 + Math.sin(t * 2) * 4}) scale(.95)`}><AirlinerSide stripe={GREEN}/></g>
      <BigText text="2009" y={690} t={t} at={T.hudson} size={150} color="#fff"/>
      <Mark ok x={880} y={640} t={t} at={T.hudson + 1}/>
    </Shot>

    <Chip text="MOTORES APAGADOS" y={330} t={t} at={.9} until={T.planea} color={RED} ink="#fff"/>
    <Chip text="NO CAE: PLANEA" y={330} t={t} at={T.planea} until={T.alas} color={GREEN}/>
    <Chip text="EL ALA SOLO NECESITA AIRE" y={330} t={t} at={T.alas} until={T.nariz} color={CYAN} size={36}/>
    <Chip text="CAMBIA ALTURA POR VELOCIDAD" y={330} t={t} at={T.nariz} until={T.quince} color={YELLOW} size={36}/>
    <Chip text="15 KM POR CADA KM QUE BAJA" y={330} t={t} at={T.quince} until={T.hudson} color="#ffffff" size={36}/>
    <Chip text="RÍO HUDSON: TODOS VIVIERON" y={330} t={t} at={T.hudson + .3} color={GREEN} size={36}/>
  </Stage>;
};
