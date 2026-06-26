// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoadingScreen from "@/components/LoadingScreen";
import { ChatBot } from "@/components/ChatBot";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: {
    default: 'SmartChama',
    template: '%s | SmartChama'
  },
  description: 'Digital savings and loan management for African savings groups',
  icons: {
    icon: [
      { 
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      },
      { 
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      { 
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      { 
        url: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    shortcut: '/favicon-32x32.png'
  },
  manifest: '/manifest.json'
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
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var theme = localStorage.getItem('smartchama-theme');
              var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (isDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
              
              var isFirst = !sessionStorage.getItem('sc-initial-load');
              if (!isFirst) {
                document.documentElement.classList.add('sc-splash-hidden');
              }
            })();
          `
        }} />
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, viewport-fit=cover" 
        />
        <meta 
          name="theme-color" 
          content="#22C55E" 
          media="(prefers-color-scheme: light)" 
        />
        <meta 
          name="theme-color" 
          content="#0B0F0C" 
          media="(prefers-color-scheme: dark)" 
        />
        <meta 
          name="msapplication-TileColor" 
          content="#22C55E" 
        />
        <meta 
          name="msapplication-TileImage" 
          content="/web-app-manifest-512x512.png" 
        />
      </head>
      <body className={`${inter.variable} ${geist.variable} font-inter antialiased bg-[#FAFAFA]`}>
        <LoadingScreen />
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <ChatBot />
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}