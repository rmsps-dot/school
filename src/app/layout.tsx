import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0B10",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rmsps.vercel.app"),
  title: "RMSPS — Residential Maa Saraswati Public School",
  description:
    "Residential Maa Saraswati Public School (RMSPS) is a premier BSEB-affiliated residential institution in Bihar, delivering holistic education and leadership.",
  keywords: "RMSPS, Maa Saraswati, school, residential school, education, admission, BSEB Bihar, RMS Public School",
  verification: {
    google: "hlRuq76hobi9HME8SpSlOu0ybtEOYmTxMwin9y5c1qU",
  },
  openGraph: {
    title: "RMSPS — Residential Maa Saraswati Public School",
    description:
      "Residential Maa Saraswati Public School (RMSPS) is a premier BSEB-affiliated residential institution in Bihar, delivering holistic education and leadership.",
    type: "website",
    url: "https://rmsps.vercel.app",
    siteName: "RMSPS",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "School",
  "name": "Residential Maa Saraswati Public School",
  "alternateName": "RMSPS",
  "url": "https://rmsps.vercel.app",
  "logo": "https://rmsps.vercel.app/icon-192.png",
  "image": "https://rmsps.vercel.app/opengraph-image",
  "description":
    "Residential Maa Saraswati Public School (RMSPS) is a premier BSEB-affiliated residential institution in Bihar, delivering holistic education and leadership.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kating Chowk, Maheshpur road",
    "addressLocality": "Pipra",
    "addressRegion": "Bihar",
    "postalCode": "852109",
    "addressCountry": "IN",
  },
  "telephone": "+919546536279",
  "email": "srzsurazzrajput@gmail.com",
  "sameAs": [
    "https://rmsps.vercel.app",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased font-body">{children}</body>
    </html>
  );
}
