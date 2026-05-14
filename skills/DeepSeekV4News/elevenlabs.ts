export type ElevenLabsEnv = {
  ELEVENLABS_API_KEY?: string;
};

export type ElevenLabsRequest = {
  url: string;
  headers: Record<string, string>;
  body: {
    text: string;
    model_id: string;
    voice_settings: {
      stability: number;
      similarity_boost: number;
      style: number;
      use_speaker_boost: boolean;
    };
  };
};

export const getElevenLabsApiKey = (env: ElevenLabsEnv = process.env): string => {
  const apiKey = env.ELEVENLABS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Thiếu ELEVENLABS_API_KEY để gọi ElevenLabs Text to Speech");
  }

  return apiKey;
};

export const buildElevenLabsTextToSpeechRequest = ({
  apiKey,
  voiceId,
  text,
}: {
  apiKey: string;
  voiceId: string;
  text: string;
}): ElevenLabsRequest => ({
  url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
    Accept: "audio/mpeg",
  },
  body: {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true,
    },
  },
});
