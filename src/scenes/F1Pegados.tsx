import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';
import {Airfoil, Label} from './shapes';

const RED_F1 = '#e10600';
/** Fórmula 1 de lado mirando a la derecha; (0,0) = piso bajo el centro. */
export const F1Car: React.FC<{t: number; spin?: boolean}> = ({t, spin = true}) => {
  const wheel = (x: number, r: number) => <g transform={`translate(${x} ${-r})`}>
    <circle r={r} fill="#15171b"/><circle r={r * .55} fill="#3b434c"/>
    {Array.from({length: 5}, (_, i) => <rect key={i} x={-4} y={-r * .5} width={8} height={r * .45} fill="#8c96a0" transform={`rotate(${i * 72 + (spin ? t * 900 : 0)})`}/>)}
  </g>;
  return <g>
    <path d="M -400 -40 L -390 -150 L -330 -150 L -320 -40 Z" fill="#15171b"/>
    <rect x={-420} y={-170} width={130} height={26} rx={6} fill={RED_F1}/>
    <path d="M -330 -40 L -300 -100 L -120 -110 L -60 -150 L 20 -150 L 60 -100 L 330 -70 L 400 -46 L 400 -30 L -330 -26 Z" fill={RED_F1}/>
    <path d="M -40 -150 Q 0 -200 40 -150 Z" fill="#15171b"/>
    <circle cx={0} cy={-160} r={22} fill={YELLOW}/>
    <rect x={-320} y={-30} width={720} height={12} fill="#15171b"/>
    <path d="M 330 -20 L 470 -24 L 470 -6 L 330 -10 Z" fill="#15171b"/>
    <rect x={130} y={-82} width={40} height={14} fill="#fff"/>
    {wheel(-250, 70)}{wheel(260, 62)}
  </g>;
};

