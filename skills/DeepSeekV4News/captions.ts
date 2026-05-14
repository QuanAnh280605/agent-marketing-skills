import type { CSSProperties } from "react";

export type CaptionToken = {
  text: string;
  active: boolean;
};

export type WordCue = {
  word: string;
  startMs: number;
  endMs: number;
};

export const getCaptionTokenKey = (sceneId: string, tokenIndex: number): string => {
  return `${sceneId}-caption-${tokenIndex}`;
};

export const getCaptionTokenStyle = (active: boolean): CSSProperties => ({
  display: "inline-block",
  whiteSpace: "pre",
  color: active ? "#facc15" : "rgba(248,250,252,0.78)",
  textShadow: active
    ? "0 0 24px rgba(250,204,21,0.58)"
    : "0 6px 18px rgba(0,0,0,0.5)",
  background: active ? "rgba(250,204,21,0.14)" : "transparent",
  borderRadius: active ? 14 : 0,
  padding: active ? "0 8px" : "0 0",
  margin: active ? "0 -8px" : 0,
});

const splitWords = (value: string): string[] => value.split(/\s+/).filter(Boolean);

const endsPhrase = (word: string): boolean => /[.!?;:,。！？；：，]$/.test(word);

const getDisplayWords = (wordCues: WordCue[], text?: string): string[] => {
  const textWords = text ? splitWords(text) : [];

  if (textWords.length === wordCues.length) {
    return textWords;
  }

  return wordCues.map((cue) => cue.word);
};

const addPagedRange = ({
  pages,
  start,
  end,
  minWords,
  maxWords,
}: {
  pages: Array<{ start: number; end: number }>;
  start: number;
  end: number;
  minWords: number;
  maxWords: number;
}) => {
  let cursor = start;

  while (cursor < end) {
    const remaining = end - cursor;

    if (remaining <= maxWords) {
      pages.push({ start: cursor, end });
      return;
    }

    const remainderAfterMax = remaining - maxWords;
    const pageSize =
      remainderAfterMax > 0 && remainderAfterMax < minWords
        ? Math.max(minWords, remaining - minWords)
        : maxWords;

    pages.push({ start: cursor, end: cursor + pageSize });
    cursor += pageSize;
  }
};

const buildSentenceAwarePages = ({
  words,
  minWords,
  maxWords,
}: {
  words: string[];
  minWords: number;
  maxWords: number;
}): Array<{ start: number; end: number }> => {
  const pages: Array<{ start: number; end: number }> = [];
  let sentenceStart = 0;

  for (let index = 0; index < words.length; index++) {
    if (endsPhrase(words[index] ?? "")) {
      addPagedRange({ pages, start: sentenceStart, end: index + 1, minWords, maxWords });
      sentenceStart = index + 1;
    }
  }

  if (sentenceStart < words.length) {
    addPagedRange({ pages, start: sentenceStart, end: words.length, minWords, maxWords });
  }

  return pages;
};

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
}): number => {
  const syncDurationSeconds = voiceDurationSeconds ?? durationSeconds;
  const durationFrames = Math.max(1, Math.ceil(syncDurationSeconds * fps));

  return Math.max(0, Math.min(1, localFrame / durationFrames));
};

export const getActiveWordIndexFromCues = ({
  wordCues,
  localFrame,
  fps,
}: {
  wordCues: WordCue[];
  localFrame: number;
  fps: number;
}): number => {
  if (wordCues.length === 0) return 0;

  const currentMs = (localFrame / fps) * 1000;
  let lastStartedIndex = 0;

  for (let i = 0; i < wordCues.length; i++) {
    const cue = wordCues[i];
    if (cue && currentMs >= cue.startMs) {
      lastStartedIndex = i;
    }
    if (cue && currentMs >= cue.startMs && currentMs < cue.endMs) {
      return i;
    }
  }

  if (currentMs >= (wordCues[wordCues.length - 1]?.endMs ?? 0)) {
    return wordCues.length - 1;
  }

  return currentMs < (wordCues[0]?.startMs ?? 0) ? 0 : lastStartedIndex;
};

export const getCaptionWindowFromCues = ({
  wordCues,
  text,
  localFrame,
  fps,
  minWords = 3,
  maxWords = 5,
}: {
  wordCues: WordCue[];
  text?: string;
  localFrame: number;
  fps: number;
  minWords?: number;
  maxWords?: number;
}): { tokens: CaptionToken[]; activeIndex: number } => {
  if (wordCues.length === 0) {
    return { tokens: [], activeIndex: 0 };
  }

  const activeIndex = getActiveWordIndexFromCues({ wordCues, localFrame, fps });
  const displayWords = getDisplayWords(wordCues, text);
  const pages = buildSentenceAwarePages({
    words: displayWords,
    minWords,
    maxWords: Math.max(minWords, maxWords),
  });
  const activePage =
    pages.find((page) => activeIndex >= page.start && activeIndex < page.end) ??
    pages[pages.length - 1] ?? { start: 0, end: displayWords.length };

  return {
    activeIndex,
    tokens: displayWords.slice(activePage.start, activePage.end).map((word, index) => ({
      text: word,
      active: activePage.start + index === activeIndex,
    })),
  };
};

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
}): { tokens: CaptionToken[]; activeIndex: number } => {
  const words = splitWords(text);

  if (words.length === 0) {
    return { tokens: [], activeIndex: 0 };
  }

  const safeProgress = Math.max(0, Math.min(0.999999, progress));
  const activeIndex = Math.min(words.length - 1, Math.floor(safeProgress * words.length));
  const pages = buildSentenceAwarePages({
    words,
    minWords,
    maxWords: Math.max(minWords, maxWords),
  });
  const activePage =
    pages.find((page) => activeIndex >= page.start && activeIndex < page.end) ??
    pages[pages.length - 1] ?? { start: 0, end: words.length };

  return {
    activeIndex,
    tokens: words.slice(activePage.start, activePage.end).map((word, index) => ({
      text: word,
      active: activePage.start + index === activeIndex,
    })),
  };
};
