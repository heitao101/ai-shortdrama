import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * next-intl middleware — ONLY for page routes.
 * API routes (/api/*) are excluded via config.matcher below.
 */
const intlMiddleware = createIntlMiddleware(routing);

/** Page routes that do not require sign-in */
const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
]);

/**
 * Middleware runs ONLY on app pages (see config.matcher).
 * /api/* is never matched — no Clerk redirect, no next-intl locale redirect.
 */
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return intlMiddleware(request);
});

export const config = {
  /**
   * Explicit allowlist: localized pages + home.
   * Deliberately omits /api, /trpc, /_next, static files.
   */
  matcher: ["/", "/(zh-CN|zh-HK|en)(/.*)?"],
};
