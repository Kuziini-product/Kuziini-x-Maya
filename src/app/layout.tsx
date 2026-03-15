import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
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

export const metadata: Metadata = {
  title: "Kuziini x LOFT",
  description: "Comanda direct de la sezlong - Kuziini x LOFT Mamaia Nord",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#0A0A0A",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-cream antialiased">
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
        <InstallPrompt />
        <AmbientSound />
        <BadgeUpdater />
      </body>
    </html>
  );
}
