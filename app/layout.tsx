import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./styles.css";
// import Script from "next/script";

import { Toaster } from 'react-hot-toast';
import { ConvexClientProvider } from "@/lib/convex-provider";
import AuthProvider from "@/lib/auth-provider";


const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "BookMyBarber - Your Style Hub",
  description: "Book with top barbers near you and get styled your way.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${poppins.variable} antialiased`}>
        <ConvexClientProvider>
          <AuthProvider>
          {children}
          </AuthProvider>
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
