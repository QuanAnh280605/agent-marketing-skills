---
name: hyperframes-video-techniques
description: Advanced visual techniques for HyperFrames compositions — animation primitives (GSAP easing, spring-like physics), stagger patterns, text effects (typewriter, word reveal, clip-path wipe, gradient text), scene transitions, visual richness (layering, SVG animation, glitch, parallax, Ken Burns), captions and subtitles synced to audio, image/video asset patterns, and 2026 short-form video trends. Use when the user wants to make a HyperFrames video look more professional, cinematic, or dynamic — or says it looks "boring", "plain", or "too simple".
---

# HyperFrames Video Techniques

Use this skill to create and enhance HyperFrames videos with professional motion, visual systems, voice/captions, and scene structure. If porting from Remotion, every Remotion technique has an equivalent in HyperFrames (GSAP + HTML + CSS), but HyperFrames production render rules always take priority over Remotion patterns.

## Mental model

Three layers of a professional video:

1. **Animation primitives** — how elements move (`gsap.from`, easing, spring-like)
2. **Composition strategy** — how layers and timing work (`data-track-index`, stagger, `data-start`)
3. **Scene transitions** — how scenes connect (crossfade, wipe, shader)

---

## Production Rules Learned From Real HyperFrames Renders

These rules come from real render failures. Apply them before adding advanced motion.

### One video = one HTML file

Every new video must have its own HTML file. Do not overwrite `index.html` or previously approved video files, unless the user explicitly asks to replace them.

**Good:**

```text
videos/interview-psychology-tiktok.html
videos/product-launch-vertical.html
videos/career-tips-tiktok.html
```

Or if the project keeps compositions at the root:

```text
interview-psychology-tiktok.html
product-launch-vertical.html
career-tips-tiktok.html
```

**Bad:**

```text
index.html
```

Use `index.html` as a temporary entry only when the CLI/project requires it, but always keep the source video in its own separate HTML file.

**Naming convention:**

```text
<topic>-<format>.html
```

Examples:

```text
interview-psychology-tiktok.html
interview-psychology-tiktok-redesign.html
interview-psychology-tiktok-font-fixed.html
```

Render output should match the HTML filename:

```text
renders/interview-psychology-tiktok.mp4
renders/interview-psychology-tiktok-redesign.mp4
```

### Do not animate timed clip roots

Do not animate elements that have both `class="clip"` and timing attributes (`data-start`, `data-duration`). HyperFrames owns the visibility of timed clips. GSAP should only animate inner wrappers.

**Bad:**

```js
tl.to("#scene-2", { opacity: 1, filter: "blur(0px)", scale: 1 }, 7.4);
tl.to("#transition-1", { opacity: 0 }, 8.0);
```

**Good:**

```html
<section id="scene-2" class="clip scene" data-start="7.2" data-duration="8.39" data-track-index="1">
  <div class="scene-content">
    ...
  </div>
</section>
```

```js
tl.fromTo(
  "#scene-2 .scene-content",
  { opacity: 0, y: 48 },
  { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
  7.35
);
```

### Main full-screen scenes should share one track

For multi-scene full-screen videos, all main scenes should share the same `data-track-index`. Different tracks mean scenes can coexist, causing old scenes to show through under new ones.

**Good:**

```html
<section id="scene-1" class="clip scene" data-start="0" data-duration="7.2" data-track-index="1"></section>
<section id="scene-2" class="clip scene" data-start="7.2" data-duration="8.39" data-track-index="1"></section>
<section id="scene-3" class="clip scene" data-start="15.6" data-duration="8.1" data-track-index="1"></section>
```

**Bad:**

```html
<section id="scene-1" class="clip scene" data-track-index="1"></section>
<section id="scene-2" class="clip scene" data-track-index="2"></section>
<section id="scene-3" class="clip scene" data-track-index="3"></section>
```

### Do not rely on scene overlap for transitions

Do not overlap two full-screen scene clips to create transitions, unless there is a very clear compositing reason. Use a separate transition overlay instead.

If lint reports overlap at a decimal boundary, reduce the preceding duration by `0.01s`.

```html
<section data-start="7.2" data-duration="8.39" data-track-index="1"></section>
<section data-start="15.6" data-duration="8.1" data-track-index="1"></section>
```

Reason: `7.2 + 8.4` can become `15.600000000000001`, which HyperFrames will flag as overlap.

