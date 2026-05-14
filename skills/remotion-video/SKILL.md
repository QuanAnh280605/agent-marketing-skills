---
name: remotion-video
description: Guide for creating high-quality, visually dynamic videos with Remotion (React-based programmatic video). Use this skill whenever the user is building, improving, or asking about Remotion video compositions — including animation techniques, text effects, scene transitions, stagger, spring physics, data visualization, SVG/3D integration, and component layering. Also trigger when the user says their Remotion video looks "boring", "plain", "too simple", lacks effects, or wants to make it look more professional/cinematic. This skill covers the full spectrum from animation primitives to advanced visual techniques.
---

This skill helps create visually rich, professional-quality Remotion videos. The goal is to move beyond single fade-in/fade-out and build compositions that layer motion, typography, data, and transitions like production-quality motion graphics.

## Core mental model

Every great Remotion video is built from three layers:

1. **Animation primitives** — how individual elements move (`spring`, `interpolate`, `Easing`)
2. **Composition strategy** — how elements are layered and timed (`AbsoluteFill`, `Sequence`, stagger)
3. **Scene transitions** — how scenes connect (`@remotion/transitions`)

Master these three, then add visual flourishes (typewriter, clip-path reveal, glitch, 3D, charts).

---

## Tier 1 — Animation primitives

### `spring()` — physics-based motion

Replace all linear fade/move with spring. It simulates real physics: elements decelerate naturally instead of stopping abruptly.

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({
  frame,
  fps,
  config: {
    damping: 12,    // higher = less bounce, smoother stop
    stiffness: 80,  // higher = faster entry
    mass: 1,
  },
});

// Use in style
<div style={{ transform: `scale(${scale})` }}>...</div>
```

**Tuning guide:**

- Logo entrance: `damping: 200, stiffness: 200` (no bounce, quick)
- Card pop: `damping: 12, stiffness: 100` (subtle bounce)
- Bouncy icon: `damping: 6, stiffness: 80` (noticeable spring)
- Overshoot allowed: remove `clamp: true` (default allows overshoot)

### `interpolate()` + multi-keyframe

Use multiple keyframes to create fade-in → hold → fade-out in one expression. Always add `Easing` to avoid robotic linear motion.

```tsx
import { interpolate, Easing } from 'remotion';

// Appear, hold, disappear
const opacity = interpolate(
  frame,
  [0,  30, 90, 120],  // keyframe frames
  [0,   1,  1,   0],  // values at each keyframe
  {
    easing: Easing.bezier(0.5, 0, 0.5, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }
);

// Slide in from bottom with ease-out
const translateY = interpolate(frame, [0, 30], [60, 0], {
  easing: Easing.out(Easing.cubic),
  extrapolateRight: 'clamp',
});
```

**Useful easing presets:** `Easing.in`, `Easing.out`, `Easing.inOut`, `Easing.elastic`, `Easing.bounce`, `Easing.bezier(x1, y1, x2, y2)`

### Combining spring + interpolate

Spring for entrance, interpolate for exit (spring has no natural end, so exit needs interpolate):

```tsx
const entranceProgress = spring({ frame, fps, config: { damping: 15 } });
const exitOpacity = interpolate(frame, [80, 110], [1, 0], { extrapolateLeft: 'clamp' });

const opacity = Math.min(entranceProgress, exitOpacity);
```

---

## Tier 2 — Stagger (the most impactful technique)

Stagger = each item delays by N frames. This single pattern is what makes list/grid animations look professional.

```tsx
const STAGGER = 8; // frames between each item

{items.map((item, i) => (
  <Sequence from={i * STAGGER} key={i}>
    <AnimatedItem item={item} />
  </Sequence>
))}
```

Inside `AnimatedItem`, use `spring` starting from `frame=0` — the `Sequence` handles the offset:

```tsx
const AnimatedItem = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 18 } });

  return (
    <div style={{
      opacity: progress,
      transform: `translateY(${(1 - progress) * 30}px)`,
    }}>
      {item.content}
    </div>
  );
};
```

**Apply stagger to:** bullet lists, chart bars, stat cards, image grids, table rows, icon sets.

---

## Tier 3 — Text effects

### Typewriter

Slice string by frame count. Always use string slicing — never per-character opacity (it's less performant and looks worse).

```tsx
const charsToShow = Math.floor(
  interpolate(frame, [0, 90], [0, text.length], { extrapolateRight: 'clamp' })
);

<span>{text.slice(0, charsToShow)}</span>

