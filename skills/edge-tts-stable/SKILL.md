---
name: edge-tts-stable
description: Stable Edge TTS workflow for Vietnamese voice generation (handles intermittent NoAudioReceived errors with retry, verification, and fallback chunking).
metadata:
  author: quanna
  version: "1.0.0"
---

# Edge TTS Stable

Use this skill when generating Vietnamese voiceovers with `edge-tts`, especially if errors like `NoAudioReceived` appear intermittently.

## Why failures happen

`edge-tts` can fail sporadically even with valid text and valid voice.
Common symptoms:
- Same command succeeds once, then fails on next attempt.
- `NoAudioReceived` appears for medium/long sentences.
- Failures increase when many requests are sent quickly.

Treat this as a transient service/network behavior. Do not assume the text is invalid immediately.

## Golden rules

- Reuse existing valid scene audio and word-cue files when the project already has generated assets and the user only asks to render/test the video.
- Generate audio sequentially (not parallel).
- Use retries with backoff.
- Verify every output with `ffprobe` before continuing.
- Keep a fallback voice ready.
- If one sentence keeps failing, split it into short chunks and concatenate.

## Recommended CLI form

Always use a fully quoted, multiline command style:

```bash
edge-tts \
  --voice "vi-VN-HoaiMyNeural" \
  --text "xin chao Quan" \
  --write-media "/absolute/path/output.mp3"
```

## Default voice strategy

1. Primary: `vi-VN-HoaiMyNeural`
2. Fallback: `vi-VN-NamMinhNeural`

## Retry policy

- `maxRetries`: 8
- Backoff: `1500ms * attempt`
- Optional cooldown after repeated failures: 10-20 seconds

Pseudo flow:

```text
for each scene (sequential):
  for attempt in 1..8:
    run edge-tts
    if success and ffprobe duration > 0: continue next scene
    wait 1500ms * attempt
  switch fallback voice and retry once more cycle
  if still failing: split sentence into chunks, synthesize each chunk, concat
```

## Verify generated audio

```bash
ffprobe -v error \
  -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  "/absolute/path/output.mp3"
```

Duration must be a finite number > 0.

## Chunk fallback (last resort)

If one sentence keeps failing:
1. Split into short chunks (about 4-8 words).
2. Generate one mp3 per chunk.
3. Concatenate with FFmpeg concat demuxer.

Example concat list file:

```text
file 'chunk-01.mp3'
file 'chunk-02.mp3'
file 'chunk-03.mp3'
```

Concat command:

```bash
ffmpeg -f concat -safe 0 -i chunks.txt -c copy output.mp3
```

## Node.js usage notes

When using `execFileSync`:
- Pass each flag as a separate argument.
- Keep `--text` content as one argument.
- Avoid shell interpolation for user text.
- Keep generation sequential to reduce transient failures.

## Ready-to-use defaults

- Voice env var: `EDGE_TTS_VOICE`
- Default value: `vi-VN-HoaiMyNeural`
- Retry: 8 attempts, linear backoff `1500ms * attempt`
- Validation: `ffprobe` required before render

## Done criteria

A run is considered successful only if:
- All scene audio files exist.
- Every file has valid duration from `ffprobe`.
- Final Remotion render completes without missing audio.