### Vietnamese font safety

For Vietnamese videos, use fonts with good Vietnamese glyph coverage and sufficient line-height for diacritical marks. Do not choose display fonts just because they look nice.

Avoid condensed display fonts like `League Gothic`, `Bebas Neue`, or unfamiliar fonts without render testing. Common issues:

- per-character fallback
- misaligned Vietnamese diacritical marks
- uneven character widths
- accents from the line below overlapping the line above
- bad line breaks

Safe stack:

```css
body {
  font-family: "Be Vietnam Pro", "Noto Sans", sans-serif;
}
```

Large Vietnamese headline:

```css
.mega {
  font-family: "Be Vietnam Pro", "Noto Sans", sans-serif;
  font-size: 152px;
  font-weight: 900;
  line-height: 1.16;
  letter-spacing: -0.045em;
  text-transform: uppercase;
}
```

Recommended minimums:

```css
/* Large multi-line Vietnamese display text */
line-height: 1.12;

/* Safer for many accents */
line-height: 1.16;

/* Body / notes */
line-height: 1.24;
```

Do not use `line-height: 0.82`, `0.92`, or `1.0` for multi-line Vietnamese headlines.

After changing fonts, render and verify the following accented clusters:

```text
Gioi / Giỏi
van / vẫn
bi loai / bị loại
Dung / Đúng
chua du / chưa đủ
Ke viec / Kể việc
tin hieu / tín hiệu
mat diem / mất điểm
dien / diễn
de tin / dễ tin
```

### TikTok vertical safe composition

For `1080x1920`:

- Core text within x range `70-1010`
- Main content within y range `150-1740`
- Footer/CTA can sit at y `1740-1830`
- Do not place important content near top/bottom UI zones
- Each scene needs its own unique visual metaphor — do not repeat the same panel formula

Bad repeated scene formula:

```text
eyebrow + headline + generic panel + footer
```

Better scene metaphors:

1. Dossier scene — paper file, stamp, scanline
2. Signal scan scene — reticle, radar sweep, signal bars
3. Receipt scene — task list, strike-through, outcome proof
4. Node-map scene — role-fit map, SVG connectors, MATCH tag
5. Diagnostic scene — gauge, tags, evaluation cards
6. Quote lockup — final statement in premium container

### Debugging visual bugs

**Bug: new scene appears but old scene remains visible**

Cause: scenes are on different `data-track-index`, or durations overlap.

Fix: put all full-screen main scenes on one track, make durations non-overlapping, keep transition overlay on separate track.

**Bug: transition flashes or glitches**

Cause: animating timed clip roots, transition starts on exact scene boundary, or using many timed transition clips.

Fix: use one full-duration overlay clip, animate only inner children, start transition `0.3-0.4s` before boundary.

**Bug: render differs from preview**

Check for `gsap.to("#scene-*")`, `gsap.fromTo("#transition-*")`, `repeat: -1`, async timeline construction, or sequential scenes on different tracks.

---

## Tier 1 — Animation Primitives

### Spring-like physics with GSAP

Remotion uses `spring()`. HyperFrames uses GSAP `elastic` and `back` eases to simulate physics:

```js
// Logo entrance — no bounce, quick (≈ damping:200, stiffness:200)
tl.from("#logo", { scale: 0.8, opacity: 0, duration: 0.4, ease: "power3.out" }, 0.1);

// Card pop — subtle bounce (≈ damping:12, stiffness:100)
tl.from("#card", { scale: 0.85, opacity: 0, duration: 0.6, ease: "back.out(1.7)" }, 0.2);

// Bouncy icon (≈ damping:6, stiffness:80)
tl.from("#icon", { scale: 0, opacity: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" }, 0.3);
```

**Conversion table:**

| Remotion spring config | GSAP equivalent |
|------------------------|-----------------|
| `damping:200, stiffness:200` | `ease: "power3.out", duration: 0.4` |
| `damping:12, stiffness:100` | `ease: "back.out(1.7)", duration: 0.6` |
| `damping:6, stiffness:80` | `ease: "elastic.out(1, 0.4)", duration: 0.8` |

### Fade in -> hold -> fade out (multi-keyframe)

Remotion uses `interpolate(frame, [0,30,90,120], [0,1,1,0])`. HyperFrames uses two separate tweens:

