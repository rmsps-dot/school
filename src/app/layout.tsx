import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RMSPS — Residential Maa Saraswati Public School",
  description:
    "A premier residential school delivering academic excellence, holistic development, and a nurturing environment for future leaders.",
  keywords: "RMSPS, Maa Saraswati, school, residential school, education, admission",
  openGraph: {
    title: "RMSPS — Residential Maa Saraswati Public School",
    description:
      "A premier residential school delivering academic excellence and holistic development.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-body">{children}</body>
    </html>
  );
}
