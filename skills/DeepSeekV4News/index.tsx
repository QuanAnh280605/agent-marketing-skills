import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  getCaptionProgress,
  getCaptionTokenKey,
  getCaptionTokenStyle,
  getCaptionWindow,
  getCaptionWindowFromCues,
} from "./captions";
import type { DeepSeekVisual } from "./script";

const visualSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("metric"),
    label: z.string(),
    value: z.string(),
    secondary: z.string(),
  }),
  z.object({
    kind: z.literal("benchmark"),
    src: z.string(),
    caption: z.string(),
  }),
  z.object({
    kind: z.literal("api"),
    models: z.array(z.string()).min(1),
  }),
]);

const wordCueSchema = z.object({
  word: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
});

const sceneSchema = z.object({
  id: z.string(),
  kicker: z.string(),
  headline: z.string(),
  detail: z.string(),
  facts: z.array(z.string()).min(1),
  voice: z.string(),
  visual: visualSchema,
  start: z.number().nonnegative(),
  end: z.number().positive(),
  duration: z.number().positive(),
  voiceDurationSeconds: z.number().optional(),
  audioSrc: z.string().optional(),
  wordCues: z.array(wordCueSchema).optional(),
});

export const deepSeekV4NewsSchema = z.object({
  title: z.string(),
  scenes: z.array(sceneSchema).min(1),
  backgroundColor: z.string().default("#030712"),
  accentColor: z.string().default("#22d3ee"),
});

type DeepSeekV4NewsProps = z.infer<typeof deepSeekV4NewsSchema>;

const splitWords = (value: string): string[] => value.split(/\s+/).filter(Boolean);

const highlightPattern = /^(V4-Pro|V4-Flash|1\.6T|49B|284B|13B|1M|API|DeepSeek)$/i;

const isHeadlineHighlight = (word: string): boolean => {
  return highlightPattern.test(word.replace(/[,.!?]$/g, ""));
};

const getActiveScene = (
  scenes: DeepSeekV4NewsProps["scenes"],
  currentSeconds: number,
) => {
  return (
    scenes.find(
      (scene) => currentSeconds >= scene.start && currentSeconds < scene.end,
    ) ?? scenes[scenes.length - 1]
  );
};

const CyberBackground: React.FC<{
  frame: number;
  cameraPush: number;
  accentColor: string;
}> = ({ frame, cameraPush, accentColor }) => {
  const pulse = 0.08 + (Math.sin(frame * 0.08) + 1) * 0.035;

  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 18% 14%, rgba(34,211,238,0.36), transparent 36%), radial-gradient(circle at 86% 16%, rgba(59,130,246,0.26), transparent 34%), radial-gradient(circle at 50% 88%, rgba(14,165,233,0.18), transparent 44%)",
          transform: `scale(${cameraPush})`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.2,
          backgroundImage:
            "linear-gradient(rgba(125,211,252,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.14) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          transform: `translate3d(${Math.sin(frame / 90) * 18}px, ${(frame % 72) * -0.35}px, 0)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.22,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.72) 1px, transparent 1px)",
          backgroundSize: "94px 94px",
          transform: `translate3d(${Math.sin(frame / 58) * 42}px, ${Math.cos(frame / 72) * 24}px, 0)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: pulse,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 1px, transparent 1px, transparent 4px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}18 48%, transparent 54%)`,
          opacity: 0.52,
          transform: `translateX(${((frame * 13) % 1500) - 1180}px) skewX(-18deg)`,
        }}
      />
    </>
  );
};

const SignalBars: React.FC<{ localFrame: number; accentColor: string }> = ({
  localFrame,
  accentColor,
}) => {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 48 }}>
      {[0, 1, 2, 3, 4].map((bar) => {
        const height = 16 + ((localFrame + bar * 7) % 32);

        return (
          <div
            key={bar}
            style={{
              width: 9,
              height,
              borderRadius: 999,
              background: bar % 2 === 0 ? accentColor : "rgba(125,211,252,0.72)",
              boxShadow: `0 0 20px ${accentColor}88`,
            }}
          />
        );
      })}
    </div>
  );
};

const BenchmarkPanel: React.FC<{
  visual: Extract<DeepSeekVisual, { kind: "benchmark" }>;
  localFrame: number;
  fps: number;
}> = ({ visual, localFrame, fps }) => {
  const cardIn = spring({
    frame: localFrame,
    fps,
    durationInFrames: 22,
    config: { damping: 180, stiffness: 220 },
  });

  return (
    <div
      style={{
        width: 1010,
        borderRadius: 22,
        padding: 10,
        background: "rgba(8, 20, 36, 0.50)",
        border: "1px solid rgba(125, 211, 252, 0.36)",
        boxShadow: "0 28px 72px rgba(0,0,0,0.34)",
        transform: `perspective(1200px) rotateX(${(1 - cardIn) * 8}deg) translateY(${(1 - cardIn) * 34}px)`,
        opacity: cardIn,
      }}
    >
      <div
        style={{
          height: 600,
          borderRadius: 16,
          overflow: "hidden",
          background: "rgba(255,255,255,0.96)",
        }}
      >
        <Img
          src={staticFile(visual.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center center",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "rgba(226, 232, 240, 0.86)",
          fontSize: 18,
        }}
      >
        <span>{visual.caption}</span>
        <span style={{ color: "#22d3ee", fontWeight: 800 }}>SOURCE: DEEPSEEK</span>
      </div>
    </div>
  );
};