```js
// Fade in
tl.from("#text", { opacity: 0, y: 30, duration: 0.5, ease: "power2.out" }, 0);
// Fade out (chi scene cuoi moi dung exit tween)
tl.to("#text", { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, 3.5);
```

> **HyperFrames note:** Only the last scene is allowed to use exit animations (`gsap.to` with opacity:0). Other scenes should NOT use exit animations — the transition overlay handles that.

### Slide in with ease-out

```js
// Slide from bottom
tl.from("#element", { y: 60, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.2);

// Slide from left
tl.from("#element", { x: -80, opacity: 0, duration: 0.5, ease: "expo.out" }, 0.2);
```

---

## Tier 2 — Stagger (the most impactful technique for a professional feel)

Stagger = each element is delayed by N seconds. This pattern makes list/grid animations look professional.

```html
<!-- HTML: every item has the same class -->
<div class="stat-card clip" data-start="1" data-duration="4" data-track-index="1">Item 1</div>
<div class="stat-card clip" data-start="1" data-duration="4" data-track-index="2">Item 2</div>
<div class="stat-card clip" data-start="1" data-duration="4" data-track-index="3">Item 3</div>
```

```js
// Stagger all at once — GSAP auto-delays each element
tl.from(".stat-card", {
  y: 40,
  opacity: 0,
  duration: 0.6,
  ease: "power3.out",
  stagger: 0.12
}, 1.0);

// Stagger from center outward
tl.from(".grid-item", {
  scale: 0,
  opacity: 0,
  duration: 0.5,
  ease: "back.out(1.7)",
  stagger: { amount: 0.4, from: "center" }
}, 0.5);
```

**Apply stagger to:** bullet lists, chart bars, stat cards, image grids, icon sets, table rows.

---

## Tier 3 — Text Effects

### Typewriter effect

```html
<div id="typewriter" class="clip" data-start="0" data-duration="5" data-track-index="1">
  This is typewriter content
</div>
```

```js
const fullText = "This is typewriter content";
const el = document.getElementById("typewriter");
el.textContent = "";

const obj = { chars: 0 };
tl.to(obj, {
  chars: fullText.length,
  duration: 2.5,
  ease: "none",
  onUpdate() {
    el.textContent = fullText.slice(0, Math.floor(obj.chars));
  }
}, 0.2);
```

### Per-word spring reveal (most cinematic)

```html
<div id="headline" class="clip" data-start="0" data-duration="4" data-track-index="1">
  <!-- Wrap each word in a span via JS -->
</div>
```

```js
const headline = document.getElementById("headline");
const text = "HyperFrames Video Techniques";
headline.innerHTML = text.split(" ")
  .map(w => `<span class="word" style="display:inline-block; overflow:hidden; padding:0 4px">
    <span class="word-inner" style="display:inline-block">${w}</span>
  </span>`)
  .join(" ");

tl.from(".word-inner", {
  y: "100%",
  opacity: 0,
  duration: 0.5,
  ease: "power3.out",
  stagger: 0.08
}, 0.3);
```

**Variants:** `x: -30` (slide from left), `scale: 0` (pop in), `rotationX: 90` (3D flip in).

### Clip-path wipe reveal

```js
tl.from("#text-reveal", {
  clipPath: "inset(0 100% 0 0)",
  duration: 0.8,
  ease: "power3.inOut"
}, 0.5);

tl.from("#text-reveal", {
  clipPath: "inset(100% 0 0 0)",
  duration: 0.6,
  ease: "expo.out"
}, 0.5);

tl.from("#element", {
  clipPath: "circle(0% at 50% 50%)",
  duration: 0.8,
  ease: "power2.out"
}, 0.3);
```

### Gradient text

```html
<h1 id="hero-title" class="clip gradient-text" data-start="0" data-duration="5" data-track-index="1">
  Headline Text
</h1>
```

```css
.gradient-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 72px;
  font-weight: 700;
}
```

---

## Tier 4 — Scene Transitions

See `references/transitions.md` for full details. The production-safe default is a separate full-duration overlay — no scene overlap and no animating clip roots.

### Recommended: one always-on transition overlay

```html
<div
  id="transition-overlay"
  class="clip transition-overlay"
  data-start="0"
  data-duration="52"
  data-track-index="20"
  data-layout-allow-overflow
>
  <div id="transition-layer" class="transition-layer">
    <div id="transition-light" class="transition-light"></div>
    <div id="transition-rule" class="transition-rule"></div>
  </div>
</div>
```

