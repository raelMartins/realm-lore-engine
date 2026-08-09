import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visit tracking · Realm Lore Engine",
  robots: { index: false, follow: false },
};

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