// Blinking cursor
<span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
```

Full template with pause + cursor: [github.com/remotion-dev/typewriter](https://github.com/remotion-dev/typewriter)

### Per-word spring reveal (most cinematic text effect)

```tsx
const words = text.split(' ');

<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
  {words.map((word, i) => {
    const progress = spring({
      frame: frame - i * 6,  // 6-frame stagger per word
      fps,
      config: { damping: 20 },
    });
    return (
      <span key={i} style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 20}px)`,
        display: 'inline-block',
      }}>
        {word}
      </span>
    );
  })}
</div>
```

**Variants:** `translateX` (slide from left), `scale` (pop in), `rotateX(${(1-p)*90}deg)` (3D flip in).

### Clip-path wipe reveal

```tsx
const progress = spring({ frame, fps });
const width = interpolate(progress, [0, 1], [0, 100]);

<div style={{
  clipPath: `inset(0 ${100 - width}% 0 0)`,
  overflow: 'hidden',
}}>
  {text}
</div>
```

**Variants:**

- Reveal from bottom: `inset(${100 - height}% 0 0 0)`
- Circle expand: use SVG `<clipPath>` with `<circle r={radius}>`
- Diamond: use `<clipPath>` with `<polygon>`

### Gradient text (static but impactful)

```tsx
<div style={{
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontSize: 72,
  fontWeight: 700,
}}>
  Headline Text
</div>
```

---

## Tier 4 — Scene transitions

Install: `npm i @remotion/transitions`

### Basic transition setup

```tsx
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { iris } from '@remotion/transitions/iris';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <SceneA />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={slide({ direction: 'from-left' })}
    timing={springTiming({ durationInFrames: 30 })}
  />

  <TransitionSeries.Sequence durationInFrames={90}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

**When a transition plays, it shortens total duration** because both scenes overlap. Total = sceneA + sceneB - transitionDuration.

### Transition reference

| Effect | Best for | Direction options |
|--------|----------|-------------------|
| `fade()` | soft cuts, ambient content | — |
| `slide()` | presenting sequential steps | from-left/right/top/bottom |
| `wipe()` | dramatic content change | 8 directions including diagonals |
| `flip()` | card reveal, feature showcase | — |
| `clockWipe()` | timer reveals, dramatic countdowns | — |
| `iris()` | focus reveal, logo moments | — |
| `cube()` | 3D premium feel (paid license) | — |

### Light leak overlay (cinematic flash)

```tsx
import { LightLeak } from '@remotion/light-leaks';

<TransitionSeries.Overlay durationInFrames={20}>
  <LightLeak />
</TransitionSeries.Overlay>
```

Overlay does NOT shorten timeline — it renders on top of the cut without affecting timing. Use for lens flares, flash cuts, energy bursts.

---

## Tier 5 — Visual richness

### AbsoluteFill layering (the composition pattern)

The standard pattern for a rich video scene: each layer is an independent `AbsoluteFill` with its own animation and timing.

```tsx
const MyScene = () => (
  <>
    <AbsoluteFill>
      <Background />         {/* gradient, video, image */}
    </AbsoluteFill>

    <AbsoluteFill>
      <Sequence from={0}>
        <HeroImage />        {/* with parallax: translateY(frame * 0.3) */}
      </Sequence>
    </AbsoluteFill>

    <AbsoluteFill>
      <Sequence from={15}>
        <Title />            {/* spring entrance */}
      </Sequence>
      <Sequence from={30}>
        <Subtitle />         {/* delayed */}
      </Sequence>
    </AbsoluteFill>

    <AbsoluteFill>
      <Sequence from={50}>
        <DataChart />        {/* appears last */}
      </Sequence>
    </AbsoluteFill>
  </>
);
```

### SVG animation (from Figma exports)

Export SVG from Figma → convert with [svgr.com](https://svgr.com) → animate individual `<g>` elements:

```tsx
<g style={{
  transform: `scale(${scale}) rotate(${rotation}deg)`,
  transformOrigin: 'center center',
  transformBox: 'fill-box',   // CRITICAL: without this, origin defaults to top-left
}}>
  {/* SVG paths */}
</g>
```

**Always set both `transformOrigin` and `transformBox`** when animating SVG elements — without `fill-box`, rotation/scale pivots from the SVG's top-left corner.

### Digital glitch effect

```tsx
// npm i @storybynumbers_/remotion-glitch-effect
import { DigitalGlitchRGB } from '@storybynumbers_/remotion-glitch-effect';

<DigitalGlitchRGB>
  <YourContent />   {/* wraps any content */}
</DigitalGlitchRGB>
```

Uses SVG filters + burst scheduler. Glitches appear in sparse random windows, not every frame — looks more realistic. Deterministic with seed — renders identically every time.

### D3.js data visualization

Remotion integrates well with D3. Drive chart state from `useCurrentFrame()`:

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Each second = one data snapshot
const dataIndex = Math.floor(frame / fps);
const currentData = dataset[Math.min(dataIndex, dataset.length - 1)];

// Animate bar width with spring
const barProgress = spring({ frame: frame - barStartFrame, fps });
const barWidth = interpolate(barProgress, [0, 1], [0, targetWidth]);
```

Templates: [reactvideoeditor.com/remotion-templates](https://www.reactvideoeditor.com/remotion-templates) — free Charts & Data, Bar Race, Content Animation categories.

### 3D text and models

Official examples at [remotion.dev/docs/resources](https://www.remotion.dev/docs/resources):

- **3D Text** — source + preview available
- **Animate .glb models** — Three.js r128
- **Noise visualization**
- **Audio visualization**
- **Wavy TikTok Effect**

Three.js note: use r128. `THREE.CapsuleGeometry` does not exist in r128 — use `CylinderGeometry` + `SphereGeometry` instead.

---

## Tier 6 — Helper libraries

### `remotion-animated` — declarative DSL

Skip boilerplate for simple animations:

```tsx
// npm i remotion-animated
import { Animated, Move, Fade, Scale } from 'remotion-animated';

<Animated animations={[
  Fade({ initial: 0, to: 1 }),
  Move({ initialY: 40, to: 0 }),
  Scale({ initial: 0.8, to: 1 }),
]}>
  <YourComponent />
</Animated>
```

Docs: [remotion-animated.dev](https://www.remotion-animated.dev)

### `remotion-animate-text` — text presets

Pre-built text animation presets (slide, bounce, wave, scramble). Works alongside `remotion-subtitle` for auto-animated captions.

### Timing Editor

Visual playground to tune spring/interpolate params in real-time: [remotion.dev/timing-editor](https://remotion.dev/timing-editor)

---

## Common upgrade patterns

When a user says their video is "boring" or "too simple", apply these in order:

1. **Replace `interpolate([0,30],[0,1])` → `spring()`** everywhere — instant improvement
2. **Add stagger** to any list, grid, or repeated elements
3. **Add translateY** alongside opacity (`translateY(${(1-p)*30}px)`) — elements falling into place look far better than pure fades
4. **Layer more AbsoluteFill** — add a background layer with subtle animation (slow scale, parallax)
5. **Add `@remotion/transitions`** between scenes instead of hard cuts
6. **Use per-word spring reveal** on headline text
7. **Add a data layer** (even a simple animated counter) if content calls for it

---

## Tier 7 — Subtitles & Captions

Captions make or break a short-form video. Remotion provides `@remotion/captions` for TikTok-style word-level subtitles and `@remotion/install-whisper-cpp` for auto-transcription.

### Whisper.cpp pipeline — auto-generate captions from audio/video

Install and configure in a script (e.g. `sub.mjs`):

```tsx
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from '@remotion/install-whisper-cpp';
import { writeFileSync } from 'fs';

// 1. Install Whisper.cpp (one-time)
await installWhisperCpp({ to: './whisper.cpp', version: '1.6.0' });
await downloadWhisperModel({ folder: './whisper.cpp', model: 'medium' });

// 2. Extract audio from video to 16kHz WAV
// npx remotion ffmpeg -i "input.mp4" -ar 16000 "temp/audio.wav" -y

// 3. Transcribe
const whisperOutput = await transcribe({
  inputPath: 'temp/audio.wav',
  model: 'medium',              // tiny|base|small|medium|large-v3
  tokenLevelTimestamps: true,    // CRITICAL for word-level highlight
  whisperPath: './whisper.cpp',
  whisperCppVersion: '1.6.0',
  language: 'vi',                // or 'en', 'ja', etc.
  splitOnWord: true,
});

// 4. Convert to Caption[] and save as JSON
const { captions } = toCaptions({ whisperCppOutput: whisperOutput });
writeFileSync('public/subs/video.json', JSON.stringify(captions, null, 2));
```

**Model selection guide:**

| Model | Disk | RAM | Best for |
|-------|------|-----|----------|
| `tiny` | 75 MB | ~390 MB | Quick draft, English |
| `base` | 142 MB | ~500 MB | Fast, decent accuracy |
| `small` | 466 MB | ~1 GB | Good balance |
| `medium` | 1.5 GB | ~2.6 GB | High accuracy, multi-lang |
| `large-v3` | 2.9 GB | ~4.7 GB | Best accuracy |

**Important:** For non-English languages, use the base model name (e.g. `medium`, NOT `medium.en`) and set `language` accordingly.

### TikTok-style karaoke captions

Use `createTikTokStyleCaptions` to group words into pages, then render each page as a `<Sequence>`:

```tsx
import { Caption, createTikTokStyleCaptions, TikTokPage } from '@remotion/captions';

// Fetch caption JSON (from Whisper output)
const res = await fetch(subtitlesFile);
const captions: Caption[] = await res.json();

// Group words into display pages
const { pages } = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1200,  // how many ms per page
  // Lower = fewer words at a time (200 = ~1 word)
  // Higher = more words at a time (1500 = paragraph)
});

// Render each page as a Sequence
{pages.map((page, index) => {
  const nextPage = pages[index + 1] ?? null;
  const startFrame = (page.startMs / 1000) * fps;
  const endFrame = nextPage
    ? (nextPage.startMs / 1000) * fps
    : startFrame + 36; // fallback
  const durationInFrames = endFrame - startFrame;

  return (
    <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
      <SubtitlePage page={page} />
    </Sequence>
  );
})}
```

### Word-level highlight (karaoke effect)

Inside each page, loop over `page.tokens` and compare timestamps to highlight the active word:

```tsx
const Page: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', bottom: 350 }}>
      <span>
        {page.tokens.map((token) => {
          const active =
            token.fromMs - page.startMs <= timeInMs &&
            token.toMs - page.startMs > timeInMs;

          return (
            <span
              key={token.fromMs}
              style={{
                display: 'inline',
                whiteSpace: 'pre',
                color: active ? '#39E508' : 'white',  // highlight color
              }}
            >
              {token.text}
            </span>
          );
        })}
      </span>
    </AbsoluteFill>
  );
};
```

### Fixed caption pages for generated TTS

When captions are derived from a scene script instead of timestamped Whisper tokens, do **not** use a sliding word window such as `activeIndex - 1`. That makes the text jump every word and feels unstable.

Use fixed pages of `3-5` words. Keep the same page on screen until all words in that page have been read, and only change the active highlight inside the page.

```tsx
const splitWords = (value: string) => value.split(/\s+/).filter(Boolean);

export const getCaptionWindow = ({
  text,
  progress,
  minWords = 3,
  maxWords = 5,
}: {
  text: string;
  progress: number;
  minWords?: number;
  maxWords?: number;
}) => {
  const words = splitWords(text);

  if (words.length === 0) {
    return { activeIndex: 0, tokens: [] };
  }

  const safeProgress = Math.max(0, Math.min(0.999999, progress));
  const activeIndex = Math.min(words.length - 1, Math.floor(safeProgress * words.length));
  const windowSize = Math.min(words.length, Math.max(minWords, maxWords));
  const pageIndex = Math.floor(activeIndex / windowSize);
  const start = Math.min(pageIndex * windowSize, Math.max(0, words.length - windowSize));
  const end = Math.min(words.length, start + windowSize);

  return {
    activeIndex,
    tokens: words.slice(start, end).map((word, index) => ({
      text: word,
      active: start + index === activeIndex,
    })),
  };
};
```

**Rules:**

- Show `3-5` words at a time for short-form voice captions.
- Do not switch to the next page until the current page is fully read.
- Make caption pages sentence-aware: never combine the end of one sentence or clause with the beginning of the next just to satisfy the `3-5` word target. A short final page of `1-2` words is better than showing `AWS. Microsoft` in one caption page while the voice pauses between sentences.
- Use punctuation from the original scene script (`.`, `?`, `!`, `;`, `:`, `,`) to define caption page boundaries when TTS word-boundary metadata does not include punctuation.
- Highlight only the current word; keep the rest of the page visually stable.
- Avoid `key` values that include a constantly changing active word index if they cause remount flicker.
- Do not apply `scale()` to the active word when words are inline or share one caption line. Scaling changes text layout and makes the caption appear to jump. Prefer color, glow, underline, or a fixed-size background highlight.
- Keep React keys stable across active-word changes. A safe key is page index + token index; an unsafe key is `sceneId-activeIndex-tokenIndex` because it remounts the whole caption every word.
- Avoid rendering secondary `facts`, bullet notes, or side captions near the voice caption in short-form news unless explicitly requested. They compete with the spoken subtitle and make the layout feel noisy.
- If punctuation makes generated TTS pause too long, split caption text from TTS text: keep the caption/script text with punctuation for sentence-aware pages, but generate audio from a punctuation-light variant. Prefer converting internal `.` to `,` so sentence breaks become light pauses; keep original `,` by default so commas still sound like commas. Avoid deleting all punctuation because it makes sentence and comma breaks read as `0ms` gaps. A good post-render target for short news voiceover is roughly `180-300ms` between punctuated words: long enough to hear the break, short enough to avoid dead air. The normalized TTS text must keep the same word count/order so `WordBoundary` cues still align with caption words.
- Add a regression test for punctuation-light TTS normalization: it must reduce long internal `.` pauses, preserve original `,` pauses, preserve word count, and leave captions using the original punctuated text for boundary-aware page splitting. After rendering, measure gaps from generated `WordBoundary` cues around words whose caption text ends in `.` or `,`; reject both extremes (`0ms` read-through and overly long `800ms+` pauses) unless the user explicitly wants that cadence.

### Edge TTS word boundaries and gap-safe captions

For `edge-tts` voiceover, do not derive word timing by splitting VTT sentence cues evenly across words. Edge TTS VTT cues are often phrase/sentence-level, so evenly distributed timing drifts during pauses, punctuation, English technical terms, and abbreviations like `AWS`, `OpenAI`, or `Codex`.

Prefer the Python `edge_tts` stream with `boundary="WordBoundary"`, then normalize Edge timing ticks to milliseconds:

```py
communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")

async for chunk in communicate.stream():
  if chunk.get("type") == "audio":
    media_file.write(chunk["data"])
  elif chunk.get("type") == "WordBoundary":
    word_boundaries.append({
      "text": chunk.get("text", ""),
      "offset": chunk.get("offset", 0),
      "duration": chunk.get("duration", 0),
    })
```

```ts
type WordCue = {
  word: string;
  startMs: number;
  endMs: number;
};

const edgeTicksToMs = (value: number) => value / 10000;

const normalizeEdgeTtsWordCues = (boundaries: Array<{ text: string; offset: number; duration: number }>): WordCue[] => {
  return boundaries
    .map((boundary) => {
      const startMs = edgeTicksToMs(boundary.offset);
      const durationMs = edgeTicksToMs(boundary.duration);

      return {
        word: boundary.text.trim(),
        startMs,
        endMs: startMs + durationMs,
      };
    })
    .filter((cue) => cue.word.length > 0 && cue.endMs > cue.startMs);
};
```

When mapping `currentMs` to a word cue, handle gaps between words. If the current time is after a cue ended but before the next cue starts, keep the last started word. Never fallback to index `0` except before the first cue starts; otherwise old text pages can flash back on screen.

```ts
const getActiveWordIndexFromCues = ({
  wordCues,
  currentMs,
}: {
  wordCues: WordCue[];
  currentMs: number;
}) => {
  if (wordCues.length === 0) return 0;

  let lastStartedIndex = 0;

  for (let i = 0; i < wordCues.length; i++) {
    const cue = wordCues[i];
    if (!cue) continue;

    if (currentMs >= cue.startMs) {
      lastStartedIndex = i;
    }

    if (currentMs >= cue.startMs && currentMs < cue.endMs) {
      return i;
    }
  }

  return currentMs < (wordCues[0]?.startMs ?? 0) ? 0 : lastStartedIndex;
};
```

**Regression tests to always add for generated TTS captions:**

- `WordBoundary` ticks are converted to real milliseconds without evenly splitting sentence cues.
- Empty words and zero-duration boundaries are discarded.
- A timestamp in the gap between cue `B` and cue `C` returns index `B`, not `0`.
- Caption pages do not mix the last words of one sentence with the first words of the next sentence.
- Caption keys do not include `activeIndex` if that would remount text every frame/page.

### Sync caption highlight to real audio duration

For generated voiceover, never assume `scene.duration` is the real audio duration. TTS often returns audio that is longer or shorter than the requested scene duration. If highlight progress uses the wrong duration, the colored word will drift away from the voice.

Store the measured audio duration per scene, usually from `ffprobe`, and use it for caption progress:

```tsx
export const getCaptionProgress = ({
  localFrame,
  fps,
  durationSeconds,
  voiceDurationSeconds,
}: {
  localFrame: number;
  fps: number;
  durationSeconds: number;
  voiceDurationSeconds?: number;
}) => {
  const syncDurationSeconds = voiceDurationSeconds ?? durationSeconds;
  const durationFrames = Math.max(1, Math.ceil(syncDurationSeconds * fps));

  return Math.max(0, Math.min(1, localFrame / durationFrames));
};
```

**Rules:**

- Prefer `voiceDurationSeconds` for caption progress.
- Fallback to `scene.duration` only when audio duration is unavailable.
- Build `calculateMetadata` and timeline from generated props/audio duration so render frame count matches the audio.
- Add a regression test proving `voiceDurationSeconds` is preferred over requested scene duration.

### Caption entrance animation

Wrap each subtitle page with a spring entrance for a polished feel:

```tsx
const SubtitlePage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 5,
  });

  // Pass enter progress to Page for scale/translateY animation
  return <Page enterProgress={enter} page={page} />;
};
```

### Auto-fit text width

Use `@remotion/layout-utils` to prevent text overflow:

```tsx
import { fitText } from '@remotion/layout-utils';

const { fontSize } = fitText({
  fontFamily: 'TheBoldFont',
  text: page.text,
  withinWidth: width * 0.9,      // 90% of video width
  textTransform: 'uppercase',
});

const finalSize = Math.min(120, fontSize);  // cap at max size
```

### Caption styling tips

- **Stroke outline** is optional, not the default. Use it only when the background is too busy and no subtitle box is available:

  ```tsx
  { WebkitTextStroke: '20px black', paintOrder: 'stroke' }
  ```

- **No stroke preference:** If the design uses a dark translucent subtitle box, prefer no stroke and a subtle `textShadow`.
- **Position for 1080x1920:** bottom-third is about `paddingBottom: 600-650`; bottom-quarter is lower, about `paddingBottom: 320-480`.
- **Avoid ambiguity:** If the user says “1/3 from the bottom”, measure from the bottom edge, not from the top.
- **Size guide:** Start around `48-56px` for `3-5` word pages. Increase only if readability needs it; very large sizes like `68px+` can overpower the scene.
- **Uppercase** + bold font = higher readability on mobile
- **`combineTokensWithinMilliseconds`** controls speed: `200` = word-by-word (fast reading), `1200` = phrase-by-phrase (natural), `2000` = sentence-by-sentence

### Scene-by-scene TTS workflow

For news/story videos, generate voice per scene rather than one large audio file when the scene visuals are separately timed. This keeps scene timing, captions, and audio easier to debug.

Recommended workflow:

1. Generate each scene audio into a temporary directory.
2. Measure each output with `ffprobe`.
3. Attach `audioSrc` and `voiceDurationSeconds` to the scene props.
4. Rebuild the timeline from the measured audio durations.
5. Replace old audio files only after every scene has succeeded.

```ts
const getAudioDuration = (filePath: string) => {
  const output = execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    filePath,
  ], { encoding: 'utf8' }).trim();

  const duration = Number(output);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Invalid audio: ${filePath}`);
  }

  return duration;
};
```

For `edge-tts`, add retry/backoff because voices can intermittently fail with no audio. Keep a primary voice and a fallback voice, and never delete existing usable audio until the new full batch succeeds.

### Custom font loading

Load custom fonts with `delayRender` to prevent rendering before font is ready:

```tsx
import { continueRender, delayRender, staticFile } from 'remotion';

export const loadFont = async () => {
  const handle = delayRender();

  const font = new FontFace(
    'TheBoldFont',
    `url('${staticFile('theboldfont.ttf')}') format('truetype')`,
  );

  await font.load();
  document.fonts.add(font);
  continueRender(handle);
};
```

**Always call `delayRender()` before async operations and `continueRender()` after** — without this, Remotion may render frames before the font/data is loaded.

---

## Tier 8 — Image & Video assets

### `<Img>` — static images from `/public`

Use `staticFile()` to reference files in the `public/` folder:

```tsx
import { Img, staticFile } from 'remotion';

<Img
  src={staticFile('generated/artemis/stills/scene-01.jpg')}
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }}
/>
```

**Always use `<Img>` instead of `<img>`** — Remotion's `<Img>` handles `delayRender` automatically (waits for the image to load before rendering the frame).

### Evidence and benchmark images

When displaying official benchmarks, charts, screenshots, or source documents, readability is more important than cinematic crop. These assets are evidence, not decorative backgrounds.

```tsx
<div style={{ padding: 10, background: 'rgba(8, 20, 36, 0.50)' }}>
  <div style={{ height: 600, overflow: 'hidden', background: 'white' }}>
    <Img
      src={staticFile('generated/news/official-benchmark.png')}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center center',
      }}
    />
  </div>
