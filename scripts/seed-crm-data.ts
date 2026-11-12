import fs from "fs";
import path from "path";

function loadEnvFile() {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const envPath = path.resolve(process.cwd(), ".env");
  const fileToLoad = fs.existsSync(envLocalPath) ? envLocalPath : fs.existsSync(envPath) ? envPath : null;

  if (fileToLoad) {
    const content = fs.readFileSync(fileToLoad, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnvFile();

import connectToDatabase, { disconnectDatabase } from "../src/lib/mongodb";
import "../src/models";
import User from "../src/models/User";
import Role from "../src/models/Role";
import Department from "../src/models/Department";
import Customer from "../src/models/Customer";
import Lead from "../src/models/Lead";
import Package from "../src/models/Package";
import Destination from "../src/models/Destination";
import Booking from "../src/models/Booking";
import Quotation from "../src/models/Quotation";
import Invoice from "../src/models/Invoice";
import Payment from "../src/models/Payment";
import Expense from "../src/models/Expense";
import Vendor from "../src/models/Vendor";
import TripOperation from "../src/models/TripOperation";
import EmployeeProfile from "../src/models/EmployeeProfile";
import Attendance from "../src/models/Attendance";
import LeaveRequest from "../src/models/LeaveRequest";
import Task from "../src/models/Task";
import WebsiteContent from "../src/models/WebsiteContent";
import { hashPassword } from "../src/lib/auth/password";

export async function seedCrmData() {
  console.log("🚀 Starting Interconnected CRM Data Seeding...");
  await connectToDatabase();

  const hqDept = await Department.findOne({ code: "HQ" });
  const salesDept = await Department.findOne({ code: "SALES" });
  const opsDept = await Department.findOne({ code: "OPS" });
  const superAdminRole = await Role.findOne({ slug: "super-admin" });
  const salesRole = await Role.findOne({ slug: "sales-executive" });
  const opsRole = await Role.findOne({ slug: "operations-manager" });

  const adminUser = await User.findOne({ email: "admin@travelagency.com" });
  if (!adminUser) {
    throw new Error("Admin user not found. Please run seed.ts first.");
  }

  // 1. Staff Members & Employee Profiles
  console.log("1️⃣ Seeding Staff & Employee Profiles...");
  let salesRep = await User.findOne({ email: "rohan.sales@travelagency.com" });
  if (!salesRep) {
    salesRep = await User.create({
      name: "Rohan Sharma",
      email: "rohan.sales@travelagency.com",
      phone: "+91 98111 22334",
      passwordHash: await hashPassword("Password@123"),
      roleId: salesRole?._id || superAdminRole?._id,
      departmentId: salesDept?._id,
      status: "active",
      isEmailVerified: true,
    });
  }

  let opsManager = await User.findOne({ email: "priya.ops@travelagency.com" });
  if (!opsManager) {
    opsManager = await User.create({
      name: "Priya Verma",
      email: "priya.ops@travelagency.com",
      phone: "+91 98222 33445",
      passwordHash: await hashPassword("Password@123"),
      roleId: opsRole?._id || superAdminRole?._id,
      departmentId: opsDept?._id,
      status: "active",
      isEmailVerified: true,
    });
  }

  // Profiles
  if (!(await EmployeeProfile.findOne({ userId: salesRep._id }))) {
    await EmployeeProfile.create({
      userId: salesRep._id,
      employeeId: "EMP-002",
      designation: "Senior Travel Consultant",
      departmentId: salesDept?._id || hqDept?._id,
      reportingManagerId: adminUser._id,
      joiningDate: new Date("2024-03-15"),
      employmentType: "full_time",
      salary: { basic: 45000, allowances: 15000, currency: "INR" },
      emergencyContact: { name: "Sunil Sharma", relation: "Father", phone: "+91 98111 00000" },
      status: "active",
    });
  }

  if (!(await EmployeeProfile.findOne({ userId: opsManager._id }))) {
    await EmployeeProfile.create({
      userId: opsManager._id,
      employeeId: "EMP-003",
      designation: "Ground Operations Lead",
      departmentId: opsDept?._id || hqDept?._id,
      reportingManagerId: adminUser._id,
      joiningDate: new Date("2023-11-01"),
      employmentType: "full_time",
      salary: { basic: 55000, allowances: 20000, currency: "INR" },
      emergencyContact: { name: "Anand Verma", relation: "Spouse", phone: "+91 98222 00000" },
      status: "active",
    });
  }

  // 2. Destinations
  console.log("2️⃣ Seeding Destinations...");
  const destinationsData = [
    {
      name: "Manali & Solang Valley",
      slug: "manali-solang-valley",
      country: "India",
      state: "Himachal Pradesh",
      city: "Manali",
      description: "Gateway to high-altitude Himalayan passes, apple orchards, paragliding, and snow adventures.",
      bestTimeToVisit: "October to June",
      weather: "Sub-zero in winter, 15°C to 25°C in summer",
      attractions: ["Solang Valley", "Rohtang Pass", "Hadimba Temple", "Old Manali", "Atal Tunnel"],
      status: "published",
      isFeatured: true,
    },
    {
      name: "Leh Ladakh & Pangong",
      slug: "leh-ladakh-pangong",
      country: "India",
      state: "Ladakh",
      city: "Leh",
      description: "The land of high passes, crystal azure lakes, ancient Buddhist gompas, and dramatic moonscapes.",
      bestTimeToVisit: "May to September",
      weather: "Dry and cold, 5°C to 20°C in summer",
      attractions: ["Pangong Tso", "Khardung La", "Nubra Valley", "Thiksey Monastery", "Magnetic Hill"],
      status: "published",
      isFeatured: true,
    },
    {
      name: "Spiti Valley & Kaza",
      slug: "spiti-valley-kaza",
      country: "India",
      state: "Himachal Pradesh",
      city: "Kaza",
      description: "A cold desert mountain valley nestled in the Himalayas, famed for rugged canyons and star-gazing.",
      bestTimeToVisit: "June to October",
      weather: "Crisp and sunny days with chilly nights",
      attractions: ["Key Monastery", "Chandratal Lake", "Kibber Wildlife Sanctuary", "Komic Highest Village"],
      status: "published",
      isFeatured: true,
    },
    {
      name: "Kashmir: Srinagar & Gulmarg",
      slug: "kashmir-srinagar-gulmarg",
      country: "India",
      state: "Jammu & Kashmir",
      city: "Srinagar",
      description: "Paradise on Earth with tranquil Dal Lake houseboats, Mughal gardens, and snow-clad ski slopes.",
      bestTimeToVisit: "All year round",
      weather: "Cool summer, snow winters",
      attractions: ["Dal Lake Shikara", "Gulmarg Gondola", "Pahalgam Valley", "Betab Valley"],
      status: "published",
      isFeatured: true,
    },
  ];

  for (const d of destinationsData) {
    await Destination.findOneAndUpdate({ slug: d.slug }, d, { upsert: true, new: true });
  }

  // 3. Tour Packages
  console.log("3️⃣ Seeding Tour Packages...");
  const packagesData = [
    {
      name: "Rohtang & Solang Valley Adventure Expedition",
      slug: "rohtang-solang-adventure-expedition",
      code: "PKG-MAN-001",
      shortDescription: "5 Days of thrilling mountain adventures, Atal tunnel exploration, and alpine camping.",
      fullDescription: "Experience the ultimate Himalayan escape featuring paragliding in Solang, high pass crossing, and bonfires.",
      destination: "Manali & Solang Valley",
      durationDays: 5,
      durationNights: 4,
      startingPrice: 24999,
      sellingPrice: 24999,
      internalCost: 15500,
      category: "Adventure",
      difficulty: "moderate",
      inclusions: ["4-Star Hotel Stay", "Breakfast & Dinner", "SUV Transfers", "Paragliding Pass", "Atal Tunnel Permit"],
      exclusions: ["Flight tickets", "Personal expenses", "Camera fees"],
      itinerary: [
        { day: 1, title: "Arrival in Manali & Old Manali Stroll", description: "Check in at resort, evening walk through Old Manali cafes." },
        { day: 2, title: "Solang Valley Thrills & Paragliding", description: "Full day at Solang Valley with paragliding and zorbing." },
        { day: 3, title: "Atal Tunnel & Sissu Waterfalls", description: "Drive through Atal tunnel into the Lahaul valley." },
        { day: 4, title: "Rohtang Pass Snow Experience", description: "High-altitude snow pass drive with panoramic mountain views." },
        { day: 5, title: "Departure with Himalayan Memories", description: "Breakfast and transfer to Volvo / airport." },
      ],
      status: "published",
      isFeatured: true,
    },
    {
      name: "Mystic Spiti Circuit: Monasteries & High Passes",
      slug: "mystic-spiti-circuit",
      code: "PKG-SPI-002",
      shortDescription: "7 Days overland 4x4 expedition through high mountain passes and centuries-old monasteries.",
      fullDescription: "Journey through Kaza, Key Monastery, Pin Valley, and camp beside the turquoise Chandratal lake.",
      destination: "Spiti Valley & Kaza",
      durationDays: 7,
      durationNights: 6,
      startingPrice: 38500,
      sellingPrice: 38500,
      internalCost: 24000,
      category: "Trekking",
      difficulty: "challenging",
      inclusions: ["4x4 Scorpio / Gypsy", "Homestay & Camp Accommodations", "All Meals", "Oxygen Cylinders", "Monastery Entry"],
      exclusions: ["Tips", "Emergency evacuations", "GST 5%"],
      itinerary: [
        { day: 1, title: "Manali to Kaza via Kunzum Pass", description: "Scenic mountain crossing into the Spiti river valley." },
        { day: 2, title: "Key Monastery & Kibber High Village", description: "Visit the iconic 1000-year-old Key Gompa." },
        { day: 3, title: "Hikkim (Highest Post Office) & Langza", description: "Post a postcard from 14,567 ft and view fossil reserves." },
        { day: 4, title: "Pin Valley National Park", description: "Explore the habitat of the elusive snow leopard." },
        { day: 5, title: "Kaza to Chandratal Moon Lake", description: "Evening hike and luxury dome camping near Chandratal." },
        { day: 6, title: "Chandratal to Manali Crossing", description: "Cross Rohtang back into lush green Kullu valley." },
        { day: 7, title: "Breakfast & Farewell Departure", description: "Departure transfer." },
      ],
      status: "published",
      isFeatured: true,
    },
    {
      name: "Enchanting Kashmir: Srinagar & Gulmarg Odyssey",
      slug: "enchanting-kashmir-srinagar-gulmarg",
      code: "PKG-KAS-003",
      shortDescription: "6 Days luxury vacation with Dal Lake houseboats, Gulmarg gondola ride, and Pahalgam valleys.",
      fullDescription: "Immerse in timeless Kashmiri elegance, saffron fields, and snow peaks.",
      destination: "Kashmir: Srinagar & Gulmarg",
      durationDays: 6,
      durationNights: 5,
      startingPrice: 42000,
      sellingPrice: 42000,
      internalCost: 27000,
      category: "Honeymoon",
      difficulty: "easy",
      inclusions: ["Luxury Dal Lake Houseboat", "5-Star Resort in Gulmarg", "Private Sedan", "All Breakfasts & Dinners", "Gondola Phase 1 Ticket"],
      exclusions: ["Airfare", "Pony rides", "Personal shopping"],
      itinerary: [
        { day: 1, title: "Srinagar Arrival & Sunset Shikara Ride", description: "Check in to luxury houseboat, evening Shikara." },
        { day: 2, title: "Mughal Gardens & Old City Heritage", description: "Nishat and Shalimar gardens tour." },
        { day: 3, title: "Gulmarg Gondola & Meadow of Flowers", description: "Ascend to Apharwat peak via cable car." },
        { day: 4, title: "Pahalgam Valley & Betaab Valley", description: "Drive along Lidder river to lush pine meadows." },
        { day: 5, title: "Aru Valley Nature Walk", description: "Gentle forest hike and authentic Kashmiri Wazwan dinner." },
        { day: 6, title: "Airport Departure Transfer", description: "Drop at Srinagar international airport." },
      ],
      status: "published",
      isFeatured: true,
    },
  ];

  for (const p of packagesData) {
    await Package.findOneAndUpdate({ code: p.code }, p, { upsert: true, new: true });
  }

  const pkgManali = await Package.findOne({ code: "PKG-MAN-001" });
  const pkgSpiti = await Package.findOne({ code: "PKG-SPI-002" });
  const pkgKashmir = await Package.findOne({ code: "PKG-KAS-003" });

  // 4. Vendors & Suppliers
  console.log("4️⃣ Seeding Vendors & Suppliers...");
  const vendorsData = [
    {
      name: "Himalayan Snow Heights Resort",
      type: "hotel",
      contactPerson: "Mahesh Chander",
      phone: "+91 98160 55443",
      email: "reservations@snowheights.com",
      city: "Manali",
      state: "Himachal Pradesh",
      services: ["Luxury Rooms", "Campfires", "Buffet Dinners"],
      balanceOwed: 25000,
      status: "active",
    },
    {
      name: "Ladakh 4x4 Mountain Fleet",
      type: "transport",
      contactPerson: "Stanzin Norbu",
      phone: "+91 94191 77665",
      email: "bookings@ladakh4x4.com",
      city: "Leh",
      state: "Ladakh",
      services: ["Innova Crysta", "Scorpio 4x4", "Experienced High-Altitude Drivers"],
      balanceOwed: 18000,
      status: "active",
    },
    {
      name: "Kashmir Royal Houseboats & Shikara Co.",
      type: "hotel",
      contactPerson: "Tariq Ahmad",
      phone: "+91 97970 88990",
      email: "info@royalhouseboats.com",
      city: "Srinagar",
      state: "Jammu & Kashmir",
      services: ["Heritage Houseboats", "Shikara Cruises", "Wazwan Catering"],
      balanceOwed: 0,
      status: "active",
    },
  ];

  for (const v of vendorsData) {
    await Vendor.findOneAndUpdate({ name: v.name }, v, { upsert: true, new: true });
  }

  const hotelVendor = await Vendor.findOne({ name: "Himalayan Snow Heights Resort" });
  const transportVendor = await Vendor.findOne({ name: "Ladakh 4x4 Mountain Fleet" });

  // 5. Customers
  console.log("5️⃣ Seeding Customers...");
  const customersData = [
    {
      name: "Dr. Rajesh Malhotra",
      email: "rajesh.malhotra@healthplus.org",
      phone: "+91 98200 11223",
      whatsapp: "+91 98200 11223",
      city: "Mumbai",
      state: "Maharashtra",
      customerType: "vip",
      source: "website",
      assignedTo: salesRep._id,
      tags: ["High Budget", "Frequent Traveler", "VIP"],
      notes: "Prefers 4x4 private transport and luxury room upgrades.",
      totalSpent: 154000,
      bookingsCount: 1,
      status: "active",
    },
    {
      name: "Vikram & Sunita Joshi",
      email: "vikram.joshi@techcorp.in",
      phone: "+91 98101 44556",
      whatsapp: "+91 98101 44556",
      city: "New Delhi",
      state: "Delhi",
      customerType: "family",
      source: "referral",
      assignedTo: salesRep._id,
      tags: ["Family Tour", "Honeymoon"],
      notes: "Traveling with spouse. Requested vegetarian meals.",
      totalSpent: 84000,
      bookingsCount: 1,
      status: "active",
    },
    {
      name: "Ananya Sen",
      email: "ananya.sen@designstudio.com",
      phone: "+91 98300 77889",
      city: "Bangalore",
      state: "Karnataka",
      customerType: "individual",
      source: "instagram",
      assignedTo: salesRep._id,
      tags: ["Solo Adventurer", "Photography"],
      totalSpent: 49998,
      bookingsCount: 1,
      status: "active",
    },
  ];

  for (const c of customersData) {
    await Customer.findOneAndUpdate({ email: c.email }, c, { upsert: true, new: true });
  }

  const custRajesh = await Customer.findOne({ email: "rajesh.malhotra@healthplus.org" });
  const custVikram = await Customer.findOne({ email: "vikram.joshi@techcorp.in" });
  const custAnanya = await Customer.findOne({ email: "ananya.sen@designstudio.com" });

  // 6. Leads Pipeline
  console.log("6️⃣ Seeding Leads Pipeline...");
  const leadsData = [
    {
      name: "Kabir Mehta",
      email: "kabir.mehta@gmail.com",
      phone: "+91 98990 12345",
      destination: "Leh Ladakh & Pangong",
      interestedPackageId: pkgSpiti?._id,
      travelDate: new Date("2026-12-15"),
      travellersCount: 4,
      budget: 120000,
      leadSource: "website",
      assignedTo: salesRep._id,
      priority: "high",
      status: "new",
      notes: "Inquired via homepage website booking form for a group of 4 friends.",
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Deepak Chawla",
      email: "deepak.c@outlook.com",
      phone: "+91 98450 67890",
      destination: "Spiti Valley & Kaza",
      travelDate: new Date("2026-12-20"),
      travellersCount: 2,
      budget: 80000,
      leadSource: "instagram",
      assignedTo: salesRep._id,
      priority: "medium",
      status: "contacted",
      notes: "Called on phone, requested customized 6-day itinerary without homestay camping.",
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Sneha Kulkarni",
      email: "sneha.kulkarni@yahoo.com",
      phone: "+91 98220 54321",
      destination: "Kashmir: Srinagar & Gulmarg",
      interestedPackageId: pkgKashmir?._id,
      travelDate: new Date("2026-12-24"),
      travellersCount: 2,
      budget: 90000,
      leadSource: "whatsapp",
      assignedTo: salesRep._id,
      priority: "urgent",
      status: "quotation_sent",
      notes: "Sent branded quotation with Dal lake luxury houseboat stay.",
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Pooja Hegde",
      email: "pooja.hegde@techstar.in",
      phone: "+91 99000 88776",
      destination: "Manali & Solang Valley",
      interestedPackageId: pkgManali?._id,
      travelDate: new Date("2026-11-28"),
      travellersCount: 3,
      budget: 75000,
      leadSource: "referral",
      assignedTo: salesRep._id,
      priority: "high",
      status: "negotiation",
      notes: "Discussing ₹5,000 group discount before making token advance payment.",
      followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  ];

  for (const l of leadsData) {
    await Lead.findOneAndUpdate({ email: l.email }, l, { upsert: true, new: true });
  }

  // 7. Quotations
  console.log("7️⃣ Seeding Quotations...");
  await Quotation.findOneAndUpdate(
    { quotationNumber: "QTN-2026-001" },
    {
      quotationNumber: "QTN-2026-001",
      customerId: custRajesh?._id,
      customerName: "Dr. Rajesh Malhotra",
      customerEmail: "rajesh.malhotra@healthplus.org",
      customerPhone: "+91 98200 11223",
      packageId: pkgSpiti?._id,
      packageName: "Mystic Spiti Circuit: Monasteries & High Passes",
      destination: "Spiti Valley & Kaza",
      departureDate: new Date("2026-12-05"),
      durationDays: 7,
      travellersCount: 4,
      lineItems: [
        { description: "Spiti 7-Day 4x4 Expedition Package (per person)", quantity: 4, rate: 35000, total: 140000 },
        { description: "Luxury Dome Camp Upgrade at Chandratal", quantity: 2, rate: 4500, total: 9000 },
        { description: "Emergency Satellite Phone & Oxygen Kit", quantity: 1, rate: 5000, total: 5000 },
      ],
      subtotal: 154000,
      discount: 7000,
      gstRate: 5,
      gstAmount: 7000,
      totalAmount: 154000,
      validUntil: new Date("2026-12-30"),
      status: "accepted",
      notes: "Quotation accepted and converted to confirmed booking BKG-2026-001.",
      createdBy: salesRep._id,
    },
    { upsert: true, new: true }
  );

  await Quotation.findOneAndUpdate(
    { quotationNumber: "QTN-2026-002" },
    {
      quotationNumber: "QTN-2026-002",
      customerName: "Sneha Kulkarni",
      customerEmail: "sneha.kulkarni@yahoo.com",
      customerPhone: "+91 98220 54321",
      packageId: pkgKashmir?._id,
      packageName: "Enchanting Kashmir: Srinagar & Gulmarg Odyssey",
      destination: "Kashmir: Srinagar & Gulmarg",
      departureDate: new Date("2026-12-24"),
      durationDays: 6,
      travellersCount: 2,
      lineItems: [
        { description: "Kashmir Odyssey Couple Package", quantity: 1, rate: 84000, total: 84000 },
        { description: "Gulmarg Gondola Phase 1 & 2 Passes", quantity: 2, rate: 2100, total: 4200 },
      ],
      subtotal: 88200,
      discount: 0,
      gstRate: 5,
      gstAmount: 4200,
      totalAmount: 88200,
      validUntil: new Date("2026-12-15"),
      status: "sent",
      notes: "Awaiting client confirmation on winter snow gear inclusion.",
      createdBy: salesRep._id,
    },
    { upsert: true, new: true }
  );

  // 8. Bookings & Invoices & Payments
  console.log("8️⃣ Seeding Bookings, Invoices & Payments...");
  // Booking 1: Fully Paid
  const booking1 = await Booking.findOneAndUpdate(
    { bookingRef: "BKG-2026-001" },
    {
      bookingRef: "BKG-2026-001",
      customerId: custRajesh?._id,
      customerName: "Dr. Rajesh Malhotra",
      customerEmail: "rajesh.malhotra@healthplus.org",
      customerPhone: "+91 98200 11223",
      packageId: pkgSpiti?._id,
      packageName: "Mystic Spiti Circuit: Monasteries & High Passes",
      departureDate: new Date("2026-12-05"),
      returnDate: new Date("2026-12-11"),
      adults: 4,
      children: 0,
      infants: 0,
      travellersCount: 4,
      travellers: [
        { fullName: "Dr. Rajesh Malhotra", age: 48, gender: "male" },
        { fullName: "Meenakshi Malhotra", age: 45, gender: "female" },
        { fullName: "Aryan Malhotra", age: 20, gender: "male" },
        { fullName: "Tara Malhotra", age: 17, gender: "female" },
      ],
      assignedStaff: opsManager._id,
      bookingSource: "quotation_converted",
      totalAmount: 154000,
      discount: 7000,
      taxAmount: 7000,
      paidAmount: 154000,
      balanceAmount: 0,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      specialRequirements: "Vegetarian breakfast and twin beds in family suite.",
    },
    { upsert: true, new: true }
  );

  // Invoice 1
  const inv1 = await Invoice.findOneAndUpdate(
    { invoiceNumber: "INV-2026-001" },
    {
      invoiceNumber: "INV-2026-001",
      bookingId: booking1._id,
      bookingRef: "BKG-2026-001",
      customerId: custRajesh?._id,
      customerName: "Dr. Rajesh Malhotra",
      customerEmail: "rajesh.malhotra@healthplus.org",
      customerPhone: "+91 98200 11223",
      issueDate: new Date("2026-11-01"),
      dueDate: new Date("2026-11-15"),
      items: [
        { description: "Mystic Spiti 4x4 Circuit Tour (4 Adults)", quantity: 4, rate: 35000, amount: 140000 },
        { description: "Chandratal Luxury Camping Upgrade", quantity: 2, rate: 4500, amount: 9000 },
        { description: "Satellite Phone & Oxygen Support", quantity: 1, rate: 5000, amount: 5000 },
      ],
      subtotal: 154000,
      discount: 7000,
      gstRate: 5,
      gstAmount: 7000,
      totalAmount: 154000,
      paidAmount: 154000,
      balanceAmount: 0,
      status: "paid",
      notes: "Payment received in full via UPI transaction.",
    },
    { upsert: true, new: true }
  );

  // Payment 1
  await Payment.findOneAndUpdate(
    { paymentId: "PAY-2026-001" },
    {
      paymentId: "PAY-2026-001",
      bookingId: booking1._id,
      bookingRef: "BKG-2026-001",
      invoiceId: inv1._id,
      invoiceNumber: "INV-2026-001",
      customerId: custRajesh?._id,
      customerName: "Dr. Rajesh Malhotra",
      amount: 154000,
      paymentMethod: "upi",
      transactionRef: "UPI/348291048291/ICICI",
      paymentDate: new Date("2026-11-02"),
      status: "completed",
      recordedBy: adminUser._id,
      notes: "Verified in bank account.",
    },
    { upsert: true, new: true }
  );

  // Booking 2: Partially Paid
  const booking2 = await Booking.findOneAndUpdate(
    { bookingRef: "BKG-2026-002" },
    {
      bookingRef: "BKG-2026-002",
      customerId: custVikram?._id,
      customerName: "Vikram & Sunita Joshi",
      customerEmail: "vikram.joshi@techcorp.in",
      customerPhone: "+91 98101 44556",
      packageId: pkgKashmir?._id,
      packageName: "Enchanting Kashmir: Srinagar & Gulmarg Odyssey",
      departureDate: new Date("2026-12-18"),
      returnDate: new Date("2026-12-24"),
      adults: 2,
      children: 0,
      infants: 0,
      travellersCount: 2,
      travellers: [
        { fullName: "Vikram Joshi", age: 34, gender: "male" },
        { fullName: "Sunita Joshi", age: 32, gender: "female" },
      ],
      assignedStaff: opsManager._id,
      bookingSource: "direct",
      totalAmount: 84000,
      discount: 0,
      taxAmount: 4000,
      paidAmount: 40000,
      balanceAmount: 44000,
      paymentStatus: "partially_paid",
      bookingStatus: "in_progress",
    },
    { upsert: true, new: true }
  );

  const inv2 = await Invoice.findOneAndUpdate(
    { invoiceNumber: "INV-2026-002" },
    {
      invoiceNumber: "INV-2026-002",
      bookingId: booking2._id,
      bookingRef: "BKG-2026-002",
      customerId: custVikram?._id,
      customerName: "Vikram & Sunita Joshi",
      customerEmail: "vikram.joshi@techcorp.in",
      customerPhone: "+91 98101 44556",
      issueDate: new Date("2026-11-05"),
      dueDate: new Date("2026-12-05"),
      items: [
        { description: "Kashmir 6-Day Odyssey Package (2 Adults)", quantity: 2, rate: 42000, amount: 84000 },
      ],
      subtotal: 80000,
      discount: 0,
      gstRate: 5,
      gstAmount: 4000,
      totalAmount: 84000,
      paidAmount: 40000,
      balanceAmount: 44000,
      status: "partially_paid",
      notes: "Advance of ₹40,000 received. Balance ₹44,000 due 10 days before departure.",
    },
    { upsert: true, new: true }
  );

  await Payment.findOneAndUpdate(
    { paymentId: "PAY-2026-002" },
    {
      paymentId: "PAY-2026-002",
      bookingId: booking2._id,
      bookingRef: "BKG-2026-002",
      invoiceId: inv2._id,
      invoiceNumber: "INV-2026-002",
      customerId: custVikram?._id,
      customerName: "Vikram & Sunita Joshi",
      amount: 40000,
      paymentMethod: "bank_transfer",
      transactionRef: "NEFT/HDFC298492019/ADV",
      paymentDate: new Date("2026-11-05"),
      status: "completed",
      recordedBy: adminUser._id,
      notes: "Advance booking confirmation deposit.",
    },
    { upsert: true, new: true }
  );

  // Booking 3: Unpaid / Pending Confirmation
  const booking3 = await Booking.findOneAndUpdate(
    { bookingRef: "BKG-2026-003" },
    {
      bookingRef: "BKG-2026-003",
      customerId: custAnanya?._id,
      customerName: "Ananya Sen",
      customerEmail: "ananya.sen@designstudio.com",
      customerPhone: "+91 98300 77889",
      packageId: pkgManali?._id,
      packageName: "Rohtang & Solang Valley Adventure Expedition",
      departureDate: new Date("2026-12-28"),
      returnDate: new Date("2027-01-02"),
      adults: 2,
      children: 0,
      infants: 0,
      travellersCount: 2,
      travellers: [
        { fullName: "Ananya Sen", age: 27, gender: "female" },
        { fullName: "Riya Sen", age: 25, gender: "female" },
      ],
      assignedStaff: opsManager._id,
      bookingSource: "website",
      totalAmount: 49998,
      discount: 0,
      taxAmount: 2380,
      paidAmount: 0,
      balanceAmount: 49998,
      paymentStatus: "unpaid",
      bookingStatus: "pending_confirmation",
    },
    { upsert: true, new: true }
  );

  await Invoice.findOneAndUpdate(
    { invoiceNumber: "INV-2026-003" },
    {
      invoiceNumber: "INV-2026-003",
      bookingId: booking3._id,
      bookingRef: "BKG-2026-003",
      customerId: custAnanya?._id,
      customerName: "Ananya Sen",
      customerEmail: "ananya.sen@designstudio.com",
      customerPhone: "+91 98300 77889",
      issueDate: new Date("2026-11-10"),
      dueDate: new Date("2026-11-20"),
      items: [
        { description: "Rohtang & Solang Valley Tour (2 Persons)", quantity: 2, rate: 24999, amount: 49998 },
      ],
      subtotal: 47618,
      discount: 0,
      gstRate: 5,
      gstAmount: 2380,
      totalAmount: 49998,
      paidAmount: 0,
      balanceAmount: 49998,
      status: "unpaid",
      notes: "Invoice sent via email. Awaiting initial payment.",
    },
    { upsert: true, new: true }
  );

  // 9. Trip Operations
  console.log("9️⃣ Seeding Trip Operations Workspace...");
  await TripOperation.findOneAndUpdate(
    { operationId: "OPS-2026-001" },
    {
      operationId: "OPS-2026-001",
      bookingId: booking1._id,
      bookingRef: "BKG-2026-001",
      customerName: "Dr. Rajesh Malhotra",
      packageName: "Mystic Spiti Circuit: Monasteries & High Passes",
      departureDate: new Date("2026-12-05"),
      returnDate: new Date("2026-12-11"),
      travellersCount: 4,
      tripManagerId: opsManager._id,
      tripManagerName: "Priya Verma",
      driverName: "Tenzin Dorje",
      driverPhone: "+91 94191 00223",
      vehicleNumber: "HP-01-A-4455",
      vehicleModel: "Toyota Innova Crysta 4x4",
      guideName: "Karma Wangdu",
      guidePhone: "+91 94180 33441",
      hotelAllocations: [
        { hotelName: "Hotel Grand Shambala", city: "Kaza", checkIn: new Date("2026-12-05"), checkOut: new Date("2026-12-09"), roomType: "Deluxe Suite", roomsCount: 2 },
        { hotelName: "Chandratal Glamping Domes", city: "Chandratal", checkIn: new Date("2026-12-09"), checkOut: new Date("2026-12-10"), roomType: "Luxury Dome", roomsCount: 2 },
      ],
      checklist: [
        { task: "Vehicle High-Altitude Pre-Inspection", completed: true, completedAt: new Date("2026-11-10") },
        { task: "Inner Line Permits & Green Tax Passes", completed: true, completedAt: new Date("2026-11-11") },
        { task: "Emergency Medical Kit & Portable O2 Cylinder", completed: false },
        { task: "Hotel Booking Voucher Reconfirmation", completed: true, completedAt: new Date("2026-11-12") },
        { task: "Welcome Kit & Passenger Briefing", completed: false },
      ],
      status: "scheduled",
      operationalExpensesTotal: 48000,
      notes: "Family requested extra warm blankets in Chandratal dome camp.",
    },
    { upsert: true, new: true }
  );

  // 10. Expenses & Profit
  console.log("🔟 Seeding Expenses & Direct Tour Costs...");
  const expensesData = [
    {
      title: "Hotel Stay Payment - Kaza Grand Shambala",
      category: "hotels",
      amount: 32000,
      date: new Date("2026-11-04"),
      bookingId: booking1._id,
      bookingRef: "BKG-2026-001",
      vendorId: hotelVendor?._id,
      vendorName: "Himalayan Snow Heights Resort",
      departmentId: opsDept?._id,
      approvedBy: adminUser._id,
      status: "approved",
      notes: "Direct booking cost for BKG-2026-001",
    },
    {
      title: "4x4 Fleet Fuel & Driver Allowance",
      category: "transportation",
      amount: 16000,
      date: new Date("2026-11-06"),
      bookingId: booking1._id,
      bookingRef: "BKG-2026-001",
      vendorId: transportVendor?._id,
      vendorName: "Ladakh 4x4 Mountain Fleet",
      departmentId: opsDept?._id,
      approvedBy: adminUser._id,
      status: "approved",
      notes: "Diesel and mountain highway toll passes.",
    },
    {
      title: "Google Ads & Social Media Marketing Campaign",
      category: "marketing",
      amount: 18500,
      date: new Date("2026-11-02"),
      departmentId: salesDept?._id,
      approvedBy: adminUser._id,
      status: "approved",
      notes: "Lead generation ads for winter holiday packages.",
    },
    {
      title: "High-Speed Office Internet & Cloud Subscriptions",
      category: "office_expenses",
      amount: 6200,
      date: new Date("2026-11-01"),
      departmentId: hqDept?._id,
      approvedBy: adminUser._id,
      status: "approved",
      notes: "Airtel fiber broadband and SaaS tools.",
    },
  ];

  for (const ex of expensesData) {
    await Expense.create(ex);
  }

  // 11. Attendance & Leaves
  console.log("1️⃣1️⃣ Seeding Attendance & Leaves...");
  const todayStr = new Date().toISOString().split("T")[0];
  await Attendance.findOneAndUpdate(
    { userId: salesRep._id, date: todayStr },
    {
      userId: salesRep._id,
      userName: salesRep.name,
      departmentId: salesDept?._id,
      date: todayStr,
      checkInTime: new Date(new Date().setHours(9, 15, 0, 0)),
      status: "present",
      totalWorkingHours: 8.5,
      ipAddress: "192.168.1.102",
      notes: "On-time arrival.",
    },
    { upsert: true, new: true }
  );

  await Attendance.findOneAndUpdate(
    { userId: opsManager._id, date: todayStr },
    {
      userId: opsManager._id,
      userName: opsManager.name,
      departmentId: opsDept?._id,
      date: todayStr,
      checkInTime: new Date(new Date().setHours(9, 45, 0, 0)),
      status: "late",
      totalWorkingHours: 8.0,
      ipAddress: "192.168.1.105",
      notes: "Delayed due to client call.",
    },
    { upsert: true, new: true }
  );

  // Leave Request
  await LeaveRequest.create({
    userId: salesRep._id,
    userName: salesRep.name,
    departmentId: salesDept?._id,
    leaveType: "casual",
    startDate: new Date("2026-11-20"),
    endDate: new Date("2026-11-21"),
    totalDays: 2,
    reason: "Family wedding in Chandigarh.",
    status: "approved",
    approvedBy: adminUser._id,
    approvedByName: adminUser.name,
  });

  await LeaveRequest.create({
    userId: opsManager._id,
    userName: opsManager.name,
    departmentId: opsDept?._id,
    leaveType: "sick",
    startDate: new Date("2026-11-25"),
    endDate: new Date("2026-11-25"),
    totalDays: 1,
    reason: "Dental checkup and routine appointment.",
    status: "pending",
  });

  // 12. Tasks & To-Dos
  console.log("1️⃣2️⃣ Seeding Tasks & To-Dos...");
  const tasksData = [
    {
      title: "Inspect high-altitude vehicle permits for Spiti departure",
      description: "Verify vehicle fitness certificate and green tax pass before BKG-2026-001 leaves.",
      priority: "high",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignedTo: opsManager._id,
      assignedToName: opsManager.name,
      createdBy: adminUser._id,
      createdByName: adminUser.name,
      departmentId: opsDept?._id,
      status: "in_progress",
      comments: [
        { userId: opsManager._id, userName: opsManager.name, comment: "Spoke with RTO officer, permits will be stamped by tomorrow.", createdAt: new Date() },
      ],
    },
    {
      title: "Follow up with Sneha Kulkarni on Kashmir quotation QTN-2026-002",
      description: "Call client to confirm whether they want Phase 2 Gondola tickets added to invoice.",
      priority: "urgent",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedTo: salesRep._id,
      assignedToName: salesRep.name,
      createdBy: adminUser._id,
      createdByName: adminUser.name,
      departmentId: salesDept?._id,
      status: "pending",
      comments: [],
    },
    {
      title: "Reconcile October vendor invoices for hotel stays",
      description: "Match hotel billing sheets against booking references and update accounts ledger.",
      priority: "medium",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assignedTo: adminUser._id,
      assignedToName: adminUser.name,
      createdBy: adminUser._id,
      createdByName: adminUser.name,
      departmentId: hqDept?._id,
      status: "completed",
      comments: [],
    },
  ];

  for (const t of tasksData) {
    await Task.create(t);
  }

  // 13. Website CMS Content
  console.log("1️⃣3️⃣ Seeding Website CMS Content...");
  await WebsiteContent.findOneAndUpdate(
    { key: "hero_banner" },
    {
      key: "hero_banner",
      title: "Curated Expeditions Across The Himalayas & Beyond",
      subtitle: "Discover bespoke luxury trekking, cultural tours, and high-altitude adventures with the region's leading travel operating suite.",
      content: "From the snow-crowned summits of Manali to the moonscapes of Ladakh and the tranquil houseboats of Kashmir, we craft journeys that linger forever.",
      images: ["/images/hero-himalayas.jpg"],
      metadata: {
        ctaText: "Explore Tour Packages",
        ctaLink: "/packages",
        badge: "Rated #1 Himalayan Expeditions 2026",
      },
      isPublished: true,
      updatedBy: adminUser._id,
    },
    { upsert: true, new: true }
  );

  await WebsiteContent.findOneAndUpdate(
    { key: "agency_about" },
    {
      key: "agency_about",
      title: "Over 15 Years of Alpine Excellence",
      subtitle: "Locally rooted, internationally celebrated travel creators.",
      content: "Explore My Packages was founded with a singular purpose: to deliver deeply authentic, safe, and breathtaking travel experiences across India's most majestic mountain frontiers.",
      images: ["/images/about-mountains.jpg"],
      metadata: {
        foundedYear: "2011",
        tripsCompleted: "12,500+",
        travelersServed: "35,000+",
      },
      isPublished: true,
      updatedBy: adminUser._id,
    },
    { upsert: true, new: true }
  );

  console.log("🎉 Complete Interconnected CRM Data Seeded Successfully!\n");
}

if (require.main === module) {
  seedCrmData()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Seeding failed:", err);
      await disconnectDatabase();
      process.exit(1);
    });
}

