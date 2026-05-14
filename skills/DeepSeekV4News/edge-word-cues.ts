export type EdgeWordBoundary = {
  text: string;
  offset: number;
  duration: number;
};

export type WordCue = {
  word: string;
  startMs: number;
  endMs: number;
};

const edgeTicksToMs = (value: number): number => value / 10000;

export const normalizeEdgeWordBoundaries = (
  boundaries: EdgeWordBoundary[],
): WordCue[] => {
  return boundaries
    .map((boundary) => {
      const word = boundary.text.trim();
      const startMs = edgeTicksToMs(boundary.offset);
      const durationMs = edgeTicksToMs(boundary.duration);

      return {
        word,
        startMs,
        endMs: startMs + durationMs,
      };
    })
    .filter(
      (cue) =>
        cue.word.length > 0 &&
        Number.isFinite(cue.startMs) &&
        Number.isFinite(cue.endMs) &&
        cue.endMs > cue.startMs,
    );
};