</div>
```

**Rules:**

- Use `objectFit: 'contain'` for benchmark/document images.
- Do not crop official benchmark images unless the user explicitly asks for a zoomed detail.
- Do not place overlays, frames, labels, or gradients over important numbers or labels.
- If a card frame is needed, put padding/border outside the image area.
- Store external official assets locally under `public/generated/...` for stable rendering.

### Ken Burns effect (slow zoom)

Subtle continuous zoom makes static images feel alive:

```tsx
const localFrame = frame - sceneStartFrame;

<Img
  src={staticFile(scene.imageSrc)}
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${interpolate(
      localFrame,
      [0, fps * 3],           // zoom over 3 seconds
      [1.02, 1.08],           // from 102% to 108%
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )})`,
  }}
/>
```

**Tuning:**

- Subtle: `[1.0, 1.04]` over 5s
- Medium: `[1.02, 1.08]` over 3s
- Dramatic: `[1.0, 1.15]` over 2s

### Image overlay patterns

Layer a gradient on top of images for text readability:

```tsx
{/* Background image */}
<AbsoluteFill>
  <Img src={staticFile(imageSrc)} style={{ objectFit: 'cover', opacity: 0.34 }} />

  {/* Gradient overlay for text contrast */}
  <AbsoluteFill
    style={{
      background: 'linear-gradient(180deg, rgba(4,8,18,0.35) 0%, rgba(4,8,18,0.70) 100%)',
    }}
  />
</AbsoluteFill>

{/* Text content on top */}
<AbsoluteFill>
  <Title />
</AbsoluteFill>
```