```css
.transition-overlay {
  z-index: 20;
  pointer-events: none;
}

.transition-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: rgba(11, 13, 11, 0.88);
}

.transition-light {
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: -20%;
  height: 46%;
  opacity: 0;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(212, 134, 82, 0.86),
    rgba(212, 134, 82, 0.22) 42%,
    rgba(212, 134, 82, 0) 72%
  );
}

.transition-rule {
  position: absolute;
  left: 70px;
  right: 70px;
  top: 50%;
  height: 4px;
  opacity: 0;
  background: #d48652;
  transform: scaleX(0);
  transform-origin: left center;
}
```

```js
const transitionAt = (time) => {
  const start = Math.max(0.05, time - 0.38);

  tl.set("#transition-layer", { opacity: 0 }, start);
  tl.set("#transition-light", { opacity: 0, y: 220, scale: 1 }, start);
  tl.set("#transition-rule", { opacity: 0, scaleX: 0 }, start);

  tl.to("#transition-layer", {
    opacity: 1,
    duration: 0.22,
    ease: "power2.out",
    overwrite: "auto",
  }, start + 0.02);

  tl.to("#transition-light", {
    opacity: 0.78,
    y: -160,
    scale: 1.08,
    duration: 0.72,
    ease: "power3.inOut",
    overwrite: "auto",
  }, start + 0.06);

  tl.to("#transition-rule", {
    opacity: 1,
    scaleX: 1,
    duration: 0.28,
    ease: "power4.out",
    overwrite: "auto",
  }, start + 0.16);

  tl.to("#transition-rule", {
    opacity: 0,
    scaleX: 0.98,
    duration: 0.22,
    ease: "power2.in",
  }, time + 0.1);

  tl.to("#transition-layer", {
    opacity: 0,
    duration: 0.42,
    ease: "sine.inOut",
  }, time + 0.44);
};

[7.2, 15.6, 23.7, 33.1, 42.9].forEach(transitionAt);
```

**Why this works:**

- Main scenes do not overlap
- Transition starts before the boundary and hides the scene swap
- HyperFrames controls clip visibility
- GSAP controls only inner overlay elements
- No clip-root opacity conflicts

**Remotion transition equivalents:**

| Remotion | HyperFrames production-safe |
|----------|-----------------------------|
| `fade()` | full-duration overlay dip / veil, not scene overlap |
| `slide({ direction: 'from-left' })` | animate inner scene content from x, not scene clip root |
| `wipe()` | animate overlay child or inner wrapper `clipPath` |
| `flip()` | animate inner card/wrapper `rotationY`, not timed clip root |
| `iris()` | animate overlay mask/inner wrapper `clipPath` |

---

## Tier 5 — Visual Richness

### Layering multiple tracks (replacing AbsoluteFill)

```html
<video id="bg-video" data-start="0" data-duration="10" data-track-index="0"
  src="assets/bg.mp4" muted playsinline style="width:100%;height:100%;object-fit:cover"></video>
<audio data-start="0" data-duration="10" data-track-index="5" src="assets/bg.mp4"></audio>

<div id="overlay" class="clip" data-start="0" data-duration="10" data-track-index="1"
  style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.7))"></div>

<div id="hero" class="clip" data-start="0.5" data-duration="9" data-track-index="2">
  <!-- text content -->
</div>
```

### SVG animation

```html
<svg id="logo-svg" class="clip" data-start="0" data-duration="5" data-track-index="3">
  <g id="logo-group"><!-- paths --></g>
</svg>
```

```js
tl.from("#logo-group", {
  scale: 0,
  opacity: 0,
  duration: 0.6,
  ease: "back.out(1.7)",
  transformOrigin: "center center",
  svgOrigin: "960 540"
}, 0.3);

tl.from("#icon-path", {
  rotation: -45,
  opacity: 0,
  duration: 0.5,
  ease: "power2.out",
  transformOrigin: "50% 50%"
}, 0.5);
```

### Glassmorphism UI

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
}
```

### Parallax layers (moving stars/particles)

```html
<div id="stars-far" class="clip" data-start="0" data-duration="30" data-track-index="1"
  style="position:absolute;inset:0;opacity:0.24;
    background-image:radial-gradient(circle,rgba(255,255,255,0.75) 1px,transparent 1px);
    background-size:120px 120px"></div>

