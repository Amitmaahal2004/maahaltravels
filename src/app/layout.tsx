import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Explore My Packages | Enterprise Travel Agency CRM & Operations Platform",
  description: "Manage leads, customers, quotations, bookings, trips, employees, finances, and business operations from one centralized Travel Management CRM.",
  keywords: [
    "Travel CRM",
    "Travel Agency Management",
    "Tour Operator Software",
    "Booking Management System",
    "Explore My Packages",
    "Travel Agency ERP",
  ],
  authors: [{ name: "Explore My Packages" }],
};

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
        {children}
      </body>
    </html>
  );
}