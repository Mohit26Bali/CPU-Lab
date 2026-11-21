import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headings and small captions only: the engineering-document voice of the Datasheet look
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const title = "CPU Lab — Learn how modern processors actually execute code";
const description =
  "An interactive, cycle-accurate simulation of modern processors: pipelines, hazards, caches, branch prediction, and out-of-order execution.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s — CPU Lab",
  },
  description,
  keywords: [
    "computer architecture",
    "CPU simulator",
    "pipelining",
    "cache",
    "branch prediction",
    "out-of-order execution",
    "computer science education",
  ],
  openGraph: {
    title,
    description,
    siteName: "CPU Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plex.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
