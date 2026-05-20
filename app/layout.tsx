import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

// Root layout — locale-specific layout in app/[locale]/layout.tsx
export default function RootLayout({ children }: Props) {
  return children;
}
