import assert from "node:assert/strict";
import test from "node:test";
import {
  buildElevenLabsTextToSpeechRequest,
  getElevenLabsApiKey,
} from "./elevenlabs";

test("getElevenLabsApiKey yêu cầu env ELEVENLABS_API_KEY", () => {
  assert.throws(
    () => getElevenLabsApiKey({}),
    /ELEVENLABS_API_KEY/,
  );
});

test("buildElevenLabsTextToSpeechRequest tạo request không lộ API key trong body", () => {
  const request = buildElevenLabsTextToSpeechRequest({
    apiKey: "secret-key",
    voiceId: "ueSxRO0nLF1bj93J2hVt",
    text: "Xin chào DeepSeek",
  });

  assert.equal(
    request.url,
    "https://api.elevenlabs.io/v1/text-to-speech/ueSxRO0nLF1bj93J2hVt",
  );
  assert.equal(request.headers["xi-api-key"], "secret-key");
  assert.equal(request.headers["Content-Type"], "application/json");
  assert.equal(request.body.text, "Xin chào DeepSeek");
  assert.equal(JSON.stringify(request.body).includes("secret-key"), false);
});