**Common overlay patterns:**

- **Bottom darkening:** `linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%)` — for bottom text
- **Full dim:** `opacity: 0.3` on image — for centered text
- **Vignette:** `radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%)` — cinematic look
- **Color tint:** `filter: saturate(1.15) contrast(1.08)` on image

### `<OffthreadVideo>` — embed video clips

For embedding video files (mp4/webm), use `<OffthreadVideo>` instead of `<Video>` for better performance:

```tsx
import { OffthreadVideo } from 'remotion';

<OffthreadVideo
  src={src}
  style={{ objectFit: 'cover' }}
/>
```

**`<OffthreadVideo>` vs `<Video>`:**

- `<OffthreadVideo>` — renders frames off the main thread, better for final render. Use this by default.
- `<Video>` — plays in real-time in the Studio preview. Use only when you need live preview feedback.

### `getVideoMetadata` — dynamic duration from video file

Calculate composition duration from the actual video length:

```tsx
import { getVideoMetadata } from '@remotion/media-utils';
import { CalculateMetadataFunction } from 'remotion';

export const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const metadata = await getVideoMetadata(props.src);

  return {
    fps: 30,
    durationInFrames: Math.floor(metadata.durationInSeconds * 30),
  };
};
```

### Parallax background (moving stars / particles)

