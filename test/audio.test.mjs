import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {voiceFilter} from '../lib/timing.mjs';
import {run, audioDuration} from '../lib/system.mjs';
test('FFmpeg produce exactamente 40 s incluso con entrada muy corta', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'curiosidades-'));
  try {
    const output = path.join(dir, 'voice.wav');
    await run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=220:duration=2', '-af', voiceFilter(2/39), '-ar', '24000', '-ac', '1', output]);
    assert.equal(await audioDuration(output), 40);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
