import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <Link href="/zh-HK" className="mt-6 text-primary hover:underline">
          Back to home
        </Link>
      </body>
    </html>
  );
}
