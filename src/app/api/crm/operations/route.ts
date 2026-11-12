import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import TripOperation from "@/models/TripOperation";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { operationId: { $regex: search, $options: "i" } },
        { bookingRef: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { packageName: { $regex: search, $options: "i" } },
        { driverName: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
      ];
    }

    const operations = await TripOperation.find(query).sort({ departureDate: 1 });

    const totalOperations = await TripOperation.countDocuments();
    const onTourCount = await TripOperation.countDocuments({ status: "on_tour" });
    const scheduledCount = await TripOperation.countDocuments({ status: "scheduled" });
    const completedCount = await TripOperation.countDocuments({ status: "completed" });

    return NextResponse.json({
      success: true,
      data: operations,
      summary: {
        totalOperations,
        onTourCount,
        scheduledCount,
        completedCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/operations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch trip operations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      bookingRef,
      customerName,
      packageName,
      departureDate,
      returnDate,
      travellersCount = 2,
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleModel,
      guideName,
      guidePhone,
      hotelName,
      hotelCity,
      notes,
    } = body;

    if (!customerName || !packageName || !departureDate) {
      return NextResponse.json(
        { success: false, error: "Customer, package, and departure date are required" },
        { status: 400 }
      );
    }

    const count = await TripOperation.countDocuments();
    const operationId = `OPS-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Link booking if bookingRef provided
    let bookingId = undefined;
    if (bookingRef) {
      const b = await Booking.findOne({ bookingRef: bookingRef.trim().toUpperCase() });
      if (b) bookingId = b._id;
    }

    const defaultChecklist = [
      { task: "Hotel Booking Voucher Confirmed", completed: true, completedAt: new Date() },
      { task: "Vehicle & Driver Assigned", completed: Boolean(driverName), completedAt: driverName ? new Date() : undefined },
      { task: "Welcome Kit & Itinerary Shared with Guests", completed: false },
      { task: "Inner Line Travel Permits Acquired", completed: false },
      { task: "Post-Tour Feedback & Review Collected", completed: false },
    ];

    const hotelAllocations = hotelName
      ? [
          {
            hotelName,
            city: hotelCity || "Destination HQ",
            checkIn: new Date(departureDate),
            checkOut: returnDate ? new Date(returnDate) : new Date(new Date(departureDate).getTime() + 4 * 24 * 60 * 60 * 1000),
            roomType: "Deluxe Mountain View",
            roomsCount: 1,
          },
        ]
      : [];

    const newOp = await TripOperation.create({
      operationId,
      bookingId,
      bookingRef: bookingRef ? bookingRef.toUpperCase() : `DIRECT-${Date.now().toString().slice(-4)}`,
      customerName,
      packageName,
      departureDate: new Date(departureDate),
      returnDate: returnDate ? new Date(returnDate) : new Date(new Date(departureDate).getTime() + 5 * 24 * 60 * 60 * 1000),
      travellersCount: Number(travellersCount),
      driverName: driverName || "Pending Assignment",
      driverPhone: driverPhone || "",
      vehicleNumber: vehicleNumber || "Pending",
      vehicleModel: vehicleModel || "Innova Crysta / Tempo Traveller",
      guideName: guideName || "Local Guide",
      guidePhone: guidePhone || "",
      hotelAllocations,
      checklist: defaultChecklist,
      status: "scheduled",
      operationalExpensesTotal: 0,
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: newOp }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/operations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create trip operation" },
      { status: 500 }
    );
  }
}
