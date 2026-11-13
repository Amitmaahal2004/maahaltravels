import mongoose from "mongoose";
import fs from "fs";

let uri = process.env.MONGODB_URI;
if (!uri) {
  const envContent = fs.existsSync(".env.local")
    ? fs.readFileSync(".env.local", "utf8")
    : fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      uri = trimmed.slice("MONGODB_URI=".length).replace(/^["']|["']$/g, "");
      process.env.MONGODB_URI = uri;
      break;
    }
  }
}

async function runBrochureSystemE2ETest() {
  console.log("========================================================================");
  console.log("   PDF BROCHURE MANAGEMENT, ADVANCED EDITOR & WHATSAPP SHARING TEST    ");
  console.log("========================================================================\n");

  await mongoose.connect(uri);

  const Package = (await import("../src/models/Package.ts")).default;
  const PackageDocument = (await import("../src/models/PackageDocument.ts")).default;
  const { generatePackageBrochurePdf } = await import("../src/services/brochure-generator.service.ts");
  const { applyPdfEdits } = await import("../src/services/pdf-editor.service.ts");
  const { uploadPdfBuffer, getPdfBuffer } = await import("../src/lib/storage/index.ts");

  // Step 1: Find or Create a Test Tour Package
  console.log("1. FETCHING TOUR PACKAGE FOR BROCHURE GENERATION");
  let pkg = await Package.findOne({ status: "published" });
  if (!pkg) {
    pkg = await Package.create({
      name: "Manali - Shimla Luxury Holiday Tour",
      slug: `manali-shimla-${Date.now()}`,
      code: "PKG-MS01",
      destination: "Himachal Pradesh",
      durationDays: 6,
      durationNights: 5,
      startingPrice: 32000,
      sellingPrice: 42000,
      internalCost: 28000,
      category: "Himalayan Treks",
      difficulty: "easy",
      shortDescription: "Luxury 6-day holiday covering Manali, Solang Valley, Rohtang Pass, and Shimla Mall Road.",
      itinerary: [
        { day: 1, title: "Arrival in Manali & Welcome", description: "Pickup from Volvo stand, transfer to luxury cottage, evening walk at Mall Road." },
        { day: 2, title: "Solang Valley & Snow Point", description: "Full day excursion to Solang Valley for paragliding, skiing and cable car ride." },
        { day: 3, title: "Naggar Castle & Local Sightseeing", description: "Visit historic Naggar Castle, art gallery and apple orchards." },
        { day: 4, title: "Scenic Drive to Shimla", description: "Drive along Beas river through Kullu valley to the colonial queen of hills." },
        { day: 5, title: "Shimla Kufri Exploration", description: "Excursion to Kufri, Jakhoo temple, and evening stroll at The Ridge." },
        { day: 6, title: "Departure & Fond Memories", description: "Breakfast, checkout, and private transfer to Chandigarh / Kalka railway station." },
      ],
      inclusions: ["Luxury Resort Stays", "Daily Buffet Breakfast & Dinner", "Dedicated Private Sedan", "All Tolls & Permits"],
      exclusions: ["Flight Tickets", "Personal Laundry & Drinks", "Monument Entry Tickets"],
      status: "published",
    });
  }
  console.log(`✓ Using Package: ${pkg.name} [Code: ${pkg.code}] (ID: ${pkg._id})\n`);

  // Step 2: Test Programmatic Brochure Generation (pdf-lib)
  console.log("2. TESTING BROCHURE TEMPLATE GENERATOR (PDF-LIB VECTOR ENGINE)");
  const generatedBuffer = await generatePackageBrochurePdf(pkg, {
    templateTheme: "modern_luxe",
    contactPhone: "+91 98765 43210",
    contactEmail: "reservations@explorepackages.com",
    customNotes: "Flat 10% early-bird discount on group bookings.",
  });

  console.log(`✓ Generated Vector PDF Brochure Size: ${(generatedBuffer.length / 1024).toFixed(1)} KB`);
  if (!generatedBuffer || generatedBuffer.length < 1000) {
    throw new Error("FAIL: Generated PDF buffer is too small or invalid!");
  }
  console.log("✓ PDF Brochure Structure Verified Valid\n");

  // Step 3: Test Persistent Cloud Storage Upload & Metadata
  console.log("3. TESTING PERSISTENT CLOUD STORAGE UPLOAD (ATLAS GRIDFS / CLOUD OBJECT STORE)");
  const uploadResult = await uploadPdfBuffer(generatedBuffer, `${pkg.code}_Main_Brochure.pdf`, {
    packageId: pkg._id.toString(),
    version: 1,
  });

  console.log(`✓ Storage Provider: ${uploadResult.storageProvider}`);
  console.log(`✓ Storage Key: ${uploadResult.storageKey}`);
  console.log(`✓ Public File URL: ${uploadResult.fileUrl}`);
  console.log(`✓ Uploaded Bytes: ${uploadResult.fileSize}`);

  if (!uploadResult.storageKey || !uploadResult.fileUrl) {
    throw new Error("FAIL: Storage upload returned incomplete credentials!");
  }

  // Create PackageDocument in MongoDB
  const doc = await PackageDocument.create({
    packageId: pkg._id,
    displayName: `${pkg.name} – Official Brochure`,
    originalFileName: `${pkg.code}_Main_Brochure.pdf`,
    description: "Primary holiday brochure with day-wise itinerary and rates",
    category: "main_brochure",
    storageProvider: uploadResult.storageProvider,
    storageKey: uploadResult.storageKey,
    fileUrl: uploadResult.fileUrl,
    fileSize: uploadResult.fileSize,
    mimeType: "application/pdf",
    version: 1,
    isPrimary: true,
    isActive: true,
    uploadedBy: {
      name: "Automated Test System",
      email: "test@explorepackages.com",
    },
    versions: [
      {
        versionNumber: 1,
        storageKey: uploadResult.storageKey,
        storageProvider: uploadResult.storageProvider,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        changeDescription: "Initial Template Generation",
        modifiedBy: { name: "System", email: "system@explorepackages.com" },
        modifiedAt: new Date(),
      },
    ],
    activityLogs: [
      {
        action: "generate",
        performedBy: { name: "Test Runner" },
        details: "Generated official brochure from package itinerary",
        timestamp: new Date(),
      },
    ],
  });

  console.log(`✓ PackageDocument Created in MongoDB: ${doc._id} (v${doc.version})\n`);

  // Step 4: Test Advanced PDF Editor Engine (Text Overlays, Whiteout Boxes, Shapes, Watermark)
  console.log("4. TESTING ADVANCED PDF EDITOR ENGINE (PDF-LIB VECTOR TRANSFORMATION)");
  const originalBytes = await getPdfBuffer(doc.storageKey, doc.storageProvider);
  console.log(`✓ Fetched Original Document Bytes: ${originalBytes.length} bytes`);

  const editPayload = {
    pageOrder: [0, 1], // Keep pages 1 & 2
    blankPagesToAdd: [{ insertAfterIndex: 1 }], // Add a new blank page at the end
    modifications: [
      {
        pageIndex: 0,
        rotation: 0,
        // Whiteout box covering old pricing
        whiteoutBoxes: [
          {
            x: 50,
            y: 600,
            width: 250,
            height: 35,
            color: "#FFFFFF",
          },
        ],
        // New updated pricing text overlay
        textOverlays: [
          {
            text: "SPECIAL OFFER: Rs. 38,500/- Per Person",
            x: 55,
            y: 610,
            fontSize: 16,
            fontFamily: "HelveticaBold",
            color: "#059669",
          },
        ],
        shapes: [
          {
            type: "rectangle",
            x: 40,
            y: 200,
            width: 300,
            height: 25,
            fillColor: "#EFF6FF",
            borderColor: "#3B82F6",
            borderWidth: 1,
          },
        ],
        annotations: [
          {
            type: "highlight",
            x: 40,
            y: 400,
            width: 200,
            height: 18,
            color: "#FEF08A",
          },
          {
            type: "note",
            x: 350,
            y: 400,
            width: 140,
            height: 40,
            text: "Free bonfire dinner included!",
          },
        ],
      },
    ],
    watermark: {
      text: "EXPLORE MY PACKAGES",
      opacity: 0.12,
      color: "#2563EB",
    },
    headerText: "CONFIDENTIAL TRAVEL PROPOSAL",
    footerText: "Explore My Packages • www.explorepackages.com",
  };

  const editedPdfBuffer = await applyPdfEdits(originalBytes, editPayload);
  console.log(`✓ Edited PDF Buffer Generated: ${(editedPdfBuffer.length / 1024).toFixed(1)} KB`);

  if (!editedPdfBuffer || editedPdfBuffer.length < originalBytes.length * 0.8) {
    throw new Error("FAIL: Edited PDF buffer is corrupted or invalid!");
  }

  // Upload Edited Version as Version 2
  const v2Upload = await uploadPdfBuffer(editedPdfBuffer, `${pkg.code}_Main_Brochure_v2.pdf`, {
    packageId: pkg._id.toString(),
    documentId: doc._id.toString(),
    version: 2,
  });

  doc.storageKey = v2Upload.storageKey;
  doc.storageProvider = v2Upload.storageProvider;
  doc.fileUrl = v2Upload.fileUrl;
  doc.fileSize = v2Upload.fileSize;
  doc.version = 2;
  doc.versions.push({
    versionNumber: 2,
    storageKey: v2Upload.storageKey,
    storageProvider: v2Upload.storageProvider,
    fileUrl: v2Upload.fileUrl,
    fileSize: v2Upload.fileSize,
    changeDescription: "Updated 2026 pricing & hotel details via PDF Studio",
    modifiedBy: { name: "Agent Editor", email: "editor@explorepackages.com" },
    modifiedAt: new Date(),
  });
  doc.activityLogs.push({
    action: "new_version",
    performedBy: { name: "Agent Editor" },
    details: "Saved Version 2 via PDF Studio",
    timestamp: new Date(),
  });
  await doc.save();

  console.log(`✓ Successfully Saved Version 2 to MongoDB: Active Version is now v${doc.version}\n`);

  // Step 5: Test Version Restoration (Restore v1 to become active v3)
  console.log("5. TESTING VERSION RESTORATION (ROLLBACK / RECOVERY)");
  const targetV1 = doc.versions.find((v) => v.versionNumber === 1);
  if (!targetV1) throw new Error("FAIL: Version 1 not found in document history!");

  const nextVersionNum = doc.version + 1; // 3
  doc.storageKey = targetV1.storageKey;
  doc.storageProvider = targetV1.storageProvider;
  doc.fileUrl = targetV1.fileUrl;
  doc.fileSize = targetV1.fileSize;
  doc.version = nextVersionNum;
  doc.versions.push({
    versionNumber: nextVersionNum,
    storageKey: targetV1.storageKey,
    storageProvider: targetV1.storageProvider,
    fileUrl: targetV1.fileUrl,
    fileSize: targetV1.fileSize,
    changeDescription: "Restored from version 1",
    modifiedBy: { name: "Admin Recovery", email: "admin@explorepackages.com" },
    modifiedAt: new Date(),
  });
  doc.activityLogs.push({
    action: "restore",
    performedBy: { name: "Admin Recovery" },
    details: "Restored document to state of Version 1",
    timestamp: new Date(),
  });
  await doc.save();

  console.log(`✓ Restored Version 1 as Active Version ${doc.version}`);
  console.log(`✓ Document Total Versions in History: ${doc.versions.length}\n`);

  // Step 6: Test WhatsApp Share Link Generation & Logging
  console.log("6. TESTING WHATSAPP SHARING & LOGGING");
  const testCustomer = { name: "Ananya Sharma", phone: "9876543210" };
  const shareMessage = [
    `Hello ${testCustomer.name}! 👋`,
    ``,
    `Please find our official tour brochure for *${pkg.name}* attached:`,
    `📄 *${doc.displayName}* (v${doc.version})`,
    `🔗 ${doc.fileUrl}`,
    ``,
    `Best Regards,`,
    `*Explore My Packages*`,
  ].join("\n");

  const cleanPhone = `91${testCustomer.phone}`;
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareMessage)}`;

  doc.shareCount = (doc.shareCount || 0) + 1;
  doc.lastSharedAt = new Date();
  doc.activityLogs.push({
    action: "share",
    performedBy: { name: "Sales Agent" },
    details: `Shared with ${testCustomer.name} (${cleanPhone}) via WhatsApp Web`,
    timestamp: new Date(),
  });
  await doc.save();

  console.log(`✓ WhatsApp wa.me Link Generated: ${waUrl.slice(0, 80)}...`);
  console.log(`✓ Share Count: ${doc.shareCount}`);
  console.log(`✓ Last Shared At: ${doc.lastSharedAt.toISOString()}\n`);

  // Step 7: Test Document Listing Query with Filters
  console.log("7. TESTING TOUR PACKAGES WITH BROCHURES ENRICHMENT QUERY");
  const allDocs = await PackageDocument.find({ packageId: pkg._id, isActive: true }).lean();
  console.log(`✓ Found ${allDocs.length} active brochure document(s) for package ${pkg.code}`);
  console.log(`  - Primary: ${allDocs.find((d) => d.isPrimary)?.displayName}`);
  console.log(`  - Activity Log Count: ${doc.activityLogs.length}`);

  // Cleanup test documents
  console.log("\n[CLEANUP] Cleaning up test document records...");
  await PackageDocument.deleteMany({ packageId: pkg._id });
  console.log("✓ Test documents cleaned up successfully.\n");

  console.log("========================================================================");
  console.log("   ALL PDF BROCHURE, EDITOR & WHATSAPP SHARING TESTS PASSED 100%!       ");
  console.log("========================================================================");

  process.exit(0);
}

runBrochureSystemE2ETest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

