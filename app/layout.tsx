import PWAInstallPrompt from "@/components/pwa-install-prompt";
import PWAiOSPrompt from "@/components/pwa-ios-prompt";
import PWARegister from "@/components/pwa-register";
import AuthSessionProvider from "@/components/session-provider";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DellClips",
  description: "Short-form video for Dell employees",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DellClips",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0672CB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // ← This is critical for safe-area-inset to work
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DellClips" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <AuthSessionProvider>
          <PWARegister />
          <PWAInstallPrompt />
          <PWAiOSPrompt />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