<div id="stars-near" class="clip" data-start="0" data-duration="30" data-track-index="2"
  style="position:absolute;inset:0;opacity:0.34;
    background-image:radial-gradient(circle,rgba(255,255,255,0.9) 1.4px,transparent 1.4px);
    background-size:80px 80px"></div>
```

```js
const duration = 30;

tl.to("#stars-far", { x: 24, duration: duration / 2, ease: "sine.inOut", yoyo: true,
  repeat: Math.ceil(duration / (duration / 2)) - 1 }, 0);

tl.to("#stars-near", { x: -48, duration: duration / 4, ease: "sine.inOut", yoyo: true,
  repeat: Math.ceil(duration / (duration / 4)) - 1 }, 0);
```

---

## Tier 6 — Image & Video Assets

### Ken Burns effect (slow zoom on a static image)

```html
<img id="scene-img" class="clip" data-start="0" data-duration="6" data-track-index="1"
  src="assets/image.jpg"
  style="width:100%;height:100%;object-fit:cover">
```

```js
tl.from("#scene-img", { scale: 1.02, duration: 0 }, 0);
tl.to("#scene-img", { scale: 1.08, duration: 6, ease: "none" }, 0);

tl.to("#scene-img", { scale: 1.15, duration: 3, ease: "none" }, 0);
```

### Image overlay gradient

```html
<div class="scene-wrapper" style="position:relative;width:100%;height:100%">
  <img src="assets/img.jpg" style="width:100%;height:100%;object-fit:cover;opacity:0.34">
  <div style="position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(4,8,18,0.35) 0%,rgba(4,8,18,0.70) 100%)"></div>
</div>
```

**Common overlay patterns:**

```css
/* Bottom darkening — for text at the bottom */
background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%);

/* Vignette — cinematic */
background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%);

/* Full dim */
opacity: 0.3;
```

### Video with separate audio

```html
<video id="clip-v" data-start="2" data-duration="8" data-track-index="1"
  src="assets/clip.mp4" muted playsinline
  style="width:100%;height:100%;object-fit:cover"></video>
<audio id="clip-a" data-start="2" data-duration="8" data-track-index="5"
  src="assets/clip.mp4" data-volume="1"></audio>
```

### Image filters

```js
tl.set("#bg-img", { filter: "grayscale(0.7) brightness(0.5)" }, 0);
tl.set("#bg-img", { filter: "saturate(1.15) contrast(1.08) sepia(0.1)" }, 0);
tl.from("#img", { filter: "blur(10px)", duration: 0.8, ease: "power2.out" }, 0.2);
```

---

## Tier 7 — Captions & Subtitles

See `references/captions.md` for full details. Below are the most important patterns.

### Captions from transcript JSON (Whisper output)

Use `npx hyperframes transcribe` to generate a transcript, then load it in the composition:

```js
fetch("assets/transcript.json")
  .then(r => r.json())
  .then(words => buildCaptions(words));

function buildCaptions(words) {
  const pages = groupIntoPages(words, { min: 3, max: 5 });

  pages.forEach((page, i) => {
    const startSec = page[0].start;
    const endSec = i < pages.length - 1 ? pages[i + 1][0].start : page[page.length - 1].end;
    const duration = endSec - startSec;

    const div = document.createElement("div");
    div.className = "caption-page clip";
    div.dataset.start = startSec;
    div.dataset.duration = duration;
    div.dataset.trackIndex = 10;
    div.innerHTML = page.map(w =>
      `<span class="caption-word" data-start="${w.start}" data-end="${w.end}">${w.word}</span>`
    ).join(" ");

    document.getElementById("composition").appendChild(div);
  });
}
```

### Word-level karaoke highlight

```js
words.forEach(word => {
  const el = document.querySelector(`[data-word-id="${word.id}"]`);
  if (!el) return;

  tl.to(el, { color: "#39E508", duration: 0 }, word.startMs / 1000);
  tl.to(el, { color: "#ffffff", duration: 0 }, word.endMs / 1000);
});
```

### Caption styling

```css
.caption-page {
  position: absolute;
  bottom: 200px;
  left: 0; right: 0;
  text-align: center;
  font-size: 52px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  line-height: 1.2;
  padding: 0 80px;
}

