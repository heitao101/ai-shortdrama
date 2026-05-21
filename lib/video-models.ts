/** AI Gateway video models (Vercel AI SDK) */
export const KLING_T2V = "klingai/kling-v3.0-t2v";
export const KLING_I2V = "klingai/kling-v3.0-i2v";
export const SEEDANCE_LITE_I2V = "bytedance/seedance-v1.0-lite-i2v";

export type VideoModelId =
  | typeof KLING_T2V
  | typeof KLING_I2V
  | typeof SEEDANCE_LITE_I2V;

export const DEFAULT_VIDEO_DURATION = 5;
export const DEFAULT_ASPECT_RATIO = "9:16" as const;