Create depth with multiple layers moving at different speeds:

```tsx
// Helper: continuous horizontal drift
const getParallaxX = (frame: number, factor: number, cycle: number) => {
  return Math.sin((frame / cycle) * Math.PI * 2) * factor;
};

// Far layer (slow)
<AbsoluteFill style={{
  opacity: 0.24,
  transform: `translateX(${getParallaxX(frame, 24, 420)}px)`,
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1px)',
  backgroundSize: '120px 120px',
}} />

// Near layer (fast)
<AbsoluteFill style={{
  opacity: 0.34,
  transform: `translateX(${getParallaxX(frame, 48, 280)}px)`,
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1.4px, transparent 1.4px)',
  backgroundSize: '80px 80px',
}} />
```

**Key:** larger `factor` + shorter `cycle` = faster movement = appears closer.

### Image + filter combinations

```tsx
// Desaturated background image
<Img style={{ filter: 'grayscale(0.7) brightness(0.5)' }} />

// Warm cinematic tone
<Img style={{ filter: 'saturate(1.15) contrast(1.08) sepia(0.1)' }} />

// Blur for depth-of-field
<Img style={{ filter: 'blur(4px)' }} />

// Animated filter (reveal clarity over time)
<Img style={{
  filter: `blur(${interpolate(frame, [0, 30], [10, 0], {
    extrapolateRight: 'clamp',
  })}px)`,
}} />
```

