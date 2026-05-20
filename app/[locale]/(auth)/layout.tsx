import { SiteHeader } from "@/components/header/site-header";

type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="page-canvas">
      <SiteHeader />

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-14">
        {children}
      </main>
    </div>
  );
}
