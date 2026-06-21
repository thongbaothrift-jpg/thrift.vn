import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { PerformancePatch } from "@/components/PerformancePatch";
import { ChunkErrorCatcher } from "@/components/ChunkErrorCatcher";
import Script from "next/script";
import { getRootMetadata } from "@/lib/seo";
import "./globals.css";
import "./animations.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  return getRootMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5J6QCV8ZHY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5J6QCV8ZHY');
          `}
        </Script>
      </head>
      <body
        className={`${beVietnamPro.variable} font-sans min-h-screen flex flex-col antialiased`}
      >
        <ChunkErrorCatcher />
        <PerformancePatch />
        {children}
      </body>
    </html>
  );
}
