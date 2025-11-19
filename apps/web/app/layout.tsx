import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Rayls – Institutional Capital Protocol",
  description:
    "Institutional-grade agricultural credit origination and capital markets protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.variable, jetbrainsMono.variable, "antialiased bg-rayls-black text-white min-h-screen")}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            {children}
            <footer className="py-4 text-center text-[10px] text-rayls-grey border-t border-rayls-border mt-auto">
              Settlement via <span className="text-rayls-lime">Rayls</span> Public Chain. PII secured off-chain via Rayls Private subnet.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
