# Existing Remotion Project Render Check

Use this reference when the user asks to try/render a video inside an existing Remotion folder rather than create a new project from scratch.

## Workflow

1. Inspect the project entry points:
   - `package.json` for scripts and dependencies.
   - `src/Root.tsx` for available `<Composition id="...">` entries.
   - `public/generated/**/props.json` for pre-generated scene props, voice files, and word-cue JSON.

2. Prefer reusing valid generated assets before regenerating voice:
   - If `public/generated/<video>/props.json` exists and references `scene-*.mp3` plus word-cue JSON, render from those props first.
   - Only run the TTS creation script if assets are missing, invalid, or the user explicitly wants fresh voice.

3. Run tests before rendering:

```bash
npm test
```

4. Calculate or confirm frame count from the generated props. If the props have scene `end` values:

```bash
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('public/generated/<video>/props.json','utf8')); const end=Math.max(...p.scenes.map(s=>s.end)); console.log(Math.ceil(end*30));"
```

5. Render with explicit props and frame range:

```bash
npx remotion render src/index.ts <CompositionId> out/<name>.mp4 \
  --frames=0-<lastFrame> \
  --props=public/generated/<video>/props.json
```

Example:

```bash
npx remotion render src/index.ts OpenAIAwsNews out/skill-demo-openai-aws-news.mp4 \
  --frames=0-1469 \
  --props=public/generated/openai-aws-news/props.json
```

6. Verify the output with `ffprobe`:

```bash
ffprobe -v error -show_entries format=duration,size \
  -of default=noprint_wrappers=1 out/<name>.mp4

ffprobe -v error -select_streams a \
  -show_entries stream=codec_name,channels \
  -of default=noprint_wrappers=1 out/<name>.mp4
```

## Done criteria

- Tests pass before render.
- Render exits successfully.
- Output file exists under `out/`.
- `ffprobe` reports finite duration and size.
- Audio stream exists when voiceover is expected.

## Pitfalls

- Do not create a new Remotion app when the folder already has compositions.
- Do not regenerate Edge TTS audio unnecessarily; it is slower and can fail transiently.
- Do not rely on default composition duration if generated props include measured audio durations and scene `end` values.
- When `--props` points at a file path, keep it relative to the Remotion project root unless the command is run from another directory.