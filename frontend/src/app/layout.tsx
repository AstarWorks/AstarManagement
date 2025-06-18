import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from '@/providers/QueryProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { ServiceWorkerProvider } from '@/providers/ServiceWorkerProvider'
import { ErrorToastProvider } from '@/components/providers/ErrorToastProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { OfflineDetector } from '@/components/error/OfflineDetector'

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
        <ErrorBoundary>
          <ServiceWorkerProvider>
            <QueryProvider>
              <ToastProvider>
                <ErrorToastProvider>
                  <OfflineDetector>
                    {children}
                  </OfflineDetector>
                </ErrorToastProvider>
              </ToastProvider>
            </QueryProvider>
          </ServiceWorkerProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
