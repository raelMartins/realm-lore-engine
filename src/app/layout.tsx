import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cinzel, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Realm Lore Engine",
  description:
    "An interactive spatial lore codex for world-building, TTRPG, and creative tech.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${cinzel.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" as="image" href="/maps/realm-map.png" />
      </head>
      <body className="flex min-h-dvh flex-col font-sans overscroll-none">
        {children}
      </body>
    </html>
  );
}
