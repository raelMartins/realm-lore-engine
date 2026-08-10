import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";

const trackingSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Visit tracking · Realm Lore Engine",
  robots: { index: false, follow: false },
};

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${trackingSans.className} tracking-ui antialiased`}>
      {children}
    </div>
  );
}
