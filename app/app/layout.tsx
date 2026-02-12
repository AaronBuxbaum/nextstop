import type { Metadata } from "next";
import { Playfair_Display, Courier_Prime } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const courierPrime = Courier_Prime({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "NextStop - AI-Powered Outing Planner",
  description: "Plan amazing outings with AI assistance, real-time collaboration, and smart event management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfairDisplay.variable} ${courierPrime.variable}`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
