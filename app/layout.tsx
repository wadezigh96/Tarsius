import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarsius — Personal Crypto Agent",
  description: "A safety-first AI agent for BNB Chain, Solana and Robinhood Crypto."
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}