import type { OpenAIAwsNewsScene } from "./script";

export type WordCue = {
  word: string;
  startMs: number;
  endMs: number;
};

export type OpenAIAwsNewsInputScene = OpenAIAwsNewsScene & {
  requestedDurationSeconds: number;
  voiceDurationSeconds?: number;
  audioSrc?: string;
  wordCues?: WordCue[];
};

export type OpenAIAwsNewsPlannedScene = OpenAIAwsNewsScene & {
  start: number;
  end: number;
  duration: number;
  voiceDurationSeconds?: number;
  audioSrc?: string;
  wordCues?: WordCue[];
};

export const buildOpenAIAwsNewsTimeline = ({
  scenes,
  minPaddingSeconds = 0,
  keepRequestedDuration = true,
}: {
  scenes: OpenAIAwsNewsInputScene[];
  minPaddingSeconds?: number;
  keepRequestedDuration?: boolean;
}): OpenAIAwsNewsPlannedScene[] => {
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

export const getOpenAIAwsNewsTotalDuration = (
  scenes: OpenAIAwsNewsPlannedScene[],
): number => scenes[scenes.length - 1]?.end ?? 0;
