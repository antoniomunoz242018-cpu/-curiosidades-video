import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from './types';
import type {SceneProps} from './scenes/types';
import {Hook, PopCaptions, highlightColor} from './PhotoLayout';
import {VentanasAvion} from './scenes/VentanasAvion';
import {ArrozSalero} from './scenes/ArrozSalero';
import {FlechaGasolina} from './scenes/FlechaGasolina';
import {MesitaPizza} from './scenes/MesitaPizza';
import {TeclasFJ} from './scenes/TeclasFJ';
import {AgujeroVentana} from './scenes/AgujeroVentana';
import {LucesAvion} from './scenes/LucesAvion';
import {BolsilloJeans} from './scenes/BolsilloJeans';

/** Escenas animadas con código (sin imágenes). Para añadir un tema nuevo, crea su componente en src/scenes/ y regístralo aquí. */
export const SCENES: Record<string, React.FC<SceneProps>> = {
  'ventanas-redondas': VentanasAvion,
  'arroz-salero': ArrozSalero,
  'flecha-gasolina': FlechaGasolina,
  'mesita-pizza': MesitaPizza,
  'teclas-f-j': TeclasFJ,
  'agujero-ventana-avion': AgujeroVentana,
  'luces-avion': LucesAvion,
  'bolsillo-jeans': BolsilloJeans,
};

export const AnimatedLayout: React.FC<VideoProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const duration = durationInFrames / fps;
  const Scene = SCENES[props.scene ?? ''];
  const hl = highlightColor[props.accent];
  const endFade = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#050b14', color: 'white', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: endFade}}>
      {Scene && <Scene time={time} captions={props.captions} duration={duration} accent={hl}/>}
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 12%, transparent 66%, rgba(0,0,0,.75) 100%)'}}/>
      {props.brand && <div style={{position: 'absolute', top: 90, left: 70, display: 'flex', alignItems: 'center', gap: 18, fontSize: 34, fontWeight: 800, textShadow: '0 2px 10px #000'}}>
        <span style={{width: 58, height: 58, borderRadius: 16, background: hl, color: '#0b1214', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900}}>{props.brand.trim()[0]?.toUpperCase()}</span>
        {props.brand}
      </div>}
      {props.hook && time < 3.2 && <Hook text={props.hook} time={time} color={hl}/>}
      <PopCaptions captions={props.captions} time={time} highlight={hl} top={1430}/>
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 6, width: `${frame / (durationInFrames - 1) * 100}%`, background: hl, opacity: .85}}/>
      {props.demo && <div style={{position: 'absolute', bottom: 40, right: 60, color: '#ffffff66', fontSize: 22, letterSpacing: 3}}>VISTA PREVIA · SIN VOZ</div>}
    </AbsoluteFill>
  </AbsoluteFill>;
};
