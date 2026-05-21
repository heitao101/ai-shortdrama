export const CREDITS_METADATA_KEY = "credits";
export const IS_PRO_METADATA_KEY = "isPro";
/** Clerk privateMetadata — processed Stripe event keys for idempotency */
export const PROCESSED_STRIPE_EVENTS_KEY = "processedStripeEvents";

export type UserCreditsMeta = {
  credits: number;
  isPro: boolean;
};

export function parseCreditsFromMetadata(
  metadata: Record<string, unknown> | undefined
): Pick<UserCreditsMeta, "credits"> {
  const credits =
    typeof metadata?.[CREDITS_METADATA_KEY] === "number"
      ? metadata[CREDITS_METADATA_KEY]
      : 0;
  return { credits: Math.max(0, credits) };
}

export function parseCreditsMetadata(
  publicMetadata: Record<string, unknown> | undefined,
  privateMetadata?: Record<string, unknown> | undefined
): UserCreditsMeta {
  const privateCredits = parseCreditsFromMetadata(privateMetadata).credits;
  const publicCredits = parseCreditsFromMetadata(publicMetadata).credits;
  const hasPrivateCredits =
    typeof privateMetadata?.[CREDITS_METADATA_KEY] === "number";
  const credits = hasPrivateCredits ? privateCredits : publicCredits;

  const isPro =
    typeof publicMetadata?.[IS_PRO_METADATA_KEY] === "boolean"
      ? publicMetadata[IS_PRO_METADATA_KEY]
      : false;

  return { credits, isPro };
}

export function getProcessedStripeEvents(
  privateMetadata: Record<string, unknown> | undefined
): string[] {
  const raw = privateMetadata?.[PROCESSED_STRIPE_EVENTS_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}
