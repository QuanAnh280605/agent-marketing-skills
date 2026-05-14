import type { DeepSeekV4NewsScene } from "./script";

export type WordCue = {
  word: string;
  startMs: number;
  endMs: number;
};

export type DeepSeekV4NewsInputScene = DeepSeekV4NewsScene & {
  requestedDurationSeconds: number;
  voiceDurationSeconds?: number;
  audioSrc?: string;
  wordCues?: WordCue[];
};

export type DeepSeekV4NewsPlannedScene = DeepSeekV4NewsScene & {
  start: number;
  end: number;
  duration: number;
  voiceDurationSeconds?: number;
  audioSrc?: string;
  wordCues?: WordCue[];
};

export const buildDeepSeekV4NewsTimeline = ({
  scenes,
  minPaddingSeconds = 0,
  keepRequestedDuration = true,
}: {
  scenes: DeepSeekV4NewsInputScene[];
  minPaddingSeconds?: number;
  keepRequestedDuration?: boolean;
}): DeepSeekV4NewsPlannedScene[] => {
  let cursor = 0;

  return scenes.map((scene) => {
    const requestedDuration = Math.max(0.1, scene.requestedDurationSeconds);
    const voiceDuration = Math.max(
      0.1,
      (scene.voiceDurationSeconds ?? scene.requestedDurationSeconds) + minPaddingSeconds,
    );
    const duration = keepRequestedDuration
      ? Math.max(requestedDuration, voiceDuration)
      : voiceDuration;
    const start = cursor;
    const end = start + duration;
    cursor = end;

    return {
      ...scene,
      start,
      end,
      duration,
    };
  });
};

export const getDeepSeekV4NewsTotalDuration = (
  scenes: DeepSeekV4NewsPlannedScene[],
): number => {
  return scenes[scenes.length - 1]?.end ?? 0;
};
