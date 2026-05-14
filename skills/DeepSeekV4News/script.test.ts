import assert from "node:assert/strict";
import test from "node:test";
import {
  DEEPSEEK_BENCHMARK_ASSETS,
  createDeepSeekV4NewsProps,
  getDefaultDeepSeekV4NewsDuration,
  getDeepSeekV4NewsDurationInFrames,
} from "./script";

test("DeepSeek V4 news props include benchmark evidence scenes", () => {
  const props = createDeepSeekV4NewsProps();

  assert.equal(props.scenes.length, 6);
  assert.ok(getDefaultDeepSeekV4NewsDuration() > 40);

  const benchmarkScene = props.scenes.find((scene) => scene.id === "benchmark-pro");
  assert.ok(benchmarkScene, "missing benchmark scene");
  assert.equal(benchmarkScene?.visual.kind, "benchmark");
  assert.equal(
    benchmarkScene?.visual.src,
    "generated/deepseek-v4-news/v4-benchmark.png",
  );
  assert.match(benchmarkScene?.voice ?? "", /benchmark|Coding|Math/i);
});

test("DeepSeek benchmark assets point to official DeepSeek docs images", () => {
  assert.deepEqual(
    DEEPSEEK_BENCHMARK_ASSETS.map((asset) => asset.fileName),
    ["v4-benchmark.png", "v4-benchmark-2.png", "v4-efficiency.png"],
  );

  for (const asset of DEEPSEEK_BENCHMARK_ASSETS) {
    assert.match(asset.remoteUrl, /^https:\/\/api-docs\.deepseek\.com\/img\/v4-/);
    assert.equal(asset.localPath.startsWith("generated/deepseek-v4-news/"), true);
  }
});

test("DeepSeek duration frame count follows the longest generated scene end", () => {
  const props = createDeepSeekV4NewsProps();
  const lastScene = props.scenes[props.scenes.length - 1]!;
  const extendedScenes = props.scenes.map((scene) =>
    scene.id === lastScene.id ? { ...scene, end: 64.584, duration: 11.388 } : scene,
  );

  assert.equal(getDeepSeekV4NewsDurationInFrames(extendedScenes, 30), 1938);
});