.caption-page {
  -webkit-text-stroke: 3px black;
  paint-order: stroke fill;
}

.caption-page {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 12px 24px;
}
```

### Caption entrance animation

```js
document.querySelectorAll(".caption-page").forEach(page => {
  const startTime = parseFloat(page.dataset.start);
  tl.from(page, {
    y: 20,
    opacity: 0,
    duration: 0.2,
    ease: "power2.out"
  }, startTime);
});
```

### Edge TTS -> HyperFrames

Use the `hyperframes-media` skill to generate TTS:

```bash
npx hyperframes tts --text "Content to read" --voice vi-VN-HoaiMyNeural --output assets/voice.mp3
npx hyperframes transcribe assets/voice.mp3 --output assets/transcript.json
```

Then load `transcript.json` as shown above.

---

## Tier 8 — 2026 Short-Form Video Trends

### 1. Retention-First — "3-Second Hook"

```js
tl.from("#hook-title", {
  scale: 1.2,
  opacity: 0,
  duration: 0.2,
  ease: "power4.out"
}, 0.0);

tl.from("#scene-bg", { scale: 1.0, duration: 0 }, 0);
tl.to("#scene-bg", { scale: 1.1, duration: 8, ease: "none" }, 0);
```

### 2. Pattern Interruptions (every 3-5 seconds)

```js
tl.to("#scene-wrapper", { scale: 1.08, duration: 0.3, ease: "power2.in" }, 4.0);
tl.to("#scene-wrapper", { scale: 1.0, duration: 0.5, ease: "power2.out" }, 4.3);
```

### 3. Glassmorphism + Authentic Design

```css
.news-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
}

.device-frame {
  transform: perspective(1000px) rotateY(-15deg);
  box-shadow: 0 0 60px rgba(100, 200, 255, 0.3);
}
```

### 4. Semantic Typography (kinetic captions)

```js
words.forEach(word => {
  const isTechTerm = ["AI", "ChatGPT", "HyperFrames", "AWS"].includes(word.text);
  const color = isTechTerm ? "#39E508" : "#ffffff";
  tl.to(`#word-${word.id}`, { color, duration: 0 }, word.startMs / 1000);
});
```

### 5. PiP (Picture-in-Picture)

```html
<div id="main" class="clip" data-start="0" data-duration="15" data-track-index="1"></div>

<div id="pip" class="clip" data-start="0" data-duration="15" data-track-index="3"
  style="position:absolute;bottom:40px;right:40px;width:280px;height:280px;
    border-radius:50%;overflow:hidden;border:3px solid rgba(255,255,255,0.3)">
  <video src="assets/talking-head.mp4" muted playsinline style="width:100%;height:100%;object-fit:cover"></video>
</div>
```

```js
const pipDuration = 15;
tl.to("#pip", {
  y: -12,
  duration: 2,
  ease: "sine.inOut",
  yoyo: true,
  repeat: Math.ceil(pipDuration / 2) - 1
}, 0);