const MetricPanel: React.FC<{
  visual: Extract<DeepSeekVisual, { kind: "metric" }>;
  localFrame: number;
  fps: number;
  accentColor: string;
}> = ({ visual, localFrame, fps, accentColor }) => {
  const pop = spring({
    frame: localFrame,
    fps,
    durationInFrames: 18,
    config: { damping: 120, stiffness: 190 },
  });

  return (
    <div
      style={{
        width: 660,
        borderRadius: 34,
        padding: "46px 48px",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, rgba(14,165,233,0.24), rgba(15,23,42,0.82))",
        border: "1px solid rgba(125, 211, 252, 0.34)",
        boxShadow: "0 28px 80px rgba(14,165,233,0.22)",
        transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          background:
            "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.46) 48%, transparent 55%)",
          transform: `translateX(${((localFrame * 18) % 980) - 720}px)`,
        }}
      />
      <div style={{ fontSize: 24, letterSpacing: 3, color: accentColor }}>
        {visual.label}
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 148,
          lineHeight: 0.92,
          fontWeight: 950,
          letterSpacing: -4,
        }}
      >
        {visual.value}
      </div>
      <div style={{ marginTop: 20, fontSize: 34, opacity: 0.82 }}>
        {visual.secondary}
      </div>
    </div>
  );
};

const ApiPanel: React.FC<{
  visual: Extract<DeepSeekVisual, { kind: "api" }>;
  localFrame: number;
  fps: number;
}> = ({ visual, localFrame, fps }) => {
  return (
    <div
      style={{
        width: 820,
        borderRadius: 28,
        padding: 34,
        background: "rgba(2, 6, 23, 0.76)",
        border: "1px solid rgba(34, 211, 238, 0.38)",
        fontFamily: "monospace",
        boxShadow: "0 28px 72px rgba(0,0,0,0.42)",
        transform: "perspective(1100px) rotateY(-8deg)",
      }}
    >
      <div style={{ color: "#67e8f9", fontSize: 24 }}>
        POST /chat/completions
      </div>
      {visual.models.map((model, index) => {
        const lineIn = spring({
          frame: localFrame - index * 7,
          fps,
          durationInFrames: 14,
          config: { damping: 180, stiffness: 220 },
        });

        return (
          <div
            key={model}
            style={{
              marginTop: 22,
              fontSize: 42,
              color: "#f8fafc",
              opacity: lineIn,
              transform: `translateX(${(1 - lineIn) * -28}px)`,
            }}
          >
              {`model: "${model}"`}
              {index === visual.models.length - 1 ? (
                <span style={{ color: "#67e8f9", opacity: localFrame % 20 < 10 ? 1 : 0 }}>
                  _
                </span>
              ) : null}
            </div>
        );
      })}
    </div>
  );
};

