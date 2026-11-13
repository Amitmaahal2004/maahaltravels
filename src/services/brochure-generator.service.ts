import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import { IPackage } from "@/models/Package";

export interface BrochureTemplateOptions {
  templateTheme?: "modern_luxe" | "himalayan_adventure" | "classic_corporate";
  customNotes?: string;
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * Programmatically generates a 100% real, standard-compliant vector PDF brochure
 * from MongoDB Package data using pdf-lib.
 */
export async function generatePackageBrochurePdf(
  pkg: IPackage,
  options?: BrochureTemplateOptions
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Standard safe typography
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette definitions
  const primaryBlue = rgb(0.12, 0.35, 0.85); // #1E59D9
  const darkNavy = rgb(0.06, 0.09, 0.16); // #0F172A
  const slateText = rgb(0.28, 0.33, 0.41); // #475569
  const lightBg = rgb(0.97, 0.98, 0.99); // #F8FAFC
  const borderGray = rgb(0.88, 0.91, 0.94); // #E2E8F0
  const emeraldGreen = rgb(0.02, 0.60, 0.38); // #059669
  const white = rgb(1, 1, 1);

  const phone = options?.contactPhone || "+91 98765 43210";
  const email = options?.contactEmail || "travel@explorepackages.com";

  // ==========================================
  // PAGE 1: COVER & OVERVIEW
  // ==========================================
  const page1 = pdfDoc.addPage(PageSizes.A4);
  const { width: p1W, height: p1H } = page1.getSize();

  // Top Branded Header Ribbon
  page1.drawRectangle({
    x: 0,
    y: p1H - 95,
    width: p1W,
    height: 95,
    color: primaryBlue,
  });

  page1.drawText("EXPLORE MY PACKAGES", {
    x: 40,
    y: p1H - 45,
    size: 20,
    font: helveticaBold,
    color: white,
  });

  page1.drawText("PREMIUM TRAVEL OS & CURATED HOLIDAY EXPERIENCES", {
    x: 40,
    y: p1H - 65,
    size: 8.5,
    font: helvetica,
    color: rgb(0.85, 0.92, 1),
  });

  page1.drawText("OFFICIAL BROCHURE", {
    x: p1W - 165,
    y: p1H - 52,
    size: 10,
    font: helveticaBold,
    color: white,
  });

  // Package Code Badge
  let curY = p1H - 135;
  page1.drawRectangle({
    x: 40,
    y: curY,
    width: 85,
    height: 22,
    color: rgb(0.93, 0.95, 1),
    borderColor: rgb(0.75, 0.85, 1),
    borderWidth: 1,
  });

  page1.drawText(pkg.code || "PKG-EXP", {
    x: 48,
    y: curY + 6,
    size: 10,
    font: helveticaBold,
    color: primaryBlue,
  });

  // Package Title
  curY -= 35;
  page1.drawText(pkg.name || "Signature Himalayan Tour", {
    x: 40,
    y: curY,
    size: 20,
    font: helveticaBold,
    color: darkNavy,
  });

  // Key Highlights Bar (Destination, Duration, Difficulty)
  curY -= 32;
  page1.drawRectangle({
    x: 40,
    y: curY - 5,
    width: p1W - 80,
    height: 30,
    color: lightBg,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page1.drawText(`Destination: ${pkg.destination}`, {
    x: 52,
    y: curY + 4,
    size: 9.5,
    font: helveticaBold,
    color: darkNavy,
  });

  page1.drawText(`Duration: ${pkg.durationDays} Days / ${pkg.durationNights} Nights`, {
    x: 230,
    y: curY + 4,
    size: 9.5,
    font: helveticaBold,
    color: darkNavy,
  });

  page1.drawText(`Category: ${pkg.category} (${pkg.difficulty})`, {
    x: 410,
    y: curY + 4,
    size: 9.5,
    font: helvetica,
    color: slateText,
  });

  // Pricing Card Box
  curY -= 85;
  page1.drawRectangle({
    x: 40,
    y: curY,
    width: p1W - 80,
    height: 72,
    color: rgb(0.96, 0.99, 0.98),
    borderColor: rgb(0.65, 0.88, 0.77),
    borderWidth: 1.5,
  });

  page1.drawText("ALL-INCLUSIVE TOUR TARIFF", {
    x: 55,
    y: curY + 50,
    size: 9,
    font: helveticaBold,
    color: emeraldGreen,
  });

  page1.drawText(`Rs. ${pkg.sellingPrice.toLocaleString("en-IN")}/-`, {
    x: 55,
    y: curY + 22,
    size: 22,
    font: helveticaBold,
    color: darkNavy,
  });

  page1.drawText("* Per person on twin-sharing basis. All taxes & hotel levies included.", {
    x: 55,
    y: curY + 8,
    size: 8,
    font: helveticaOblique,
    color: slateText,
  });

  // Overview Header
  curY -= 45;
  page1.drawText("TOUR OVERVIEW & HIGHLIGHTS", {
    x: 40,
    y: curY,
    size: 13,
    font: helveticaBold,
    color: darkNavy,
  });

  // Underline
  page1.drawLine({
    start: { x: 40, y: curY - 5 },
    end: { x: 120, y: curY - 5 },
    color: primaryBlue,
    thickness: 2,
  });

  // Overview Text
  curY -= 28;
  const overviewText = pkg.shortDescription || pkg.fullDescription ||
    `Experience breathtaking landscapes, tranquil valleys, and cultural heritage on this ${pkg.durationDays}-day curated tour of ${pkg.destination}. Handcrafted for discerning travelers seeking comfort, scenic marvels, and authentic local experiences.`;

  // Simple word-wrap
  const words = overviewText.split(" ");
  let line = "";
  for (const word of words) {
    if (line.length + word.length > 80) {
      page1.drawText(line, { x: 40, y: curY, size: 9.5, font: helvetica, color: slateText });
      curY -= 15;
      line = word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line) {
    page1.drawText(line, { x: 40, y: curY, size: 9.5, font: helvetica, color: slateText });
    curY -= 15;
  }

  // Key Package Inclusions Preview Box
  curY -= 30;
  page1.drawText("WHAT MAKES THIS JOURNEY SPECIAL", {
    x: 40,
    y: curY,
    size: 12,
    font: helveticaBold,
    color: darkNavy,
  });

  curY -= 20;
  const highlights = [
    "Premium handpicked hotel & luxury resort accommodations",
    "Dedicated private sanitized transport throughout the tour itinerary",
    "Experienced local tour guides and 24x7 on-trip concierge assistance",
    "All inner-line permits, state taxes, tolls and parking fees covered",
  ];

  for (const hl of highlights) {
    page1.drawText(">>", { x: 45, y: curY, size: 10, font: helveticaBold, color: primaryBlue });
    page1.drawText(hl, { x: 65, y: curY, size: 9, font: helvetica, color: darkNavy });
    curY -= 18;
  }

  // Page 1 Footer
  page1.drawLine({
    start: { x: 40, y: 45 },
    end: { x: p1W - 40, y: 45 },
    color: borderGray,
    thickness: 1,
  });
  page1.drawText("Explore My Packages • www.explorepackages.com • Toll Free: " + phone, {
    x: 40,
    y: 30,
    size: 8,
    font: helvetica,
    color: slateText,
  });
  page1.drawText("Page 1 of 2", {
    x: p1W - 85,
    y: 30,
    size: 8,
    font: helveticaBold,
    color: slateText,
  });

  // ==========================================
  // PAGE 2: ITINERARY & TERMS
  // ==========================================
  const page2 = pdfDoc.addPage(PageSizes.A4);
  const { width: p2W, height: p2H } = page2.getSize();

  // Top header
  page2.drawRectangle({
    x: 0,
    y: p2H - 60,
    width: p2W,
    height: 60,
    color: darkNavy,
  });

  page2.drawText("EXPLORE MY PACKAGES", {
    x: 40,
    y: p2H - 35,
    size: 14,
    font: helveticaBold,
    color: white,
  });

  page2.drawText("DAY-BY-DAY ITINERARY & PACKAGE DETAILS", {
    x: p2W - 250,
    y: p2H - 35,
    size: 9,
    font: helveticaBold,
    color: rgb(0.8, 0.9, 1),
  });

  // Itinerary Section
  let p2Y = p2H - 95;
  page2.drawText("DAILY ITINERARY PLAN", {
    x: 40,
    y: p2Y,
    size: 13,
    font: helveticaBold,
    color: darkNavy,
  });
  page2.drawLine({
    start: { x: 40, y: p2Y - 4 },
    end: { x: 120, y: p2Y - 4 },
    color: primaryBlue,
    thickness: 2,
  });

  p2Y -= 25;

  const itineraryList = pkg.itinerary && pkg.itinerary.length > 0
    ? pkg.itinerary
    : [
        { day: 1, title: `Arrival in ${pkg.destination}`, description: "Airport/Station pickup, welcome drink, check-in to hotel, evening leisure." },
        { day: 2, title: "Scenic Sightseeing & Landmark Tour", description: "Visit famous viewpoints, historic monuments, and traditional markets." },
        { day: 3, title: "Excursion & Nature Trails", description: "Day trip to alpine viewpoints, valleys, and local cultural points." },
        { day: 4, title: "Departure & Sweet Memories", description: "Breakfast, checkout, and private cab transfer to airport/station." },
      ];

  // Draw up to 5 days
  for (const item of itineraryList.slice(0, 5)) {
    // Day marker pill
    page2.drawRectangle({
      x: 40,
      y: p2Y - 3,
      width: 45,
      height: 18,
      color: rgb(0.92, 0.95, 1),
      borderColor: primaryBlue,
      borderWidth: 1,
    });
    page2.drawText(`DAY ${item.day}`, {
      x: 47,
      y: p2Y + 2,
      size: 8.5,
      font: helveticaBold,
      color: primaryBlue,
    });

    // Day title
    page2.drawText(item.title || `Tour Program Day ${item.day}`, {
      x: 95,
      y: p2Y + 2,
      size: 10,
      font: helveticaBold,
      color: darkNavy,
    });

    p2Y -= 15;
    // Description line
    const desc = item.description || "Sightseeing and leisure activities as planned.";
    const truncatedDesc = desc.length > 95 ? desc.slice(0, 92) + "..." : desc;
    page2.drawText(truncatedDesc, {
      x: 95,
      y: p2Y,
      size: 8.5,
      font: helvetica,
      color: slateText,
    });

    p2Y -= 22;
  }

  // Inclusions & Exclusions Two-Column Cards
  p2Y -= 15;
  const colWidth = (p2W - 95) / 2;

  // Inclusions Box
  page2.drawRectangle({
    x: 40,
    y: p2Y - 110,
    width: colWidth,
    height: 110,
    color: rgb(0.97, 1, 0.98),
    borderColor: rgb(0.7, 0.9, 0.8),
    borderWidth: 1,
  });

  page2.drawText("PACKAGE INCLUSIONS", {
    x: 50,
    y: p2Y - 15,
    size: 10,
    font: helveticaBold,
    color: emeraldGreen,
  });

  const incList = pkg.inclusions && pkg.inclusions.length > 0
    ? pkg.inclusions.slice(0, 4)
    : ["Deluxe Hotel Stays", "Daily Breakfast & Dinner", "AC Transport & Transfers", "All Sightseeing Permits"];

  let incY = p2Y - 35;
  for (const inc of incList) {
    page2.drawText("[+] " + inc, { x: 50, y: incY, size: 8.5, font: helvetica, color: darkNavy });
    incY -= 18;
  }

  // Exclusions Box
  page2.drawRectangle({
    x: 45 + colWidth,
    y: p2Y - 110,
    width: colWidth,
    height: 110,
    color: rgb(1, 0.98, 0.98),
    borderColor: rgb(0.95, 0.8, 0.8),
    borderWidth: 1,
  });

  page2.drawText("PACKAGE EXCLUSIONS", {
    x: 55 + colWidth,
    y: p2Y - 15,
    size: 10,
    font: helveticaBold,
    color: rgb(0.8, 0.2, 0.2),
  });

  const excList = pkg.exclusions && pkg.exclusions.length > 0
    ? pkg.exclusions.slice(0, 4)
    : ["Flight / Train tickets", "Personal Expenses & Laundry", "Entry Tickets / Camera Fees", "Travel Insurance"];

  let excY = p2Y - 35;
  for (const exc of excList) {
    page2.drawText("[-] " + exc, { x: 55 + colWidth, y: excY, size: 8.5, font: helvetica, color: darkNavy });
    excY -= 18;
  }

  // Booking & Contact Terms Box
  p2Y -= 170;
  page2.drawRectangle({
    x: 40,
    y: p2Y,
    width: p2W - 80,
    height: 52,
    color: lightBg,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page2.drawText("BOOKING HELPLINE & RESERVATION ASSISTANCE", {
    x: 50,
    y: p2Y + 36,
    size: 9,
    font: helveticaBold,
    color: primaryBlue,
  });

  page2.drawText(`Phone: ${phone}  |  Email: ${email}  |  Website: https://www.explorepackages.com`, {
    x: 50,
    y: p2Y + 20,
    size: 8.5,
    font: helvetica,
    color: darkNavy,
  });

  page2.drawText("* 50% advance deposit required for booking confirmation. Prices subject to seasonal availability.", {
    x: 50,
    y: p2Y + 7,
    size: 7.5,
    font: helveticaOblique,
    color: slateText,
  });

  // Page 2 Footer
  page2.drawLine({
    start: { x: 40, y: 45 },
    end: { x: p2W - 40, y: 45 },
    color: borderGray,
    thickness: 1,
  });
  page2.drawText("Explore My Packages • Travel OS Enterprise • Confidential & Proprietary", {
    x: 40,
    y: 30,
    size: 8,
    font: helvetica,
    color: slateText,
  });
  page2.drawText("Page 2 of 2", {
    x: p2W - 85,
    y: 30,
    size: 8,
    font: helveticaBold,
    color: slateText,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

