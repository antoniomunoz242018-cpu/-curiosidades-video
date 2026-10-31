import {spawn} from 'node:child_process';
export function run(command, args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'});
    let out = '', err = '';
    if (capture) {
      child.stdout.on('data', b => out += b);
      child.stderr.on('data', b => err += b);
    }
    child.on('error', e => reject(new Error(`No se pudo ejecutar ${command}: ${e.message}`)));
    child.on('close', code => code === 0 ? resolve(out.trim()) : reject(new Error(`${command} falló (${code}). ${err.slice(-1500)}`)));
  });
}
export async function audioDuration(path) {
  return Number(await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path], true));
}
