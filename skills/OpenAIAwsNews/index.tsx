import {
  AbsoluteFill,
  Audio,
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
  getCaptionWindow,
  getCaptionWindowFromCues,
} from "../DeepSeekV4News/captions";
import type { OpenAIAwsVisual } from "./script";

const visualSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("cloud-shift"),
    from: z.string(),
    to: z.string(),
    label: z.string(),
  }),
  z.object({
    kind: z.literal("bedrock"),
    services: z.array(z.string()).min(1),
    label: z.string(),
  }),
  z.object({
    kind: z.literal("market"),
    players: z.array(z.string()).min(1),
    label: z.string(),
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

export const openAIAwsNewsSchema = z.object({
  title: z.string(),
  scenes: z.array(sceneSchema).min(1),
  backgroundColor: z.string().default("#050816"),
  accentColor: z.string().default("#ff9900"),
  secondaryColor: z.string().default("#7dd3fc"),
});

type OpenAIAwsNewsProps = z.infer<typeof openAIAwsNewsSchema>;

const splitWords = (value: string): string[] => value.split(/\s+/).filter(Boolean);

const getActiveScene = (
  scenes: OpenAIAwsNewsProps["scenes"],
  currentSeconds: number,
) => {
  return (
    scenes.find(
      (scene) => currentSeconds >= scene.start && currentSeconds < scene.end,
    ) ?? scenes[scenes.length - 1]
  );
};

const LogoOrb: React.FC<{
  label: string;
  color: string;
  localFrame: number;
  delay?: number;
}> = ({ label, color, localFrame, delay = 0 }) => {
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: localFrame - delay,
    fps,
    durationInFrames: 18,
    config: { damping: 150, stiffness: 210 },
  });

  return (
    <div
      style={{
        width: 270,
        height: 270,
        borderRadius: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        background: `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.26), transparent 26%), linear-gradient(145deg, ${color}44, rgba(15,23,42,0.86))`,
        border: `2px solid ${color}99`,
        boxShadow: `0 32px 90px ${color}33`,
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.84, 1])}) rotate(${interpolate(progress, [0, 1], [-5, 0])}deg)`,
      }}
    >
      <div
        style={{
          fontSize: 35,
          lineHeight: 1.02,
          fontWeight: 950,
          letterSpacing: -1.1,
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const CloudShiftPanel: React.FC<{
  visual: Extract<OpenAIAwsVisual, { kind: "cloud-shift" }>;
  localFrame: number;
  accentColor: string;
  secondaryColor: string;
}> = ({ visual, localFrame, accentColor, secondaryColor }) => {
  const flow = interpolate(localFrame % 54, [0, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: 930 }}>
      <div
        style={{
          marginBottom: 24,
          color: accentColor,
          fontSize: 23,
          fontWeight: 950,
          letterSpacing: 3,
          textAlign: "center",
        }}
      >
        {visual.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <LogoOrb label={visual.from} color={secondaryColor} localFrame={localFrame} />
        <div style={{ width: 250, height: 8, borderRadius: 999, background: "rgba(148,163,184,0.28)", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: `${flow * 78}%`,
              top: -13,
              width: 36,
              height: 36,
              borderRadius: 999,
              background: accentColor,
              boxShadow: `0 0 36px ${accentColor}`,
            }}
          />
        </div>
        <LogoOrb label={visual.to} color={accentColor} localFrame={localFrame} delay={7} />
      </div>
    </div>
  );
};

const BedrockPanel: React.FC<{
  visual: Extract<OpenAIAwsVisual, { kind: "bedrock" }>;
  localFrame: number;
  accentColor: string;
}> = ({ visual, localFrame, accentColor }) => {
  const { fps } = useVideoConfig();
  const cardIn = spring({
    frame: localFrame,
    fps,
    durationInFrames: 18,
    config: { damping: 170, stiffness: 220 },
  });

  return (
    <div
      style={{
        width: 900,
        borderRadius: 34,
        padding: 34,
        background: "rgba(15, 23, 42, 0.70)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 32px 92px rgba(0,0,0,0.38)",
        opacity: cardIn,
        transform: `translateY(${(1 - cardIn) * 28}px)`,
      }}
    >
      <div style={{ color: accentColor, fontSize: 24, fontWeight: 950, letterSpacing: 3 }}>
        {visual.label}
      </div>
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {visual.services.map((service, index) => {
          const itemIn = spring({
            frame: localFrame - 6 - index * 5,
            fps,
            durationInFrames: 16,
            config: { damping: 180, stiffness: 220 },
          });

          return (
            <div
              key={service}
              style={{
                minHeight: 118,
                borderRadius: 24,
                padding: 22,
                background: "rgba(2, 6, 23, 0.66)",
                border: `1px solid ${accentColor}55`,
                fontSize: 32,
                fontWeight: 900,
                opacity: itemIn,
                transform: `translateY(${(1 - itemIn) * 22}px)`,
              }}
            >
              {service}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MarketPanel: React.FC<{
  visual: Extract<OpenAIAwsVisual, { kind: "market" }>;
  localFrame: number;
  accentColor: string;
  secondaryColor: string;
}> = ({ visual, localFrame, accentColor, secondaryColor }) => {
  const { fps } = useVideoConfig();

  return (
    <div style={{ width: 910 }}>
      <div style={{ color: secondaryColor, fontSize: 23, fontWeight: 950, letterSpacing: 3, textAlign: "center" }}>
        {visual.label}
      </div>
      <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
        {visual.players.map((player, index) => {
          const itemIn = spring({
            frame: localFrame - index * 5,
            fps,
            durationInFrames: 16,
            config: { damping: 160, stiffness: 220 },
          });

          return (
            <div
              key={player}
              style={{
                borderRadius: 999,
                padding: "24px 30px",
                background: `linear-gradient(135deg, ${accentColor}2f, rgba(2,6,23,0.78))`,
                border: `1px solid ${index % 2 === 0 ? accentColor : secondaryColor}88`,
                fontSize: 35,
                fontWeight: 950,
                opacity: itemIn,
                transform: `translateY(${(1 - itemIn) * 22}px) scale(${interpolate(itemIn, [0, 1], [0.92, 1])})`,
              }}
            >
              {player}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VisualPanel: React.FC<{
  visual: OpenAIAwsVisual;
  localFrame: number;
  accentColor: string;
  secondaryColor: string;
}> = ({ visual, localFrame, accentColor, secondaryColor }) => {
  if (visual.kind === "cloud-shift") {
    return (
      <CloudShiftPanel
        visual={visual}
        localFrame={localFrame}
        accentColor={accentColor}
        secondaryColor={secondaryColor}
      />
    );
  }

  if (visual.kind === "bedrock") {
    return <BedrockPanel visual={visual} localFrame={localFrame} accentColor={accentColor} />;
  }

  return (
    <MarketPanel
      visual={visual}
      localFrame={localFrame}
      accentColor={accentColor}
      secondaryColor={secondaryColor}
    />
  );
};

export const OpenAIAwsNews: React.FC<OpenAIAwsNewsProps> = ({
  title,
  scenes,
  backgroundColor,
  accentColor,
  secondaryColor,
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
          text: activeScene.voice,
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
  const enter = spring({
    frame: localFrame,
    fps,
    durationInFrames: 18,
    config: { damping: 180, stiffness: 220 },
  });
  const exit = interpolate(
    localFrame,
    [Math.max(0, sceneDurationFrames - 12), sceneDurationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const reveal = Math.min(enter, exit);
  const push = interpolate(localFrame, [0, sceneDurationFrames], [1, 1.055], {
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
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 18% 16%, rgba(255,153,0,0.32), transparent 36%), radial-gradient(circle at 86% 14%, rgba(125,211,252,0.24), transparent 34%), radial-gradient(circle at 50% 88%, rgba(59,130,246,0.18), transparent 44%)",
          transform: `scale(${push})`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.17,
          backgroundImage:
            "linear-gradient(rgba(255,153,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.11) 1px, transparent 1px)",
          backgroundSize: "78px 78px",
          transform: `translateY(${(frame % 78) * -0.38}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.08 + (Math.sin(frame * 0.19) + 1) * 0.02,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 5px)",
        }}
      />

      <AbsoluteFill style={{ padding: 58 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: accentColor, fontSize: 29, fontWeight: 950 }}>
              {title}
            </div>
            <div style={{ marginTop: 8, fontSize: 20, opacity: 0.66, letterSpacing: 2 }}>
              CNBC • OPENAI • AMAZON BEDROCK
            </div>
          </div>
          <div style={{ fontSize: 26, color: secondaryColor, fontWeight: 950 }}>
            {String(sceneIndex + 1).padStart(2, "0")}/{String(scenes.length).padStart(2, "0")}
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          padding: "176px 62px 300px",
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
              fontWeight: 950,
              textTransform: "uppercase",
            }}
          >
            {activeScene?.kicker}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 84,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: -2.8,
              maxWidth: 950,
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
                    opacity: wordIn,
                    color: index === 0 ? "#ffffff" : undefined,
                    transform: `translateY(${(1 - wordIn) * 22}px)`,
                  }}
                >
                  {word}
                  {index < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: 22, fontSize: 31, lineHeight: 1.22, opacity: 0.86, maxWidth: 900 }}>
            {activeScene?.detail}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {activeScene ? (
            <VisualPanel
              visual={activeScene.visual}
              localFrame={localFrame}
              accentColor={accentColor}
              secondaryColor={secondaryColor}
            />
          ) : null}
        </div>

        <div />
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
            background: "rgba(2, 6, 23, 0.76)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.40)",
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
              key={`${activeScene?.id ?? "caption"}-${index}`}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                color: token.active ? accentColor : "rgba(248,250,252,0.78)",
                textShadow: token.active
                  ? `0 0 24px ${accentColor}88`
                  : "0 6px 18px rgba(0,0,0,0.5)",
              }}
            >
              {token.text}
              {index < captionWindow.tokens.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      </AbsoluteFill>

      {scenes.map((scene) => {
        if (!scene.audioSrc) return null;

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