---

## Tier 9 — 2026 Tech News Video Trends & Editing Meta

The 2026 landscape for tech news (TikTok, YouTube Shorts, Reels) is defined by **retention-first pacing, AI-augmented workflows, and a return to authentic, "human-centered" visual design** to combat AI sameness. To achieve the 2026 standard in Remotion, implement the following architectural and visual strategies:

### 1. Retention-First Architecture (The "Scroll-Stopper")

The algorithm heavily rewards completion rate and loop rate. Videos must be engineered for pace.

- **The "3-Second Hook":** Start mid-action. Do not use slow fades at `frame=0`. Begin with a sudden, full-scale component drop (`scale: 1`) and dynamic typography.
- **Pattern Interruptions (Every 3-5 Secs):** Shift the visual state constantly. If the camera is static for 100 frames, the viewer swiped. Use:
  - **Dynamic Zooms:** `<AbsoluteFill style={{ transform: \`scale(\${interpolate(frame, [0, 90], [1, 1.1])})\` }}>`
  - **B-roll Pop-ins:** Use `<OffthreadVideo>` for 1-1.5 second bursts (`durationInFrames={45}`).
- **The Loop Effect:** Design the final frames of the composition to seamlessly transition into the hook (e.g., the final scene slides left, perfectly revealing the exact starting frame).

