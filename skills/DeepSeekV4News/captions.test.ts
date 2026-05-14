import assert from "node:assert/strict";
import test from "node:test";
import {
  getCaptionProgress,
  getCaptionWindow,
  getActiveWordIndexFromCues,
  getCaptionTokenKey,
  getCaptionTokenStyle,
  getCaptionWindowFromCues,
} from "./captions";

test("getCaptionWindow chỉ hiển thị tối đa 5 từ và tối thiểu 3 từ khi đủ text", () => {
  const result = getCaptionWindow({
    text: "DeepSeek V4 Pro vừa ra mắt bản preview mới",
    progress: 0.45,
    minWords: 3,
    maxWords: 5,
  });

  assert.ok(result.tokens.length >= 3);
  assert.ok(result.tokens.length <= 5);
});

test("getCaptionWindow đánh dấu đúng từ đang được đọc trong cửa sổ hiện tại", () => {
  const result = getCaptionWindow({
    text: "một hai ba bốn năm sáu bảy tám chín mười",
    progress: 0.62,
    minWords: 3,
    maxWords: 5,
  });

  assert.deepEqual(
    result.tokens.map((token) => token.text),
    ["sáu", "bảy", "tám", "chín", "mười"],
  );
  assert.equal(result.tokens.filter((token) => token.active).length, 1);
  assert.equal(result.tokens.find((token) => token.active)?.text, "bảy");
});

test("getCaptionWindow giữ nguyên cụm hiện tại cho đến khi đọc hết cụm", () => {
  const text = "một hai ba bốn năm sáu bảy tám chín mười";
  const earlyInPage = getCaptionWindow({ text, progress: 0.12, minWords: 3, maxWords: 5 });
  const lateInPage = getCaptionWindow({ text, progress: 0.42, minWords: 3, maxWords: 5 });

  assert.deepEqual(
    earlyInPage.tokens.map((token) => token.text),
    ["một", "hai", "ba", "bốn", "năm"],
  );
  assert.deepEqual(
    lateInPage.tokens.map((token) => token.text),
    ["một", "hai", "ba", "bốn", "năm"],
  );
  assert.equal(earlyInPage.tokens.find((token) => token.active)?.text, "hai");
  assert.equal(lateInPage.tokens.find((token) => token.active)?.text, "năm");
});

test("getCaptionProgress ưu tiên voiceDurationSeconds để đồng bộ highlight với audio", () => {
  assert.equal(
    getCaptionProgress({
      localFrame: 150,
      fps: 30,
      durationSeconds: 10,
      voiceDurationSeconds: 5,
    }),
    1,
  );
});

test("getActiveWordIndexFromCues trả về đúng index theo timestamp thực", () => {
  const wordCues = [
    { word: "Xin", startMs: 100, endMs: 500 },
    { word: "chào", startMs: 500, endMs: 900 },
    { word: "thế", startMs: 900, endMs: 1300 },
    { word: "giới", startMs: 1300, endMs: 1700 },
  ];

  assert.equal(getActiveWordIndexFromCues({ wordCues, localFrame: 0, fps: 30 }), 0);
  assert.equal(getActiveWordIndexFromCues({ wordCues, localFrame: 15, fps: 30 }), 1);
  assert.equal(getActiveWordIndexFromCues({ wordCues, localFrame: 30, fps: 30 }), 2);
  assert.equal(getActiveWordIndexFromCues({ wordCues, localFrame: 45, fps: 30 }), 3);
});

test("getActiveWordIndexFromCues clamp về cuối khi vượt duration", () => {
  const wordCues = [
    { word: "A", startMs: 100, endMs: 500 },
    { word: "B", startMs: 500, endMs: 900 },
  ];

  assert.equal(getActiveWordIndexFromCues({ wordCues, localFrame: 120, fps: 30 }), 1);
});

test("getActiveWordIndexFromCues trả 0 khi chưa đến cue đầu tiên", () => {
  const wordCues = [
    { word: "A", startMs: 500, endMs: 900 },
    { word: "B", startMs: 900, endMs: 1300 },
  ];

  assert.equal(getActiveWordIndexFromCues({ wordCues, localFrame: 0, fps: 30 }), 0);
});

test("getActiveWordIndexFromCues giữ từ vừa đọc khi đang ở gap giữa cues", () => {
  const wordCues = [
    { word: "A", startMs: 100, endMs: 500 },
    { word: "B", startMs: 900, endMs: 1200 },
    { word: "C", startMs: 1500, endMs: 1800 },
  ];

  assert.equal(getActiveWordIndexFromCues({ wordCues, localFrame: 40, fps: 30 }), 1);
});

test("getCaptionWindowFromCues dùng wordCues để hiển thị đúng từ theo timestamp", () => {
  const wordCues = [
    { word: "DeepSeek", startMs: 100, endMs: 500 },
    { word: "V4", startMs: 500, endMs: 800 },
    { word: "Pro", startMs: 800, endMs: 1200 },
    { word: "vừa", startMs: 1200, endMs: 1500 },
    { word: "ra", startMs: 1500, endMs: 1800 },
    { word: "mắt", startMs: 1800, endMs: 2100 },
  ];

  const result = getCaptionWindowFromCues({ wordCues, localFrame: 30, fps: 30 });
  assert.ok(result.tokens.length >= 3);
  assert.ok(result.tokens.length <= 5);

  const activeToken = result.tokens.find((t) => t.active);
  assert.equal(activeToken?.text, "Pro");
});

test("getCaptionWindowFromCues fallback khi không có wordCues", () => {
  const result = getCaptionWindowFromCues({
    wordCues: [],
    localFrame: 30,
    fps: 30,
  });

  assert.deepEqual(result.tokens, []);
  assert.equal(result.activeIndex, 0);
});

test("getCaptionWindowFromCues không ghép cuối câu trước với đầu câu sau", () => {
  const wordCues = [
    { word: "OpenAI", startMs: 0, endMs: 300 },
    { word: "lên", startMs: 300, endMs: 600 },
    { word: "AWS", startMs: 600, endMs: 900 },
    { word: "Microsoft", startMs: 1200, endMs: 1500 },
    { word: "vẫn", startMs: 1500, endMs: 1800 },
    { word: "rất", startMs: 1800, endMs: 2100 },
    { word: "quan", startMs: 2100, endMs: 2400 },
    { word: "trọng", startMs: 2400, endMs: 2700 },
  ];

  const endOfSentence = getCaptionWindowFromCues({
    wordCues,
    text: "OpenAI lên AWS. Microsoft vẫn rất quan trọng.",
    localFrame: 25,
    fps: 30,
  });
  const startOfNextSentence = getCaptionWindowFromCues({
    wordCues,
    text: "OpenAI lên AWS. Microsoft vẫn rất quan trọng.",
    localFrame: 40,
    fps: 30,
  });

  assert.deepEqual(
    endOfSentence.tokens.map((token) => token.text),
    ["OpenAI", "lên", "AWS."],
  );
  assert.deepEqual(
    startOfNextSentence.tokens.map((token) => token.text),
    ["Microsoft", "vẫn", "rất", "quan", "trọng."],
  );
});

test("caption token key ổn định khi activeIndex thay đổi", () => {
  assert.equal(getCaptionTokenKey("hook", 2), "hook-caption-2");
});

test("caption active style không dùng scale để tránh nhảy layout", () => {
  const style = getCaptionTokenStyle(true);

  assert.equal(style.transform, undefined);
  assert.match(String(style.color), /#facc15/i);
});
