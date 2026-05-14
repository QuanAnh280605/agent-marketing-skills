import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEdgeWordBoundaries } from "./edge-word-cues";

test("normalizeEdgeWordBoundaries đổi Edge ticks sang milliseconds", () => {
  const cues = normalizeEdgeWordBoundaries([
    { text: "DeepSeek", offset: 1_500_000, duration: 300_000 },
  ]);

  assert.deepEqual(cues, [
    { word: "DeepSeek", startMs: 150, endMs: 180 },
  ]);
});

test("normalizeEdgeWordBoundaries bỏ empty và zero-duration boundaries", () => {
  const cues = normalizeEdgeWordBoundaries([
    { text: " ", offset: 0, duration: 300_000 },
    { text: "V4", offset: 300_000, duration: 0 },
    { text: "Pro", offset: 500_000, duration: 200_000 },
  ]);

  assert.deepEqual(cues, [{ word: "Pro", startMs: 50, endMs: 70 }]);
});