### 2. The Hub-and-Spoke "Two-Speed" Strategy

Most tech news channels employ an AI "variant factory", automatically recutting long-form content.

- **Dynamic Content Injection:** Base your Remotion templates around a primary JSON payload (`props: { script, moments, targetPlatform }`).
- **Platform Variants via Props:** Configure the composition dynamically based on the platform.
  - *Shorts/TikTok:* 9:16 vertical, captions placed `bottom: 400` (to avoid platform UI), hyper-aggressive stagger (3-4 frames).
  - *LinkedIn / X:* 4:5 or 1:1 format, conservative stagger (6-8 frames), captions lower.

### 3. Glassmorphism, 2D/3D Hybrid, & Authentic Imperfection

Audiences are tired of "perfect" AI renders. 2026 motion graphics combine slick layouts with analog, textured elements.

- **Glassmorphism UI:** Simulate spatial depth using frosted UI panels around news headlines instead of flat boxes.

  ```tsx
  <div style={{
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 24, padding: 32
  }}>
  ```

- **Analog Textures:** Apply a permanent `AbsoluteFill` overlay with a film grain or subtle VHS glitch on top of pristine screen recordings to make them feel "lived-in" and authentic.
- **Show, Don't Tell:** Never just talk about a device/feature. Build animated mockups. Use `transform: perspective(1000px) rotateY(-15deg)` to display glowing tech screenshots with 3D depth and metallic shaders.

