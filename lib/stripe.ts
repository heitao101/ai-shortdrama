import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      typescript: true,
    });
  }

  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return (
    typeof process.env.STRIPE_SECRET_KEY === "string" &&
    process.env.STRIPE_SECRET_KEY.length > 0 &&
    typeof process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === "string" &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.length > 0
  );
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
