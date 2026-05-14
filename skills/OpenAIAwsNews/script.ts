import {
  buildOpenAIAwsNewsTimeline,
  getOpenAIAwsNewsTotalDuration,
} from "./timeline";

export type OpenAIAwsVisual =
  | {
      kind: "cloud-shift";
      from: string;
      to: string;
      label: string;
    }
  | {
      kind: "bedrock";
      services: string[];
      label: string;
    }
  | {
      kind: "market";
      players: string[];
      label: string;
    };

export type OpenAIAwsNewsScene = {
  id: string;
  kicker: string;
  headline: string;
  detail: string;
  facts: string[];
  voice: string;
  ttsVoice?: string;
  visual: OpenAIAwsVisual;
};

export const normalizeTtsPunctuation = (text: string): string => {
  return text
    .replace(/\.\s+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
};

const scenes = [
  {
    id: "hook",
    kicker: "AI CLOUD SHIFT",
    headline: "OpenAI vừa mở khóa AWS",
    detail: "Sau nhiều năm gắn chặt với Microsoft, model OpenAI chuẩn bị xuất hiện trên Amazon Bedrock.",
    facts: [
      "CNBC đưa tin OpenAI sẽ đưa model và Codex lên AWS.",
      "Dịch vụ dự kiến mở rộng cho khách hàng trong vài tuần tới.",
    ],
    voice:
      "OpenAI vừa có một nước đi rất lớn. Các mô hình của OpenAI, bao gồm cả Codex, sẽ xuất hiện trên Amazon Web Services thông qua Bedrock.",
    visual: {
      kind: "cloud-shift" as const,
      from: "MICROSOFT AZURE",
      to: "AWS BEDROCK",
      label: "EXCLUSIVE ERA ENDS",
    },
    requestedDurationSeconds: 8,
  },
  {
    id: "what-changed",
    kicker: "WHAT CHANGED",
    headline: "Không còn chỉ một đám mây",
    detail: "Thỏa thuận mới với Microsoft cho phép OpenAI chạy sản phẩm trên nhiều nhà cung cấp cloud hơn.",
    facts: [
      "OpenAI và Microsoft đã điều chỉnh lại quan hệ độc quyền.",
      "AWS giờ có thể bán quyền truy cập model OpenAI cho khách hàng doanh nghiệp.",
    ],
    voice:
      "Điểm quan trọng không chỉ là thêm một kênh phân phối. OpenAI vừa nới ràng buộc độc quyền với Microsoft, nghĩa là sản phẩm của họ có thể chạy trên nhiều cloud hơn.",
    visual: {
      kind: "market" as const,
      players: ["OpenAI", "Microsoft", "Amazon"],
      label: "MULTI-CLOUD AI",
    },
    requestedDurationSeconds: 9,
  },
  {
    id: "bedrock",
    kicker: "AWS BEDROCK",
    headline: "Bedrock có thêm vũ khí mạnh",
    detail: "Khách hàng AWS sẽ thử model OpenAI và agent viết code Codex ngay trong hệ sinh thái Amazon.",
    facts: [
      "Model OpenAI sẽ có mặt qua Amazon Bedrock.",
      "Amazon còn giới thiệu managed agents powered by OpenAI.",
    ],
    voice:
      "Với AWS, đây là cú hích lớn. Khách hàng Bedrock sẽ có thể thử mô hình OpenAI, dùng Codex để viết code, và xây agent tùy chỉnh có khả năng nhớ ngữ cảnh.",
    visual: {
      kind: "bedrock" as const,
      services: ["OpenAI models", "Codex", "Managed agents", "Memory"],
      label: "BEDROCK STACK",
    },
    requestedDurationSeconds: 9,
  },
  {
    id: "why-it-matters",
    kicker: "WHY IT MATTERS",
    headline: "Cuộc đua AI giờ là hạ tầng",
    detail: "Model tốt chưa đủ. Người thắng còn cần cloud, chip, agent runtime và khách hàng doanh nghiệp.",
    facts: [
      "Microsoft vẫn là cổ đông và đối tác lớn của OpenAI.",
      "Amazon đang tăng tốc để không bị Azure bỏ xa ở mảng AI doanh nghiệp.",
    ],
    voice:
      "Tin này cho thấy cuộc đua AI không chỉ là ai có model thông minh hơn. Đó còn là cuộc chiến hạ tầng: cloud, chip, agent runtime, và quyền tiếp cận khách hàng doanh nghiệp.",
    visual: {
      kind: "market" as const,
      players: ["Cloud", "Chips", "Agents", "Enterprise"],
      label: "AI INFRA WAR",
    },
    requestedDurationSeconds: 9,
  },
  {
    id: "takeaway",
    kicker: "TAKEAWAY",
    headline: "Một kỷ nguyên cloud AI mới",
    detail: "OpenAI có thêm lựa chọn, AWS có thêm model hàng đầu, còn doanh nghiệp có thêm đòn bẩy khi chọn nền tảng AI.",
    facts: [
      "OpenAI giảm phụ thuộc vào một cloud duy nhất.",
      "AWS bước sâu hơn vào tầng model và agent cao cấp.",
    ],
    voice:
      "Kết luận ngắn gọn: OpenAI có thêm đường ra thị trường, AWS có thêm vũ khí AI cao cấp, và cuộc cạnh tranh cloud AI sẽ căng hơn rất nhiều trong năm nay.",
    visual: {
      kind: "cloud-shift" as const,
      from: "ONE CLOUD",
      to: "AI EVERYWHERE",
      label: "THE NEW AI CLOUD MAP",
    },
    requestedDurationSeconds: 8,
  },
];

export const createOpenAIAwsNewsProps = () => {
  const preparedScenes = scenes.map((scene) => ({
    ...scene,
    ttsVoice: normalizeTtsPunctuation(scene.voice),
  }));

  return {
    title: "OpenAI x AWS",
    backgroundColor: "#050816",
    accentColor: "#ff9900",
    secondaryColor: "#7dd3fc",
    scenes: buildOpenAIAwsNewsTimeline({ scenes: preparedScenes }),
  };
};

export const getDefaultOpenAIAwsNewsDuration = (): number => {
  return getOpenAIAwsNewsTotalDuration(createOpenAIAwsNewsProps().scenes);
};

export const getOpenAIAwsNewsDurationInFrames = (
  scenes: { end: number }[],
  fps: number,
): number => {
  const maxEndSeconds = scenes.reduce((max, scene) => Math.max(max, scene.end), 0);

  return Math.max(30, Math.ceil(maxEndSeconds * fps));
};
