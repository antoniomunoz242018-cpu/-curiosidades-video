# Estudio de curiosidades: vídeos verticales tipo «¿sabías que…?»

App web local + pipeline con Remotion para crear vídeos de curiosidades **1080 × 1920, 30 fps, 40 s** al estilo de las páginas de datos curiosos: un objeto realista (render 3D) sobre fondo oscuro con foco de luz, movimiento de cámara lento, subtítulos grandes que aparecen palabra a palabra y voz en español.

## Inicio rápido (app web)

```bash
npm ci
cp .env.example .env      # añade tu OPENAI_API_KEY (opcional, ver abajo)
npm start                 # abre http://localhost:3000
```

En la app:

1. **Tema** → «✨ Generar guion con IA» (título, narración de ~40 s, texto para la publicación y descripción de cada imagen) o «Escribir yo el guion».
2. **Imágenes** → por cada escena, «✨ Generar» (IA) o «📁 Subir» tu propia imagen (PNG/JPG/WEBP; mejor vertical, objeto sobre fondo oscuro). Se reparten a lo largo del vídeo con zoom, giro en perspectiva y fundidos.
3. **Estilo** → «Foto realista» (como el ejemplo) o «Ilustración animada», color de resaltado, nombre de tu página y título opcional.
4. **Voz** → voz con IA, **tu propia voz** (grabar con el micrófono o subir un audio de 27–55 s; se ajusta a 40 s) o sin voz.
5. **🎬 Generar vídeo** → barra de progreso, vista previa y «⬇️ Descargar MP4». Copia el texto de la publicación con el botón «Copiar».

Los proyectos se guardan en `public/jobs/<id>/` (con `job.json`) y los vídeos en `output/<id>.mp4`; aparecen en la barra lateral para retomarlos.

### ¿Qué funciona sin clave de API?

| Función | Sin clave | Con `OPENAI_API_KEY` |
|---|---|---|
| Guion | Lo escribes tú | Generado por IA (`LLM_MODEL`) |
| Imágenes | Subes las tuyas | Generadas por IA (`IMAGE_MODEL`, por defecto `gpt-image-1`, 1024×1536) |
| Voz | Tu grabación o sin voz | Voz IA (`TTS_MODEL`/`TTS_VOICE`) |
| Subtítulos | Tiempos estimados por longitud de palabra | Sincronizados con Whisper por palabra |

Cada llamada a la API tiene coste; las imágenes son la parte más cara (ajusta `IMAGE_QUALITY`). La app solo escucha en `127.0.0.1`; usa `HOST=0.0.0.0` solo en una red de confianza, porque no tiene usuarios ni contraseñas.

---

## Línea de comandos

## Requisitos

- Node.js 22 o superior y npm.
- FFmpeg y ffprobe en el PATH. Ubuntu/Debian: `sudo apt-get install ffmpeg`. macOS: `brew install ffmpeg`.
- Acceso a las APIs de OpenAI con saldo disponible. Las llamadas tienen coste.
- Chrome Headless Shell se descarga en el primer render. En Linux puede requerir bibliotecas del sistema; consulta https://www.remotion.dev/docs/miscellaneous/linux-dependencies. Puedes usar un Chromium instalado con `CHROME_EXECUTABLE`.

## Instalación

```bash
cd curiosidades-video
npm ci
cp .env.example .env
```

El proyecto ya incluye un `.env` vacío como punto de partida. Edita ese archivo:

```dotenv
OPENAI_API_KEY=tu_clave_real
LLM_MODEL=gpt-4o-mini
TTS_MODEL=tts-1
TTS_VOICE=nova
WHISPER_MODEL=whisper-1
```

`LLM_API_KEY`, `TTS_API_KEY` y `WHISPER_API_KEY` permiten cuentas distintas; si están vacías se utiliza `OPENAI_API_KEY`. No se incluyen claves reales. `.env` está excluido de Git; nunca lo publiques ni pongas claves en `src/` o `public/`. Las APIs se llaman únicamente desde Node, no desde React.

## Generar el video

```bash
npm run generate -- "Por qué un día en Venus dura más que su año"
```

Genera guion, imágenes (una por escena), voz, subtítulos y MP4. Añade `--no-images` para usar la ilustración SVG en lugar de imágenes IA. El texto para la publicación se muestra en la consola y queda en `script.json`.

El comando muestra la ruta del MP4 en `output/<id>.mp4`. Cada ejecución mantiene sus propios archivos:

```text
public/jobs/<id>/
  script.json          # Tema, título, narración, objeto y color
  voice-raw.mp3        # Respuesta del TTS
  voice.wav            # Audio final de 40 segundos
  transcription.json  # Palabras y tiempos de Whisper
  props.json           # Datos usados por Remotion
output/<id>.mp4
output/latest.json     # Referencia al último trabajo preparado
```

Los archivos en `public/` se sirven al abrir Studio: no incluyas datos privados en los temas o guiones. No hay subida automática a redes sociales.

### Revisar antes del render

