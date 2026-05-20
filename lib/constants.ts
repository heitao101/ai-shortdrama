export const DRAMA_STYLES = [
  { id: "anime", icon: "🎌" },
  { id: "realistic", icon: "📷" },
  { id: "hongkong", icon: "🌃" },
  { id: "cinematic", icon: "🎬" },
  { id: "fantasy", icon: "✨" },
  { id: "noir", icon: "🌙" },
] as const;

export type DramaStyleId = (typeof DRAMA_STYLES)[number]["id"];

export const MAX_REFERENCE_IMAGES = 6;
export const MAX_STORY_LENGTH = 10000;
