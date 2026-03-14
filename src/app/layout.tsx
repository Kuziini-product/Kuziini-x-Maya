import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

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
  title: "Kuziini × LOFT",
  description: "Comandă direct de la șezlong",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#0f0f0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-cream antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
