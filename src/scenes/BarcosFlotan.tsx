import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const WATER = 780;
const STEEL = '#8c96a0';
const Water: React.FC<{t: number; level?: number}> = ({t, level = WATER}) => <g>
  <rect x={0} y={level} width={1080} height={1200 - level} fill="#1f6fb0" opacity=".55"/>
  <path d={`M 0 ${level} ${Array.from({length: 28}, (_, i) => `Q ${i * 40 + 20} ${level - 8 + 8 * Math.sin(t * 3 + i)} ${i * 40 + 40} ${level}`).join(' ')}`} fill="none" stroke="#9fd3ff" strokeWidth="5"/>
</g>;
/** Casco de barco (sección) con cubierta; `sink` 0..1 lo hunde y lo llena de agua. */
const Hull: React.FC<{x: number; w: number; draft: number; sink?: number}> = ({x, w, draft, sink = 0}) => {
  const y = WATER - 120 + draft + sink * 360;
  return <g transform={`translate(${x} ${y}) rotate(${sink * 18})`}>
    <path d={`M ${-w / 2} 0 L ${w / 2} 0 L ${w / 2 - 60} 170 L ${-w / 2 + 60} 170 Z`} fill={STEEL} stroke="#5c6670" strokeWidth="6"/>
    <path d={`M ${-w / 2 + 16} 10 L ${w / 2 - 16} 10 L ${w / 2 - 70} 156 L ${-w / 2 + 70} 156 Z`} fill={sink > 0 ? '#1f6fb0' : '#e8eef4'} opacity={sink > 0 ? .4 + .5 * sink : .25}/>
    <rect x={-60} y={-90} width={120} height={90} fill="#e8eef4"/><rect x={-20} y={-150} width={30} height={60} fill="#c43b2f"/>
  </g>;
};

export const BarcosFlotan: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {forma: B('forma', .14), empuja: B('empuja', .22), aparta: B('aparta', .3), bola: B('bola', .38, 0), hueco: B('hueco', .5),
    sostenerlo: B('sostenerlo', .62), entra: B('entra', .7), arquimedes: B('arquimedes', .86)};
  T.bola = B('bola', .38, T.aparta); // la segunda vez que se menciona la bola
  const ballSink = prog(t, .4, 1.8, easeOut);
  const morph = prog(t, T.hueco, T.hueco + 1.2, easeOut);
  const sink = prog(t, T.entra + .3, T.arquimedes);

  return <Stage t={t} top="#16324f" mid="#0a1a2b">
    {/* 1. La bola se hunde, el barco flota */}
    <Shot t={t} from={-1} to={T.empuja} cy={760}>
      <Water t={t}/>
      <circle cx={270} cy={600 + 480 * ballSink} r={70} fill={STEEL} stroke="#5c6670" strokeWidth="6"/>
      <Hull x={760} w={360} draft={0}/>
      <Mark ok={false} x={270} y={480} t={t} at={1.2} until={T.empuja} size={70}/>
      <Mark ok x={760} y={480} t={t} at={1.4} until={T.empuja} size={70}/>
    </Shot>
    {/* 2. El agua empuja con el peso del agua que aparta */}
    <Shot t={t} from={T.empuja - .2} to={T.hueco} cy={760}>
      <Water t={t}/>
      <circle cx={540} cy={WATER + 80} r={80} fill={STEEL} stroke="#5c6670" strokeWidth="6"/>
      <circle cx={540 + 300 * prog(t, T.aparta, T.aparta + 1)} cy={WATER + 80} r={80} fill={CYAN} opacity={.5 * prog(t, T.aparta, T.aparta + .5)}/>
      <g opacity={prog(t, T.empuja, T.empuja + .4)}>
        <line x1={540} y1={WATER + 160} x2={540} y2={WATER + 160 + 120} stroke={RED} strokeWidth="14"/><path d={`M 520 ${WATER + 280} L 540 ${WATER + 310} L 560 ${WATER + 280} Z`} fill={RED}/>
        <line x1={540} y1={WATER} x2={540} y2={WATER - 60} stroke={GREEN} strokeWidth="14"/><path d={`M 520 ${WATER - 60} L 540 ${WATER - 90} L 560 ${WATER - 60} Z`} fill={GREEN}/>
        <Label x={600} y={WATER + 260} text="PESO" color={RED} size={36} anchor="start"/>
        <Label x={600} y={WATER - 50} text="EMPUJE" color={GREEN} size={36} anchor="start"/>
      </g>
      <Label x={540} y={1130} text="APARTA POCA AGUA: SE HUNDE" color={RED} size={36} o={prog(t, T.bola, T.bola + .4)}/>
    </Shot>
    {/* 3. El mismo acero como casco hueco: aparta muchísima agua */}
    <Shot t={t} from={T.hueco - .2} to={T.entra} cy={760}>
      <Water t={t}/>
      {morph < .5 ? <circle cx={540} cy={WATER - 40} r={80 * (1 - morph)} fill={STEEL}/> : <Hull x={540} w={160 + 400 * morph} draft={20}/>}
      <g opacity={prog(t, T.sostenerlo - .4, T.sostenerlo)}>
        {[-200, 0, 200].map(x => <g key={x}><line x1={540 + x} y1={WATER + 330} x2={540 + x} y2={WATER + 220} stroke={GREEN} strokeWidth="16"/>
          <path d={`M ${518 + x} ${WATER + 220} L ${540 + x} ${WATER + 186} L ${562 + x} ${WATER + 220} Z`} fill={GREEN}/></g>)}
      </g>
      <Label x={540} y={560} text="MISMO ACERO, OTRA FORMA" color={YELLOW} size={40} o={prog(t, T.hueco + .4, T.hueco + .8)}/>
    </Shot>
    {/* 4. Si le entra agua, pierde el aire y se hunde */}
    <Shot t={t} from={T.entra - .2} to={T.arquimedes} cy={760}>
      <Water t={t}/>
      <Hull x={540} w={560} draft={20} sink={sink}/>
      <Mark ok={false} x={880} y={500} t={t} at={T.entra + 1}/>
    </Shot>
    {/* 5. Arquímedes */}
    <Shot t={t} from={T.arquimedes - .2} to={duration + 1} cy={760}>
      <Water t={t}/>
      <Hull x={540} w={560} draft={20}/>
      <BigText text="ARQUÍMEDES" y={560} t={t} at={T.arquimedes} size={110} color={YELLOW}/>
      <Label x={540} y={640} text="HACE MÁS DE 2000 AÑOS" size={40} o={prog(t, T.arquimedes + .4, T.arquimedes + .8)}/>
    </Shot>

    <Chip text="EL SECRETO ES LA FORMA" y={330} t={t} at={T.forma} until={T.empuja} color={YELLOW}/>
    <Chip text="EL AGUA EMPUJA HACIA ARRIBA" y={330} t={t} at={T.empuja} until={T.hueco} color={GREEN} size={36}/>
    <Chip text="CASCO HUECO = MÁS AGUA APARTADA" y={330} t={t} at={T.hueco} until={T.entra} color={CYAN} size={34}/>
    <Chip text="SI ENTRA AGUA, SE HUNDE" y={330} t={t} at={T.entra} until={T.arquimedes} color={RED} ink="#fff"/>
    <Chip text="EL PRINCIPIO DE ARQUÍMEDES" y={330} t={t} at={T.arquimedes} color="#ffffff" size={36}/>
  </Stage>;
};