```bash
npm run generate -- "Los cristales de cuarzo" --no-render
npm run studio -- --props=public/jobs/ID/props.json
```

Sustituye `ID` por el identificador mostrado. Puedes editar el título, color, objeto o subtítulos en `props.json` y renderizar sin repetir llamadas:

```bash
npm run render -- public/jobs/ID/props.json output/mi-video.mp4
```

`npm run render` sin argumentos renderiza el último trabajo preparado en `output/video.mp4`. Studio sin `--props` muestra solo la composición de ejemplo. Si cambias la narración, vuelve a generar voz y transcripción; editar solo el texto no cambia el audio.

### Demo sin claves

```bash
npm run demo
```

Genera `output/demo.mp4` con la misma composición y duración. Con `npm run demo -- --image a.png --image b.jpg` usa el diseño de foto realista con tus imágenes. **La demo no tiene voz y usa tiempos simulados; no ejecuta Whisper ni llamadas externas.** `npm run demo -- --no-render` prepara solo las props para revisarlas en Studio:

```bash
npm run studio -- --props=public/jobs/demo/props.json
```

## Flujo

1. El LLM devuelve un JSON validado con título, narración en español de unas 88–100 palabras, texto para la publicación, descripciones de imagen por escena, objeto de respaldo y acento de color.
1. El generador de imágenes crea cada escena con un estilo fijo (render 3D fotorrealista, fondo oscuro, foco cálido, sin texto).
2. TTS (`tts-1`, voz `nova` por defecto) sintetiza la narración.
3. FFmpeg ajusta la voz a 39 segundos con `atempo`, añade 0,5 segundos al principio y al final y produce un WAV mono de 24 kHz. Se rechazan ajustes extremos para conservar inteligibilidad.
4. Whisper (`whisper-1`, `verbose_json` y marcas por palabra) transcribe **el audio ya ajustado**. Los subtítulos se agrupan en frases cortas y cada palabra se resalta según su marca real; no se calculan a partir de la longitud del texto.
5. Remotion renderiza 1.200 frames con H.264, AAC cuando hay voz y píxeles `yuv420p` para compatibilidad móvil. FFmpeg finaliza el contenedor a 40 segundos, ajusta el relleno AAC y añade `faststart` sin recodificar el video.

La duración del video es fija; el audio se ajusta a ella. Los tiempos de Whisper son estimaciones: conviene revisar nombres propios, silencios y números. La exactitud factual del LLM tampoco está garantizada; revisa el guion antes de publicar.

En el diseño «foto», las imágenes se muestran en orden con movimiento de cámara (zoom, desplazamiento y giro en perspectiva), un fondo desenfocado de la propia imagen, foco de luz, partículas, viñeta y subtítulos con efecto de desenfoque a enfoque. El código está en `src/PhotoLayout.tsx`.

En el diseño «ilustración», los objetos son ilustraciones SVG procedurales incluidas: `planet`, `atom`, `bulb`, `brain`, `crystal` y `ocean`. No se descargan imágenes ni se genera un modelo 3D del tema. Para añadir objetos, edita `src/Object.tsx` y amplía los tipos y el esquema del guion. Paletas: `cyan`, `violet` y `amber`.

## Verificación

```bash
npm run check
npm test
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of json output/mi-video.mp4
```

El video debe indicar `1080`, `1920`, `30/1` y duración `40.000000`. Las pruebas verifican el ajuste de velocidad, la duración real del WAV con FFmpeg y la agrupación y límites de los subtítulos. La demo verifica el render sin credenciales; la integración real requiere claves.

## Problemas frecuentes

- **La app no genera imágenes / guion:** los indicadores de la cabecera muestran qué claves detectó el servidor en `.env`. Reinicia `npm start` tras editarlo.
- **«La voz dura X s»:** tu grabación debe durar entre 27 y 55 s; se acelera o ralentiza a 40 s sin deformarla.
- **El render tarda:** cada render reempaqueta el proyecto (incluido `public/jobs`). Borra proyectos antiguos desde la app para acelerarlo.

- **401 / 429:** revisa la clave, acceso al modelo, saldo y límites. Los clientes reintentan errores transitorios hasta dos veces.
- **FFmpeg no encontrado:** instala FFmpeg y comprueba `ffmpeg -version` y `ffprobe -version`.
- **Chrome no inicia:** instala las dependencias de Linux o configura `CHROME_EXECUTABLE`. No desactives la verificación TLS para descargarlo.
- **Memoria limitada:** usa `RENDER_CONCURRENCY=1` en `.env`.
- **Voz demasiado larga/corta:** el proceso conserva `script.json` y `voice-raw.mp3` y se detiene si necesita un cambio de velocidad fuera de 0,7–1,4. Ajusta el prompt o la voz y vuelve a ejecutar.
- **Modelo Whisper incompatible:** mantén `whisper-1`; otros modelos pueden no soportar marcas de tiempo por palabra.

Remotion tiene condiciones de licencia según uso y tamaño de la organización: https://www.remotion.dev/license.
