import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from '@/providers/QueryProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { ServiceWorkerProvider } from '@/providers/ServiceWorkerProvider'
import { ErrorToastProvider } from '@/components/providers/ErrorToastProvider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aster Management - Mobile Kanban Board",
  description: "Legal matter management system with mobile-optimized Kanban board",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aster Management"
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerProvider>
          <QueryProvider>
            <ToastProvider>
              <ErrorToastProvider>
                {children}
              </ErrorToastProvider>
            </ToastProvider>
          </QueryProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
