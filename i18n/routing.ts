import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh-CN", "zh-HK", "en"],
  defaultLocale: "zh-HK",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
