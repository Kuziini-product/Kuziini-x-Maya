import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { AmbientSound } from "@/components/layout/AmbientSound";
import { BadgeUpdater } from "@/components/layout/BadgeUpdater";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "Kuziini x Maya",
  description: "Comanda direct de la sezlong - Kuziini x Maya Mamaia Nord",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kuziini",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-cream antialiased">
        <ServiceWorkerRegister />
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
        <InstallPrompt />
        <AmbientSound />
        <BadgeUpdater />
      </body>
    </html>
  );
}