export const F1Pegados: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {reves: B('reves', .1), piso: B('piso', .18), fondo: B('fondo', .26), presion: B('presion', .38), peso: B('peso', .5),
    techo: B('techo', .66), curvas: B('curvas', .86)};
  const flip = prog(t, T.reves - .3, T.reves + .5, easeOut);
  const ceilingY = 640;

  return <Stage t={t} top="#2a1414" mid="#140a0a">
    {/* 1. Alas como un avión… pero al revés */}
    <Shot t={t} from={-1} to={T.fondo} cy={760}>
      <g transform={`translate(540 640) rotate(${180 * flip})`}><Airfoil t={t} lift={1} w={480}/></g>
      <g transform="translate(540 1080) scale(.9)"><F1Car t={t}/></g>
      {[-330, 360].map(x => <g key={x} opacity={prog(t, T.piso, T.piso + .4)}>
        <path d={`M ${540 + x * .9} 830 V 900`} stroke={YELLOW} strokeWidth="12" strokeLinecap="round"/>
        <path d={`M ${540 + x * .9 - 18} 900 L ${540 + x * .9} 930 L ${540 + x * .9 + 18} 900 Z`} fill={YELLOW}/>
      </g>)}
    </Shot>
    {/* 2. El fondo acelera el aire: menos presión abajo, succión */}
    <Shot t={t} from={T.fondo - .2} to={T.peso} cy={760}>
      <g transform="translate(540 820)"><F1Car t={t}/></g>
      <line x1={0} y1={820} x2={1080} y2={820} stroke="#5c6f84" strokeWidth="6"/>
      {[0, 1, 2].map(i => <line key={i} x1={0} y1={796 - i * 6} x2={1080} y2={796 - i * 6} stroke={CYAN} strokeWidth="5"
        strokeDasharray="40 20" strokeDashoffset={-t * 900} opacity={prog(t, T.fondo, T.fondo + .5) * .9}/>)}
      {[0, 1, 2].map(i => <line key={`s${i}`} x1={0} y1={560 + i * 40} x2={1080} y2={560 + i * 40} stroke="#cfe8ff" strokeWidth="4"
        strokeDasharray="30 30" strokeDashoffset={-t * 300} opacity={.5}/>)}
      <Label x={540} y={900} text="AIRE RÁPIDO = MENOS PRESIÓN" color={CYAN} size={38} o={prog(t, T.presion - .3, T.presion + .3)}/>
      {[-200, 0, 200].map(x => <g key={x} opacity={prog(t, T.presion, T.presion + .4)}>
        <path d={`M ${540 + x} 470 V 560`} stroke={YELLOW} strokeWidth="12" strokeLinecap="round"/><path d={`M ${522 + x} 560 L ${540 + x} 590 L ${558 + x} 560 Z`} fill={YELLOW}/>
      </g>)}
    </Shot>
    {/* 3. Más fuerza que su propio peso */}
    <Shot t={t} from={T.peso - .2} to={T.techo} cy={760}>
      <g transform="translate(540 720)">
        <path d="M -20 260 L 20 260 L 10 40 L -10 40 Z" fill="#5c6f84"/>
        <g transform={`rotate(${-12 * prog(t, T.peso + .2, T.peso + 1)})`}>
          <rect x={-380} y={20} width={760} height={18} rx={9} fill="#8c96a0"/>
          <g transform="translate(-260 20)"><rect x={-90} y={-150} width={180} height={150} rx={14} fill="#5c6f84"/><Label x={0} y={-56} text="PESO" size={34}/></g>
          <g transform="translate(260 20)"><rect x={-100} y={-230} width={200} height={230} rx={14} fill={YELLOW}/><Label x={0} y={-120} text="FUERZA" color="#0b1214" size={32}/><Label x={0} y={-80} text="HACIA ABAJO" color="#0b1214" size={26}/></g>
        </g>
      </g>
    </Shot>
    {/* 4. En teoría, por el techo de un túnel */}
    <Shot t={t} from={T.techo - .2} to={T.curvas} cy={760}>
      <path d={`M 0 ${ceilingY - 60} H 1080 V ${ceilingY} H 0 Z`} fill="#4a5563"/>
      <path d="M 0 1100 H 1080 V 1160 H 0 Z" fill="#4a5563"/>
      {Array.from({length: 7}, (_, i) => <circle key={i} cx={((i * 200 - t * 500) % 1400 + 1400) % 1400 - 100} cy={ceilingY + 30} r={10} fill="#ffe08a"/>)}
      <g transform={`translate(540 ${ceilingY}) scale(.85 -.85)`}><F1Car t={t}/></g>
      <Label x={540} y={980} text="EN TEORÍA" color={YELLOW} size={60} o={prog(t, T.techo + .4, T.techo + .9)}/>
    </Shot>
    {/* 5. Curvas a velocidades imposibles */}
    <Shot t={t} from={T.curvas - .2} to={duration + 1} cy={760}>
      <path d="M 120 1150 C 120 600 960 900 960 420" fill="none" stroke="#3b434c" strokeWidth="150" strokeLinecap="round"/>
      <path d="M 120 1150 C 120 600 960 900 960 420" fill="none" stroke="#fff" strokeWidth="6" strokeDasharray="30 30" opacity=".5"/>
      {(() => {
        const k = prog(t, T.curvas, T.curvas + 2, easeOut);
        const u = 1 - k, x = u * u * u * 120 + 3 * u * u * k * 120 + 3 * u * k * k * 960 + k * k * k * 960;
        const y = u * u * u * 1150 + 3 * u * u * k * 600 + 3 * u * k * k * 900 + k * k * k * 420;
        return <g transform={`translate(${x} ${y}) rotate(${-60 + 30 * Math.sin(k * 3)}) scale(.25)`}><F1Car t={t}/></g>;
      })()}
      <Mark ok x={880} y={1040} t={t} at={T.curvas + 1.6}/>
    </Shot>

    <Chip text="ALAS COMO UN AVIÓN… AL REVÉS" y={330} t={t} at={T.reves - .2} until={T.piso} color="#ffffff" size={34}/>
    <Chip text="LO EMPUJAN CONTRA EL PISO" y={330} t={t} at={T.piso} until={T.fondo} color={YELLOW} size={36}/>
    <Chip text="EL FONDO LO SUCCIONA" y={330} t={t} at={T.fondo} until={T.peso} color={CYAN}/>
    <Chip text="MÁS FUERZA QUE SU PROPIO PESO" y={330} t={t} at={T.peso} until={T.techo} color={YELLOW} size={34}/>
    <Chip text="PODRÍA IR POR EL TECHO" y={330} t={t} at={T.techo} until={T.curvas} color={RED} ink="#fff"/>
    <Chip text="CURVAS IMPOSIBLES" y={330} t={t} at={T.curvas} color={GREEN}/>
  </Stage>;
};
