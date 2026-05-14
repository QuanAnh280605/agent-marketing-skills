import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEdgeTtsWordCues } from "./word-cues";

test("normalizeEdgeTtsWordCues giữ timestamp thật từ edge-tts WordBoundary", () => {
  const result = normalizeEdgeTtsWordCues([
    { text: "OpenAI", offset: 500000, duration: 1200000 },
    { text: "AWS", offset: 2100000, duration: 900000 },
  ]);

  assert.deepEqual(result, [
    { word: "OpenAI", startMs: 50, endMs: 170 },
    { word: "AWS", startMs: 210, endMs: 300 },
  ]);
});

test("normalizeEdgeTtsWordCues bỏ cue rỗng hoặc duration không hợp lệ", () => {
  const result = normalizeEdgeTtsWordCues([
    { text: "", offset: 0, duration: 1000000 },
    { text: "Cloud", offset: 1000000, duration: 0 },
    { text: "Bedrock", offset: 2000000, duration: 1100000 },
  ]);

  assert.deepEqual(result, [{ word: "Bedrock", startMs: 200, endMs: 310 }]);
});
