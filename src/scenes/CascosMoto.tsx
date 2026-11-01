import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, rnd, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

/** Casco de lado mirando a la derecha. `aero`: forma alargada con aleta. */
const Helmet: React.FC<{aero: boolean; color?: string}> = ({aero, color = '#e8322b'}) => <g>
  {aero ? <path d="M -230 40 Q -260 -150 -60 -200 Q 120 -230 200 -90 Q 230 -20 210 60 L 120 120 L -150 120 Q -200 100 -230 40 Z" fill={color} stroke="#0b1424" strokeWidth="5"/>
    : <path d="M -190 60 Q -220 -170 0 -190 Q 200 -180 210 -20 Q 215 50 180 110 L -140 120 Q -180 110 -190 60 Z" fill="#8c96a0" stroke="#0b1424" strokeWidth="5"/>}
  <path d={aero ? 'M 40 -110 Q 160 -120 200 -40 L 190 30 Q 110 40 40 10 Z' : 'M 40 -100 Q 170 -110 200 -20 L 190 40 Q 110 50 40 20 Z'} fill="#1d2733" stroke="#0b1424" strokeWidth="4"/>
  {aero && <g><path d="M -220 -110 L -330 -150 L -320 -110 L -240 -70 Z" fill={YELLOW} stroke="#0b1424" strokeWidth="4"/>
    <path d="M -180 -40 Q 0 -60 160 -100" fill="none" stroke="#fff" strokeWidth="14" opacity=".7"/></g>}
</g>;

export const CascosMoto: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {aire: B('aire', .1), trescientos: B('trescientos', .18), levantar: B('levantar', .3), alargada: B('alargada', .4), aleta: B('aleta', .48, 0),
    lisa: B('lisa', .66), caida: B('caida', .74), deslizarse: B('deslizarse', .8), cuello: B('cuello', .92, 0)};
  T.aleta = B('aleta', .48, T.alargada);
  T.cuello = B('cuello', .92, T.caida);
  const flow = (smooth: boolean) => Array.from({length: 7}, (_, i) => {
    const y = -230 + i * 60, off = -t * 600;
    const d = smooth ? `M 700 ${y} C 300 ${y}, 200 ${y * .9 - 20}, -200 ${y * .85 + (y < 0 ? -30 : 20)} S -500 ${y}, -700 ${y}`
      : `M 700 ${y} C 300 ${y}, 220 ${y - 30}, -150 ${y + 20 * Math.sin(t * 9 + i)} Q -300 ${y + 60 * Math.sin(t * 7 + i)} -700 ${y + 40 * Math.sin(t * 5 + i)}`;
    return <path key={i} d={d} fill="none" stroke={smooth ? CYAN : '#cfe8ff'} strokeWidth="5" strokeDasharray="30 18" strokeDashoffset={off} opacity=".75"/>;
  });
  const shake = t > T.levantar && t < T.alargada ? Math.sin(t * 40) * 6 : 0;

  return <Stage t={t} top="#2a1414" mid="#140a0a">
    <Shot t={t} from={-1} to={T.levantar} cy={760}>
      <g transform="translate(540 760)">{flow(true)}<g transform="scale(1.3)"><Helmet aero/></g></g>
      <Label x={540} y={1080} text="+300 KM/H" color={YELLOW} size={70} o={prog(t, T.trescientos, T.trescientos + .4)}/>
    </Shot>
    {/* Casco redondo: el aire lo levanta y lo sacude */}
    <Shot t={t} from={T.levantar - .2} to={T.alargada} cy={760}>
      <g transform={`translate(540 ${760 - 20 * prog(t, T.levantar, T.levantar + .6) + shake})`}>{flow(false)}<g transform={`scale(1.3) rotate(${shake / 2})`}><Helmet aero={false}/></g></g>
      <path d="M 540 520 V 420" stroke={RED} strokeWidth="14"/><path d="M 518 430 L 540 396 L 562 430 Z" fill={RED}/>
      <Mark ok={false} x={880} y={1060} t={t} at={T.levantar + .3} until={T.alargada}/>
    </Shot>
    {/* Forma alargada + aleta: el aire fluye suave */}
    <Shot t={t} from={T.alargada - .2} to={T.lisa} cy={760}>
      <g transform="translate(540 760)">{flow(true)}<g transform="scale(1.3)"><Helmet aero/></g></g>
      <circle cx={540 - 360} cy={760 - 165} r={70 + 8 * Math.sin(t * 6)} fill="url(#spot)" opacity={prog(t, T.aleta, T.aleta + .4)}/>
      <Mark ok x={880} y={1060} t={t} at={T.aleta + .6} until={T.lisa}/>
    </Shot>
    {/* En una caída: se desliza, no se atora */}
    <Shot t={t} from={T.lisa - .2} to={duration + 1} cy={760}>
      <rect x={0} y={900} width={1080} height={260} fill="#2b2f36"/>
      {(() => {
        const k = prog(t, T.caida, duration - .5);
        return <g>
          <g transform={`translate(${900 - 600 * k} 820) rotate(${-200 * k}) scale(.6)`}><Helmet aero/></g>
          {k > 0 && Array.from({length: 12}, (_, i) => {
            const p = (t * 2 + i / 12) % 1;
            return <circle key={i} cx={900 - 600 * k + 60 + p * 200 * rnd(i)} cy={900 - p * 60 * rnd(i + 3) + p * p * 50} r={5} fill={YELLOW} opacity={1 - p}/>;
          })}
        </g>;
      })()}
      <Label x={540} y={1060} text="SE DESLIZA, NO SE ATORA" color={GREEN} size={44} o={prog(t, T.deslizarse, T.deslizarse + .4)}/>
      <Mark ok x={880} y={560} t={t} at={T.cuello}/>
    </Shot>

    <Chip text="ES POR EL AIRE" y={330} t={t} at={T.aire} until={T.levantar} color={CYAN}/>
    <Chip text="EL VIENTO LO LEVANTA Y SACUDE" y={330} t={t} at={T.levantar} until={T.alargada} color={RED} ink="#fff" size={34}/>
    <Chip text="ALARGADO: EL AIRE FLUYE SUAVE" y={330} t={t} at={T.alargada} until={T.aleta} color={CYAN} size={34}/>
    <Chip text="LA ALETA LO ESTABILIZA" y={330} t={t} at={T.aleta} until={T.lisa} color={YELLOW}/>
    <Chip text="LISO PARA DESLIZARSE EN UNA CAÍDA" y={330} t={t} at={T.lisa} color={GREEN} size={32}/>
  </Stage>;
};
