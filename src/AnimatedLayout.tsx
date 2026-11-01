import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from './types';
import type {SceneProps} from './scenes/types';
import {Hook, PopCaptions, highlightColor} from './PhotoLayout';
import {VentanasAvion} from './scenes/VentanasAvion';
import {beat, TeaserContext} from './scenes/helpers';
import {ArrozSalero} from './scenes/ArrozSalero';
import {FlechaGasolina} from './scenes/FlechaGasolina';
import {MesitaPizza} from './scenes/MesitaPizza';
import {TeclasFJ} from './scenes/TeclasFJ';
import {AgujeroVentana} from './scenes/AgujeroVentana';
import {LucesAvion} from './scenes/LucesAvion';
import {BolsilloJeans} from './scenes/BolsilloJeans';
import {CintaGancho} from './scenes/CintaGancho';
import {RomboCinta} from './scenes/RomboCinta';
import {BancoPlastico} from './scenes/BancoPlastico';
import {MonedasRanuras} from './scenes/MonedasRanuras';
import {Garrafon} from './scenes/Garrafon';
import {PruebaUna} from './scenes/PruebaUna';

/**
 * Escenas animadas con código (sin imágenes). Para añadir un tema nuevo, crea su componente en src/scenes/
 * y regístralo aquí con su momento de clímax (lo más impactante), que se usa como avance en el primer segundo.
 */
type Meta = {C: React.FC<SceneProps>; climax: (captions: VideoProps['captions'], d: number) => number};
export const SCENES: Record<string, Meta> = {
  'ventanas-redondas': {C: VentanasAvion, climax: (c, d) => beat(c, 'desintegraron', d * .4) + .1},
  'arroz-salero': {C: ArrozSalero, climax: (c, d) => beat(c, 'grandes', d * .66) + .9},
  'flecha-gasolina': {C: FlechaGasolina, climax: (c, d) => beat(c, 'izquierda', d * .44) + .2},
  'mesita-pizza': {C: MesitaPizza, climax: (c, d) => beat(c, 'toca', d * .34) - .2},
  'teclas-f-j': {C: TeclasFJ, climax: (c, d) => beat(c, 'rayita', d * .1) + .4},
  'agujero-ventana-avion': {C: AgujeroVentana, climax: (c, d) => beat(c, 'fallara', d * .46) + .2},
  'luces-avion': {C: LucesAvion, climax: (c, d) => beat(c, 'pasillo', d * .58) + .6},
  'bolsillo-jeans': {C: BolsilloJeans, climax: (c, d) => beat(c, 'golpeaban', d * .44) - .5},
  'cinta-gancho': {C: CintaGancho, climax: (c, d) => beat(c, 'fuera', d * .3) + .9},
  'rombo-cinta': {C: RomboCinta, climax: (c, d) => beat(c, 'vigas', d * .68) + .9},
  'banco-plastico': {C: BancoPlastico, climax: (c, d) => beat(c, 'aire', d * .24) + .4},
  'monedas-ranuras': {C: MonedasRanuras, climax: (c, d) => beat(c, 'limaban', d * .24) + .6},
  'garrafon': {C: Garrafon, climax: (c, d) => beat(c, 'doblaria', d * .26) + .2},
  'prueba-una': {C: PruebaUna, climax: (c, d) => beat(c, 'linterna', d * .8) + .5},
};
/** Duración del avance inicial con el clímax antes de que empiece la historia. */
export const TEASER = 1.4;

export const AnimatedLayout: React.FC<VideoProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const duration = durationInFrames / fps;
  const meta = SCENES[props.scene ?? ''];
  const teaser = !!meta && time < TEASER;
  // Primer segundo: el clímax de la historia; después la historia desde el principio.
  const sceneTime = teaser ? meta.climax(props.captions, duration) + time * .9 : time;
  const punch = teaser ? interpolate(time, [0, .45], [1.18, 1], {extrapolateRight: 'clamp', easing: t => 1 - Math.pow(1 - t, 3)})
    : interpolate(time, [TEASER, TEASER + .35], [1.08, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flash = interpolate(time, [TEASER - .06, TEASER, TEASER + .2], [0, .75, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hl = highlightColor[props.accent];
  const endFade = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#050b14', color: 'white', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: endFade}}>
      {meta && <AbsoluteFill style={{transform: `scale(${punch})`}}>
        <TeaserContext.Provider value={teaser}>
          <meta.C time={sceneTime} captions={props.captions} duration={duration} accent={hl}/>
        </TeaserContext.Provider>
      </AbsoluteFill>}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}}/>}
      <AbsoluteFill style={{background: props.safe ? 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 14%, transparent 52%, rgba(0,0,0,.65) 66%, rgba(0,0,0,.65) 78%, rgba(0,0,0,.3) 100%)' : 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 12%, transparent 66%, rgba(0,0,0,.75) 100%)'}}/>
      {props.brand && <div style={{position: 'absolute', top: props.safe ? 170 : 90, left: 70, display: 'flex', alignItems: 'center', gap: 18, fontSize: 34, fontWeight: 800, textShadow: '0 2px 10px #000'}}>
        <span style={{width: 58, height: 58, borderRadius: 16, background: hl, color: '#0b1214', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900}}>{props.brand.trim()[0]?.toUpperCase()}</span>
        {props.brand}
      </div>}
      {props.hook && time < 3.2 && <Hook text={props.hook} time={time} color={hl} top={props.safe ? 270 : 230}/>}
      <PopCaptions captions={props.captions} time={time} highlight={hl} top={props.safe ? 1170 : 1430}/>
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 6, width: `${frame / (durationInFrames - 1) * 100}%`, background: hl, opacity: .85}}/>
      {props.demo && <div style={{position: 'absolute', bottom: 40, right: 60, color: '#ffffff66', fontSize: 22, letterSpacing: 3}}>VISTA PREVIA · SIN VOZ</div>}
    </AbsoluteFill>
  </AbsoluteFill>;
};
