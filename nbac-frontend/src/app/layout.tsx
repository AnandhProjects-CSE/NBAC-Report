import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NBAC - National Board of Accreditation Companion",
  description: "Automated NBA accreditation data management system for engineering colleges. Track CO-PO attainment, manage OBE data, and generate NBA-compliant reports.",
  keywords: ["NBA", "Accreditation", "OBE", "CO-PO Matrix", "Engineering", "Education", "Attainment"],
  authors: [{ name: "NBAC Team" }],
  openGraph: {
    title: "NBAC - National Board of Accreditation Companion",
    description: "Automated NBA accreditation data management system for engineering colleges",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