export const DeepSeekV4News: React.FC<DeepSeekV4NewsProps> = ({
  title,
  scenes,
  backgroundColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSeconds = frame / fps;
  const activeScene = getActiveScene(scenes, currentSeconds);
  const localFrame = Math.max(0, frame - Math.floor((activeScene?.start ?? 0) * fps));
  const sceneDurationFrames = Math.max(1, Math.ceil((activeScene?.duration ?? 1) * fps));
  const sceneProgress = getCaptionProgress({
    localFrame,
    fps,
    durationSeconds: activeScene?.duration ?? 1,
    voiceDurationSeconds: activeScene?.voiceDurationSeconds,
  });
  const captionWindow =
    activeScene?.wordCues && activeScene.wordCues.length > 0
      ? getCaptionWindowFromCues({
          wordCues: activeScene.wordCues,
          localFrame,
          fps,
          minWords: 3,
          maxWords: 5,
        })
      : getCaptionWindow({
          text: activeScene?.voice ?? "",
          progress: sceneProgress,
          minWords: 3,
          maxWords: 5,
        });
  const words = splitWords(activeScene?.headline ?? "");
  const sceneIndex = Math.max(0, scenes.findIndex((scene) => scene.id === activeScene?.id));

  const cardIn = spring({
    frame: localFrame,
    fps,
    durationInFrames: 20,
    config: { damping: 180, stiffness: 220 },
  });
  const exit = interpolate(
    localFrame,
    [Math.max(0, sceneDurationFrames - 12), sceneDurationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const reveal = Math.min(cardIn, exit);
  const cameraPush = interpolate(localFrame, [0, sceneDurationFrames], [1, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const interruptFlash = interpolate(localFrame % 108, [0, 5, 18], [0, 0.24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        color: "#f8fafc",
        fontFamily: "Inter, TheBoldFont, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <CyberBackground frame={frame} cameraPush={cameraPush} accentColor={accentColor} />
      <AbsoluteFill style={{ background: "white", opacity: interruptFlash }} />

      <AbsoluteFill style={{ padding: 58 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ color: accentColor, fontSize: 28, fontWeight: 900 }}>
              {title}
            </div>
            <div style={{ marginTop: 8, fontSize: 20, opacity: 0.64, letterSpacing: 2 }}>
              OFFICIAL DOCS • 24 APR 2026
            </div>
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <SignalBars localFrame={localFrame} accentColor={accentColor} />
            <div style={{ fontSize: 26, color: accentColor, fontWeight: 900 }}>
              {String(sceneIndex + 1).padStart(2, "0")}/{String(scenes.length).padStart(2, "0")}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          padding: "180px 64px 300px",
          justifyContent: "space-between",
          transform: `translateY(${(1 - reveal) * 26}px)`,
          opacity: reveal,
        }}
      >
        <div>
          <div
            style={{
              color: accentColor,
              fontSize: 24,
              letterSpacing: 2.8,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {activeScene?.kicker}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 82,
              lineHeight: 1.02,
              fontWeight: 950,
              letterSpacing: -2.6,
              maxWidth: 940,
            }}
          >
            {words.map((word, index) => {
              const wordIn = spring({
                frame: localFrame - index * 3,
                fps,
                durationInFrames: 13,
                config: { damping: 170, stiffness: 230 },
              });

              return (
                <span
                  key={`${activeScene?.id}-${index}`}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color: isHeadlineHighlight(word) ? "#67e8f9" : "#f8fafc",
                    opacity: wordIn,
                    textShadow: isHeadlineHighlight(word)
                      ? "0 0 34px rgba(103,232,249,0.5)"
                      : "0 12px 32px rgba(0,0,0,0.32)",
                    transform: `translateY(${(1 - wordIn) * 22}px) rotateX(${(1 - wordIn) * 28}deg)`,
                  }}
                >
                  {word}
                  {index < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: 22, fontSize: 31, lineHeight: 1.24, opacity: 0.86, maxWidth: 880 }}>
            {activeScene?.detail}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {activeScene?.visual.kind === "benchmark" ? (
            <BenchmarkPanel visual={activeScene.visual} localFrame={localFrame} fps={fps} />
          ) : activeScene?.visual.kind === "metric" ? (
            <MetricPanel visual={activeScene.visual} localFrame={localFrame} fps={fps} accentColor={accentColor} />
          ) : activeScene?.visual.kind === "api" ? (
            <ApiPanel visual={activeScene.visual} localFrame={localFrame} fps={fps} />
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activeScene?.facts.map((fact, index) => {
            const factIn = spring({
              frame: localFrame - 8 - index * 4,
              fps,
              durationInFrames: 14,
              config: { damping: 180, stiffness: 220 },
            });

            return (
              <div
                key={`${activeScene.id}-fact-${index}`}
                style={{
                  fontSize: 25,
                  lineHeight: 1.22,
                  padding: "12px 16px",
                  borderRadius: 18,
                  background: "rgba(15,23,42,0.42)",
                  border: "1px solid rgba(125,211,252,0.16)",
                  opacity: factIn * 0.9,
                  transform: `translateX(${(1 - factIn) * -20}px)`,
                }}
              >
                {`▸ ${fact}`}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 360,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "88%",
            minHeight: 132,
            borderRadius: 30,
            padding: "18px 26px",
            background: "rgba(2, 6, 23, 0.72)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
            fontSize: 54,
            fontWeight: 950,
            letterSpacing: -1.2,
            lineHeight: 1.12,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {captionWindow.tokens.map((token, index) => (
            <span
              key={getCaptionTokenKey(activeScene?.id ?? "caption", index)}
              style={getCaptionTokenStyle(token.active)}
            >
              {token.text}
              {index < captionWindow.tokens.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      </AbsoluteFill>

      {scenes.map((scene) => {
        if (!scene.audioSrc) {
          return null;
        }

        return (
          <Sequence
            key={`audio-${scene.id}`}
            from={Math.floor(scene.start * fps)}
            durationInFrames={Math.max(1, Math.ceil(scene.duration * fps))}
          >
            <Audio src={staticFile(scene.audioSrc)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
