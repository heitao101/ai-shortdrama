import {
  DEFAULT_VIDEO_DURATION,
  isVideoDurationSeconds,
  type VideoDurationSeconds,
} from "@/lib/video-duration";

/** Credits charged per video length. */
export const CREDIT_COST_BY_DURATION: Record<VideoDurationSeconds, number> = {
  5: 20,
  10: 35,
  15: 50,
  30: 90,
};

export function getCreditCostForDuration(
  duration: VideoDurationSeconds
): number {
  return CREDIT_COST_BY_DURATION[duration];
}

export function getCreditCostForDurationValue(duration: number): number {
  if (!isVideoDurationSeconds(duration)) {
    return CREDIT_COST_BY_DURATION[DEFAULT_VIDEO_DURATION];
  }
  return getCreditCostForDuration(duration);
}

/** @deprecated Use getCreditCostForDuration — kept for imports that expect a single constant */
export const VIDEO_GENERATION_CREDIT_COST =
  CREDIT_COST_BY_DURATION[DEFAULT_VIDEO_DURATION];
