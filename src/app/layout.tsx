import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Sora } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import { TrakteerWidget } from "@/components/trakteer-widget";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "SIMPAN — Sistem Manajemen Panti Asuhan Nurul Iman",
  description:
    "Sistem manajemen panti asuhan untuk anak yatim piatu: kebutuhan dasar, perlindungan, dan donasi.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${manrope.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <ToastProvider>
          {children}
          <TrakteerWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
