import localFont from "next/font/local";
import { LanguageProvider } from "@/components/language-context";
import { PlayerProvider } from "@/components/player-context";
import "./globals.css";

const outfit = localFont({
  src: "./fonts/outfit-latin.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "300 700",
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "400 600",
});

export const metadata = {
  metadataBase: new URL("https://dancefm.radio"),
  title: {
    default: "danceFM — Nonstop dance radio",
    template: "%s · danceFM",
  },
  description:
    "danceFM is your round-the-clock dance music station. Listen live, check the weekly programme and catch up on the latest from DJ Mag.",
  keywords: [
    "danceFM",
    "dance radio",
    "house",
    "techno",
    "electronic music",
    "live stream",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "danceFM — Nonstop dance radio",
    description:
      "House, techno and melodic grooves, streaming live, 24 hours a day.",
    type: "website",
    images: [{ url: "/brand/banner.webp", width: 1920, height: 1080 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "danceFM — Nonstop dance radio",
    description: "House, techno and melodic grooves, live 24/7.",
    images: ["/brand/banner.webp"],
  },
};

export const viewport = {
  themeColor: "#060608",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <LanguageProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
