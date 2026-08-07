// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import dynamic from 'next/dynamic';
import LoadingScreen from "@/components/LoadingScreen";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";

const ChatBot = dynamic(() => import('@/components/ChatBot').then(mod => ({ default: mod.ChatBot })));

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: 'SmartChama',
    template: '%s | SmartChama'
  },
  description: 'Digital savings and loan management for African savings groups.',
  alternates: {
    canonical: 'https://smartchama.vercel.app',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartChama',
    startupImage: [
      '/web-app-manifest-512x512.png'
    ]
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: 'SmartChama',
    title: 'SmartChama',
    description: 'Digital savings and loan management for African savings groups.'
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
        
        {/* Theme color changes with light/dark mode */}
        <meta 
          name="theme-color" 
          content="#22C55E"
          media="(prefers-color-scheme: light)"
        />
        <meta 
          name="theme-color" 
          content="#000000"
          media="(prefers-color-scheme: dark)"
        />

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
          content="SmartChama" 
        />

        {/* Microsoft tiles */}
        <meta 
          name="msapplication-TileColor" 
          content="#22C55E" 
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

        {/* Theme detection and splash screen control script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              document.documentElement.classList.add('dark');
              var isFirst = !sessionStorage.getItem('sc-initial-load');
              if (!isFirst) {
                document.documentElement.classList.add('sc-splash-hidden');
              }
            })();
          `
        }} />
      </head>
      <body className={`${inter.variable} ${geist.variable} font-inter antialiased`}>
        <LoadingScreen />
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