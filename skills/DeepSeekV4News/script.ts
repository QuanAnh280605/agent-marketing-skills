import {
  buildDeepSeekV4NewsTimeline,
  getDeepSeekV4NewsTotalDuration,
} from "./timeline";

export type DeepSeekVisual =
  | {
      kind: "metric";
      label: string;
      value: string;
      secondary: string;
    }
  | {
      kind: "benchmark";
      src: string;
      caption: string;
    }
  | {
      kind: "api";
      models: string[];
    };

export type DeepSeekV4NewsScene = {
  id: string;
  kicker: string;
  headline: string;
  detail: string;
  facts: string[];
  voice: string;
  visual: DeepSeekVisual;
};

export type DeepSeekBenchmarkAsset = {
  fileName: string;
  remoteUrl: string;
  localPath: string;
};

export const DEEPSEEK_BENCHMARK_ASSETS: DeepSeekBenchmarkAsset[] = [
  {
    fileName: "v4-benchmark.png",
    remoteUrl: "https://api-docs.deepseek.com/img/v4-benchmark.png",
    localPath: "generated/deepseek-v4-news/v4-benchmark.png",
  },
  {
    fileName: "v4-benchmark-2.png",
    remoteUrl: "https://api-docs.deepseek.com/img/v4-benchmark-2.png",
    localPath: "generated/deepseek-v4-news/v4-benchmark-2.png",
  },
  {
    fileName: "v4-efficiency.png",
    remoteUrl: "https://api-docs.deepseek.com/img/v4-efficiency.png",
    localPath: "generated/deepseek-v4-news/v4-efficiency.png",
  },
];

const scenes = [
  {
    id: "hook",
    kicker: "BREAKING AI",
    headline: "DeepSeek V4-Pro vừa ra mắt",
    detail: "Một preview open-source mới kéo cuộc đua model lớn nóng trở lại.",
    facts: [
      "Ra mắt chính thức trên DeepSeek API Docs ngày 24/04/2026.",
      "Có thể thử qua Expert Mode hoặc Instant Mode trên chat.deepseek.com.",
    ],
    voice:
      "DeepSeek V4 Pro vừa ra mắt bản preview, và đây có thể là một trong những bản phát hành open-source đáng chú ý nhất của năm.",
    visual: {
      kind: "metric" as const,
      label: "NEW MODEL",
      value: "V4-Pro",
      secondary: "Open weights preview",
    },
    requestedDurationSeconds: 8,
  },
  {
    id: "specs",
    kicker: "MODEL SPECS",
    headline: "1.6T tổng tham số, 49B active",
    detail: "V4-Pro dùng kiến trúc MoE, chỉ kích hoạt một phần tham số cho mỗi token.",
    facts: [
      "DeepSeek-V4-Pro: 1.6T total / 49B active params.",
      "DeepSeek-V4-Flash: 284B total / 13B active params.",
    ],
    voice:
      "Điểm gây chú ý đầu tiên là thông số. DeepSeek nói V4 Pro có 1 phẩy 6 nghìn tỷ tham số tổng, nhưng mỗi token chỉ dùng 49 tỷ tham số active.",
    visual: {
      kind: "metric" as const,
      label: "PARAMETERS",
      value: "1.6T",
      secondary: "49B active per token",
    },
    requestedDurationSeconds: 8,
  },
  {
    id: "benchmark-pro",
    kicker: "BENCHMARK EVIDENCE",
    headline: "Benchmark là phần đáng nhìn nhất",
    detail: "DeepSeek tuyên bố V4-Pro dẫn đầu nhóm open model ở Math, STEM và Coding.",
    facts: [
      "Open-source SOTA trong nhiều benchmark agentic coding.",
      "World knowledge chỉ xếp sau Gemini-3.1-Pro theo công bố của DeepSeek.",
    ],
    voice:
      "Phần benchmark mới là điểm đáng nhìn. Theo công bố của DeepSeek, V4 Pro vượt các model mở hiện tại ở Math, STEM, Coding và cạnh tranh sát các model đóng hàng đầu.",
    visual: {
      kind: "benchmark" as const,
      src: "generated/deepseek-v4-news/v4-benchmark.png",
      caption: "Official DeepSeek V4-Pro benchmark",
    },
    requestedDurationSeconds: 9,
  },
  {
    id: "benchmark-flash",
    kicker: "FLASH MODE",
    headline: "V4-Flash nhắm vào tốc độ và chi phí",
    detail: "Bản Flash nhỏ hơn, nhanh hơn, nhưng vẫn tiến gần V4-Pro ở nhiều tác vụ đơn giản.",
    facts: [
      "284B total / 13B active params.",
      "Được định vị cho workload nhiều request và cần tiết kiệm chi phí.",
    ],
    voice:
      "Ngoài Pro, DeepSeek còn có V4 Flash. Bản này nhỏ hơn, nhanh hơn, rẻ hơn, và được DeepSeek mô tả là vẫn tiến gần V4 Pro trong nhiều tác vụ agent đơn giản.",
    visual: {
      kind: "benchmark" as const,
      src: "generated/deepseek-v4-news/v4-benchmark-2.png",
      caption: "V4-Flash comparison from official docs",
    },
    requestedDurationSeconds: 8,
  },
  {
    id: "context",
    kicker: "1M CONTEXT",
    headline: "1 triệu token context trở thành mặc định",
    detail: "Token-wise compression + DeepSeek Sparse Attention giúp giảm chi phí long-context.",
    facts: [
      "DeepSeek gọi đây là kỷ nguyên cost-effective 1M context.",
      "1M context có mặt trên các dịch vụ chính thức của DeepSeek.",
    ],
    voice:
      "Điểm chiến lược nhất là context một triệu token. DeepSeek nói họ dùng token wise compression và DeepSeek Sparse Attention để làm long context thực tế hơn ở quy mô lớn.",
    visual: {
      kind: "benchmark" as const,
      src: "generated/deepseek-v4-news/v4-efficiency.png",
      caption: "Official efficiency chart",
    },
    requestedDurationSeconds: 8,
  },
  {
    id: "api",
    kicker: "TRY IT NOW",
    headline: "API đã mở, chỉ cần đổi model name",
    detail: "DeepSeek giữ base URL, hỗ trợ OpenAI ChatCompletions và Anthropic API.",
    facts: [
      "Model: deepseek-v4-pro hoặc deepseek-v4-flash.",
      "Hỗ trợ Thinking và Non-Thinking mode.",
    ],
    voice:
      "Nếu bạn dùng API, DeepSeek nói chỉ cần giữ base URL và đổi model sang deepseek v4 pro hoặc deepseek v4 flash. Cả hai đều hỗ trợ thinking và non thinking mode.",
    visual: {
      kind: "api" as const,
      models: ["deepseek-v4-pro", "deepseek-v4-flash"],
    },
    requestedDurationSeconds: 8,
  },
];

export const createDeepSeekV4NewsProps = () => {
  return {
    title: "DeepSeek V4 Preview",
    backgroundColor: "#030712",
    accentColor: "#22d3ee",
    scenes: buildDeepSeekV4NewsTimeline({ scenes }),
  };
};

export const getDefaultDeepSeekV4NewsDuration = (): number => {
  return getDeepSeekV4NewsTotalDuration(createDeepSeekV4NewsProps().scenes);
};

export const getDeepSeekV4NewsDurationInFrames = (
  scenes: { end: number }[],
  fps: number,
): number => {
  const maxEndSeconds = scenes.reduce((max, scene) => Math.max(max, scene.end), 0);

  return Math.max(30, Math.ceil(maxEndSeconds * fps));
};
