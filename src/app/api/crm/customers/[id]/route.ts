import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const customer = await Customer.findById(params.id);
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const bookings = await Booking.find({ customerId: customer._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        customer,
        bookings,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/customers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    if (body.tags && typeof body.tags === "string") {
      body.tags = body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCustomer });
  } catch (error: any) {
    console.error("PUT /api/crm/customers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const deleted = await Customer.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/customers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
