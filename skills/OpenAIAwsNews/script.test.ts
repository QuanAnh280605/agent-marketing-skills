import assert from "node:assert/strict";
import test from "node:test";
import {
  createOpenAIAwsNewsProps,
  getDefaultOpenAIAwsNewsDuration,
  getOpenAIAwsNewsDurationInFrames,
  normalizeTtsPunctuation,
} from "./script";

test("OpenAI AWS news props cover the Bedrock distribution story", () => {
  const props = createOpenAIAwsNewsProps();

  assert.equal(props.scenes.length, 5);
  assert.ok(getDefaultOpenAIAwsNewsDuration() >= 40);

  const bedrockScene = props.scenes.find((scene) => scene.id === "bedrock");
  assert.ok(bedrockScene, "missing Bedrock scene");
  assert.equal(bedrockScene?.visual.kind, "bedrock");
  assert.match(bedrockScene?.voice ?? "", /AWS|Bedrock|Codex/i);
});

test("OpenAI AWS duration frame count follows generated scene end", () => {
  const props = createOpenAIAwsNewsProps();
  const lastScene = props.scenes[props.scenes.length - 1]!;
  const extendedScenes = props.scenes.map((scene) =>
    scene.id === lastScene.id ? { ...scene, end: 48.4, duration: 9.2 } : scene,
  );

  assert.equal(getOpenAIAwsNewsDurationInFrames(extendedScenes, 30), 1452);
});

test("normalizeTtsPunctuation giảm pause dấu chấm phẩy nhưng giữ số từ", () => {
  const captionText = "OpenAI vừa có một nước đi rất lớn. Các mô hình của OpenAI, bao gồm cả Codex, sẽ xuất hiện.";
  const ttsText = normalizeTtsPunctuation(captionText);

  assert.equal(ttsText, "OpenAI vừa có một nước đi rất lớn, Các mô hình của OpenAI, bao gồm cả Codex, sẽ xuất hiện.");
  assert.equal(ttsText.split(/\s+/).length, captionText.split(/\s+/).length);
  assert.doesNotMatch(ttsText, /lớn\.\s+Các/);
  assert.match(ttsText, /OpenAI,\s+bao/);
});

test("createOpenAIAwsNewsProps giữ caption có dấu câu và thêm text TTS nhẹ dấu", () => {
  const props = createOpenAIAwsNewsProps();
  const hook = props.scenes.find((scene) => scene.id === "hook");

  assert.ok(hook);
  assert.match(hook.voice, /lớn\. Các/);
  assert.doesNotMatch(hook.ttsVoice ?? "", /lớn\. Các/);
  assert.equal(hook.ttsVoice?.split(/\s+/).length, hook.voice.split(/\s+/).length);
});
