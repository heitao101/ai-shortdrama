/** Supported Kling video lengths (seconds). */
export const VIDEO_DURATION_OPTIONS = [5, 10, 15, 30] as const;

export type VideoDurationSeconds = (typeof VIDEO_DURATION_OPTIONS)[number];

export const DEFAULT_VIDEO_DURATION: VideoDurationSeconds = 10;

export function isVideoDurationSeconds(
  value: number
): value is VideoDurationSeconds {
  return (VIDEO_DURATION_OPTIONS as readonly number[]).includes(value);
}

export function parseVideoDuration(value: unknown): VideoDurationSeconds | undefined {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(n) && isVideoDurationSeconds(n) ? n : undefined;
}
