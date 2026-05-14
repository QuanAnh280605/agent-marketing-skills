---
name: minimax-tts
description: MiniMax Text-to-Speech workflow for Vietnamese voice generation via REST API. Supports HD/Turbo models, emotion control, pause injection, streaming, and retry logic with ffprobe verification.
metadata:
  author: quanna
  version: "1.0.0"
---

# MiniMax TTS

Use this skill to generate Vietnamese voiceovers using the **MiniMax T2A v2 API** as a drop-in replacement for `edge-tts`.

---

## API Reference

- **Endpoint (Global):** `https://api.minimax.io/v1/t2a_v2`
- **Auth:** `Authorization: Bearer $MINIMAX_API_KEY`
- **Max text per request:** 10,000 characters (use T2A Async for longer)

### Environment variable

```bash
export MINIMAX_API_KEY="your_api_key_here"
```

---

## Model selection

| Model | Use case |
|---|---|
| `speech-02-hd` | Best quality, emotion support — **default** |
| `speech-02-turbo` | Fastest, 40 languages, emotion support |
| `speech-2.6-hd` | High quality, excellent rhythm |
| `speech-2.8-hd` | Newest HD, supports sound tags |

**Rule:** Use `speech-02-hd` as default. Switch to `speech-02-turbo` only when latency is critical.

---

## Voice selection (Vietnamese)

MiniMax does not expose a `vi-VN-*` style voice ID. Use the generic voice IDs below — all support Vietnamese out of the box:

| Voice ID | Character |
|---|---|
| `female-shaonv` | Young female — **primary default** |
| `male-qn-qingse` | Young male |
| `female-yujie` | Mature female |
| `male-qn-jingying` | Professional male |
| `presenter_male` | Presenter / narration |
| `audiobook_female_1` | Audiobook female |

**Strategy:**
1. Primary: `female-shaonv`
2. Fallback: `audiobook_female_1`

---

## Core Python script (non-streaming)

Save as `minimax_tts.py` and reuse across projects:

```python
import os
import requests
import time

MINIMAX_API_KEY = os.environ["MINIMAX_API_KEY"]
API_URL = "https://api.minimax.io/v1/t2a_v2"

def synthesize(
    text: str,
    output_path: str,
    voice_id: str = "female-shaonv",
    model: str = "speech-02-hd",
    speed: float = 1.0,
    emotion: str = "neutral",
    max_retries: int = 5,
) -> bool:
    """
    Synthesize text to audio and save to output_path.
    Returns True on success, False on failure.
    """
    headers = {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": speed,
            "vol": 1.0,
            "pitch": 0,
            "emotion": emotion,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
            "channel": 1,
        },
    }

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            audio_hex = data.get("data", {}).get("audio", "")
            if audio_hex:
                with open(output_path, "wb") as f:
                    f.write(bytes.fromhex(audio_hex))
                return True
            print(f"[attempt {attempt}] No audio in response: {data}")
        except Exception as e:
            print(f"[attempt {attempt}] Error: {e}")
        time.sleep(1.5 * attempt)

    return False
```

---

## Pause injection

Insert pauses in text using `<#SECONDS#>` syntax:

```python
text = "Xin chào. <#1.0#> Đây là đoạn tiếp theo. <#0.5#> Tiếp tục!"
```

- Range: `0.01` – `99.99` seconds
- Works with `speech-02-hd` and `speech-02-turbo`

---

## Retry policy

- `maxRetries`: 5 (HTTP errors or empty audio response)
- Backoff: `1500ms * attempt`
- After 5 failures: switch to fallback voice, retry full cycle once
- Last resort: split sentence into short chunks (~20-40 words), synthesize each, concat with FFmpeg

```text
for each scene (sequential):
  for attempt in 1..5:
    call minimax API
    if audio_hex present and ffprobe duration > 0: continue next scene
    wait 1500ms * attempt
  switch fallback voice (audiobook_female_1) and retry once more cycle
  if still failing: chunk → synthesize each → concat
```

---

## Verify generated audio

```bash
ffprobe -v error \
  -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  "/absolute/path/output.mp3"
```

Duration must be a finite number > 0.

---

## Chunk fallback (last resort)

If a scene keeps failing (e.g., very long sentence):

1. Split into short chunks (~20-40 words).
2. Generate one `.mp3` per chunk.
3. Concatenate with FFmpeg:

```text
file 'chunk-01.mp3'
file 'chunk-02.mp3'
file 'chunk-03.mp3'
```

```bash
ffmpeg -f concat -safe 0 -i chunks.txt -c copy output.mp3
```

---

## Streaming (optional, real-time playback)

Use `"stream": True` with `speech-02-turbo` when the consumer supports chunked audio:

```python
payload["stream"] = True
response = requests.post(API_URL, headers=headers, json=payload, stream=True)
with open(output_path, "wb") as f:
    for chunk in response.iter_content(chunk_size=1024):
        if chunk:
            f.write(chunk)
```

> **Note:** Do NOT use streaming for batch scene generation — use standard mode to simplify verification.

---

## Parameter reference

| Parameter | Range / Values | Default | Notes |
|---|---|---|---|
| `speed` | 0.5 – 2.0 | 1.0 | Reading speed |
| `vol` | 0.1 – 10.0 | 1.0 | Volume |
| `pitch` | -12 – 12 | 0 | Semitones |
| `emotion` | `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised`, `neutral` | `neutral` | `speech-02-*` only |
| `format` | `mp3`, `pcm`, `flac`, `wav` | `mp3` | Use `mp3` for compatibility |
| `sample_rate` | 8000–44100 | 32000 | Hz |
| `bitrate` | 64000–320000 | 128000 | bps |
| `channel` | 1 or 2 | 1 | Mono recommended |

---

## Ready-to-use defaults

- **Env var:** `MINIMAX_API_KEY`
- **Model:** `speech-02-hd`
- **Voice:** `female-shaonv` → fallback `audiobook_female_1`
- **Retry:** 5 attempts, backoff `1500ms * attempt`
- **Validation:** `ffprobe` required before render
- **Generation:** sequential (never parallel)

---

## Done criteria

A run is considered successful only if:
- All scene audio files exist on disk.
- Every file has valid duration (`ffprobe` output > 0).
- Final Remotion (or downstream) render completes without missing audio.
