import type { Metadata } from "next";
import { Montserrat, Silkscreen } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Senimatik | Verified Creator Licensing Marketplace",
  description: "Secure, verifiable licensing for digital art. Buy usage rights directly from verified creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${silkscreen.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="bottom-right" theme="light" richColors />
        </Providers>
      </body>
    </html>
  );
}
