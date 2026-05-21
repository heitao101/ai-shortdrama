/** Kling official API model IDs (@ai-sdk/klingai) */
export const KLING_T2V = "kling-v2.6-t2v";
export const KLING_I2V = "kling-v2.6-i2v";

export type VideoModelId = typeof KLING_T2V | typeof KLING_I2V;

export const DEFAULT_VIDEO_DURATION = 5;
export const DEFAULT_ASPECT_RATIO = "9:16" as const;