### 4. Advanced Captioning & Semantic Typography

Captions are not just accessibility; they are visual anchors.

- **Kinetic Typography:** Tie `scale` out-of-bounds bounds to emphasize volume.
- **Semantic Highlighting:** Use high-contrast colors (Chrome, Holographic gradients, Neon Green `#39E508`) strictly for critical tech terms, while leaving filler words white.

### 5. The Personality-Led Vodcast Format

Media has shifted to creator-led pods and micro-series.

- **Dynamic PIP (Picture-in-Picture):** For screencasts, do not use a static circle overlay.
  - Layer a talking-head camera feed over the article/b-roll.
  - Use `interpolate()` to seamlessly shrink the talking head into the bottom-right corner as the tech article scales up into the background.
  - Add a subtle floating animation to the PIP box (`translateY` with a Math.sin cycle based on `frame`).
- **Interactive UI Simulation:** When discussing an article, recreate the article DOM inside Remotion and use `translateY` to simulate scrolling while a yellow "highlighter" div stretches over the text using `clipPath`.

---

## Existing project render check

When asked to try/render video inside an existing Remotion folder, use `references/existing-project-render-check.md`: inspect `package.json` and `src/Root.tsx`, reuse valid `public/generated/**/props.json` and voice assets when present, run `npm test`, render with explicit `--props` and `--frames`, then verify duration/audio with `ffprobe`.

## Resources

- Official examples: [remotion.dev/docs/resources](https://www.remotion.dev/docs/resources)
- Free templates: [reactvideoeditor.com/remotion-templates](https://www.reactvideoeditor.com/remotion-templates)
- Typewriter template: [github.com/remotion-dev/typewriter](https://github.com/remotion-dev/typewriter)
- Glitch effect: [github.com/storybynumbers/remotion-glitch-effect](https://github.com/storybynumbers/remotion-glitch-effect)
- Timing editor: [remotion.dev/timing-editor](https://remotion.dev/timing-editor)
- remotion-animated: [remotion-animated.dev](https://www.remotion-animated.dev)
- Official skills (AI-readable): [github.com/remotion-dev/skills](https://github.com/remotion-dev/skills)
- `@remotion/captions` docs: [remotion.dev/docs/captions](https://remotion.dev/docs/captions)
- Whisper.cpp integration: [remotion.dev/docs/install-whisper-cpp](https://remotion.dev/docs/install-whisper-cpp)
