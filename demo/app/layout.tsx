import type { ReactNode } from "react";

export const metadata = {
  title: "Sycle Agentic Toolkit Demo",
  description: "Minimal Next.js demo for the sycle-agentic-toolkit.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
