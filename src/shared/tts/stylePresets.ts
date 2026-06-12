export interface StylePreset {
  id: string;
  name: string;
  instruction: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "calm-audiobook",
    name: "Calm Audiobook",
    instruction:
      "Read like a calm, premium audiobook narrator. Use natural pacing, warm tone, subtle emotion, and clear pronunciation. Do not overact."
  },
  {
    id: "energetic-podcast-host",
    name: "Energetic Podcast Host",
    instruction:
      "Read like an engaging podcast host. Conversational, lively, clear, and friendly. Keep the energy up without sounding fake."
  },
  {
    id: "documentary-narrator",
    name: "Documentary Narrator",
    instruction:
      "Read like a thoughtful documentary narrator. Measured, intelligent, cinematic, and composed."
  },
  {
    id: "news-anchor",
    name: "News Anchor",
    instruction:
      "Read like a polished news anchor. Crisp diction, neutral authority, steady pacing, and minimal emotion."
  },
  {
    id: "cozy-bedtime",
    name: "Cozy Bedtime",
    instruction:
      "Read in a soft, cozy bedtime-story style. Gentle, relaxed, warm, and slow. Avoid sudden intensity."
  },
  {
    id: "deadpan-internet-commentator",
    name: "Deadpan Internet Commentator",
    instruction:
      "Read with dry, deadpan delivery. Subtle comedic timing, understated sarcasm where appropriate, but keep it natural."
  },
  {
    id: "dramatic-storyteller",
    name: "Dramatic Storyteller",
    instruction:
      "Read like a dramatic storyteller. Add tension, pacing variation, and emotion, but avoid cartoonish exaggeration."
  },
  {
    id: "study-mode",
    name: "Study Mode",
    instruction:
      "Read clearly for focused studying. Neutral, precise, slightly slower than normal, with emphasis on important terms."
  },
  {
    id: "custom",
    name: "Custom",
    instruction: ""
  }
];

export function resolveStyleInstruction(stylePresetId: string, customInstruction: string): string {
  if (stylePresetId === "custom") {
    return customInstruction.trim();
  }
  return STYLE_PRESETS.find((preset) => preset.id === stylePresetId)?.instruction ?? STYLE_PRESETS[0].instruction;
}
