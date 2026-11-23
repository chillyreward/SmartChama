// app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import dynamic from 'next/dynamic';
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";

const ChatBot = dynamic(() => import('@/components/ChatBot').then(mod => ({ default: mod.ChatBot })));

// Self-hosted so builds never depend on reaching Google Fonts.
const onest = localFont({
  src: "../fonts/onest-latin-wght-normal.woff2",
  variable: "--font-onest",
  weight: "100 900",
  display: "swap",
});
const newsreader = localFont({
  src: [
    { path: "../fonts/newsreader-latin-opsz-normal.woff2", style: "normal" },
    { path: "../fonts/newsreader-latin-opsz-italic.woff2", style: "italic" },
  ],
  variable: "--font-newsreader",
  weight: "200 800",
  display: "swap",
});
const jetbrains = localFont({
  src: "../fonts/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartchama.vercel.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E4EEE6' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1F18' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Akibora',
    template: '%s | Akibora'
  },
  description: 'Akibora keeps a chama\'s contributions, merry-go-round and welfare fund in one shared record, paid over M-Pesa.',
  alternates: {
    canonical: SITE_URL,
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Akibora',
    startupImage: [
      '/web-app-manifest-512x512.png'
    ]
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: 'Akibora',
    title: 'Akibora',
    description: 'Digital savings management for African savings groups.'
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' }
    ]
  }
}

// Client side unhandled rejection logic
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      console.error(
        'Unhandled promise rejection:',
        event.reason
      );
    }
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apple PWA specific */}
        <meta 
          name="apple-mobile-web-app-capable" 
          content="yes" 
        />
        <meta 
          name="apple-mobile-web-app-status-bar-style" 
          content="black-translucent" 
        />
        <meta 
          name="apple-mobile-web-app-title" 
          content="Akibora" 
        />
        <meta 
          name="msapplication-tap-highlight" 
          content="no" 
        />

        {/* Prevent phone number detection */}
        <meta 
          name="format-detection" 
          content="telephone=no" 
        />
      </head>
      <body className={`${onest.variable} ${newsreader.variable} ${jetbrains.variable} font-sans antialiased bg-page text-ink`}>
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <ChatBot />
              <InstallPrompt />
              <OfflineBanner />
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}