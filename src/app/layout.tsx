import type { Metadata } from "next";
// Temporarily disable Google Fonts to fix build issues
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";

// Temporarily disable font configurations
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "SNS Video Generator",
  description: "AI-powered social media video generation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <GlobalErrorBoundary>
          {children}
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