tl.to("#pip", { scale: 0.7, x: -20, duration: 0.5, ease: "power2.out" }, 5.0);
```

---

## Common Upgrade Patterns

When a video looks "boring" or "too simple", apply these upgrades in order:

1. **Create a distinct visual metaphor per scene** — dossier, radar, receipt, map, gauge, quote lockup; do not repeat `headline + card`.
2. **Add `ease: "power3.out"` or `"back.out(1.7)"`** — replace simple linear/opacity animations.
3. **Add stagger** to every list, grid, or repeated elements.
4. **Add movement context** — `y: 40`, `clipPath`, line sweep, stamp, scanline, SVG connector draw.
5. **Ken Burns** on static images — `scale: 1.0 -> 1.08` over 5-6 seconds.
6. **Add production-safe transition overlay** between scenes instead of hard cuts or scene overlap.
7. **Per-word reveal** on headline text, but do not make each word a separate timed clip if you can animate spans inside the scene.
8. **Typography pass** — use fonts appropriate for the language, sufficient line-height for diacritical marks, and letter-spacing that is not too tight.
9. **Safe-area pass** — important text should be within `x:70-1010`, `y:150-1740` for vertical video.
10. **Render-check pass** — watch the MP4 output; do not rely on preview alone.

---

## New Video Workflow

Use this checklist every time you start a new video.

1. **Choose the source file name first**

```text
<topic>-<format>.html
```

Examples:

```text
interview-psychology-tiktok.html
product-launch-vertical.html
ai-news-short.html
```

2. **Do not overwrite existing approved videos**

Do not overwrite `index.html`, old compositions, old voice assets, or old renders unless the user requests it. Create new variants with a clear suffix:

```text
interview-psychology-tiktok-redesign.html
interview-psychology-tiktok-font-fixed.html
```

3. **Keep assets and renders predictable**

```text
assets/<topic>-voice.mp3
assets/<topic>-script.txt
assets/<topic>-source-image.png
renders/<topic>-<format>.mp4
```

4. **Every video gets voiceover by default**

Unless the user explicitly says `no voice`, `không voice`, `text only`, or equivalent, create Vietnamese voiceover for every new video. Use the local `edge-tts-stable` skill workflow, not a one-shot best-effort command.

Required voice workflow:

```text
1. Write assets/<topic>-script.txt with the final spoken script in properly accented Vietnamese.
2. Generate assets/<topic>-voice.mp3 with edge-tts sequentially.
3. Primary voice: vi-VN-HoaiMyNeural.
4. Fallback voice: vi-VN-NamMinhNeural.
5. Retry transient failures with backoff.
6. Verify the MP3 with ffprobe and require duration > 0.
7. Add a separate <audio> clip to the HyperFrames composition.
8. Render and verify the final MP4.
```

HyperFrames audio rule:

```html
<audio
  id="voiceover"
  data-start="0"
  data-duration="<verified-duration>"
  data-track-index="0"
  data-volume="1"
  src="assets/<topic>-voice.mp3"
></audio>
```

Do not use video elements for audio. If the voiceover is longer than the target duration, first tighten the script, then adjust TTS rate slightly. Do not silently ship a mute video.

Voice script rules:

```text
- Vietnamese scripts MUST use proper Vietnamese diacritics. Do not write no-accent text like "Dung AI ca ngay" because TTS pronunciation becomes unnatural.
- Choose TTS rate by listening pace, not by a fixed default. For short-form videos, +10% to +15% is acceptable when it still sounds natural.
- If the narration still feels rushed or exceeds the target duration, shorten the spoken script.
- For a 30s video, target voice duration is about 27-30s.
```

5. **Build scenes on one main track**

```html
<section id="scene-1" class="clip scene" data-start="0" data-duration="7.2" data-track-index="1"></section>
<section id="scene-2" class="clip scene" data-start="7.2" data-duration="8.39" data-track-index="1"></section>
<section id="scene-3" class="clip scene" data-start="15.6" data-duration="8.1" data-track-index="1"></section>
```

6. **Put transitions and overlays on separate tracks**

Use a full-duration transition overlay on a high track, for example `data-track-index="20"`. Animate only children inside it.

7. **Use inner wrappers for scene animation**

```html
<section id="scene-1" class="clip scene" data-start="0" data-duration="7.2" data-track-index="1">
  <div class="scene-content">
    ...
  </div>
</section>
```

```js
tl.from("#scene-1 .scene-content", { opacity: 0, y: 48, duration: 0.7, ease: "power3.out" }, 0.2);
```

8. **Run check after HTML edits**

```bash
npm run check
```

Fix errors before rendering. Warnings can be acceptable only when understood, for example decorative contrast warnings or dense timeline warnings from intentional layered motion.

9. **Render a named MP4**

```bash
npm run render
```

If the project render command only targets `index.html`, keep the true composition in its own HTML file and use `index.html` only as a temporary launcher/entry when necessary. Restore or preserve the separate source file.

10. **Visual QA the rendered MP4**

Check for old scenes still visible, transition flashes, clipped Vietnamese accents, text outside mobile safe area, and preview/render mismatch.

---

## Seeded PRNG (replacing Math.random())

HyperFrames forbids `Math.random()`. Use mulberry32 instead:

```js
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);
const positions = Array.from({ length: 20 }, () => ({
  x: rng() * 1920,
  y: rng() * 1080
}));
```

---

## Resources

- HyperFrames docs: https://hyperframes.heygen.com/introduction
- GSAP docs: https://gsap.com/docs/v3/
- Captions reference: `references/captions.md`
- Transitions reference: `references/transitions.md`
- Visual techniques: `references/techniques.md`
- Motion principles: `references/motion-principles.md`
