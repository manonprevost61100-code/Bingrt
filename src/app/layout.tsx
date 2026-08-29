import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingr",
  description: "Ta bobine, tout ce que tu as vu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-cream font-body">{children}</body>
    </html>
  );
}
