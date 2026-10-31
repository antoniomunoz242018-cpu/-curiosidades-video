import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import type {VideoProps} from './types';
const defaults: VideoProps = {
  title: 'El universo tiene mucho que contar', object: 'planet', accent: 'cyan',
  narration: '', captions: [], demo: true,
};
export const Root = () => <Composition id="Curiosidad" component={Video} width={1080} height={1920} fps={30} durationInFrames={1200} defaultProps={defaults}/>;
