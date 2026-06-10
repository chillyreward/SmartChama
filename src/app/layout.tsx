// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "SmartChama - Group Savings",
  description: "Modern Fintech for Chamas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className={`${inter.variable} ${geist.variable} font-inter antialiased bg-[#FAFAFA]`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}