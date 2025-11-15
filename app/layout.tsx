import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chromacitiy",
  description: "A Next.js app with TensorFlow, Three.js, and Phaser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

