import type { Metadata } from "next";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "Explore My Packages | Enterprise Travel Agency CRM & Operations Platform",
  description:
    "Your Entire Travel Business. One Powerful Platform. Manage leads, customers, quotations, bookings, trips, employees, finances, and business operations from one centralized Travel Management CRM.",
  keywords: [
    "Travel Agency CRM",
    "Tour Operations Software",
    "Explore My Packages",
    "Travel Leads Management",
    "Travel Booking Engine",
    "Travel Invoicing & GST",
  ],
};

export default function RootHomePage() {
  return <LandingPageClient />;
}
