import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import TripOperation from "@/models/TripOperation";

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

    const op = await TripOperation.findById(params.id);
    if (!op) {
      return NextResponse.json({ success: false, error: "Trip Operation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: op });
  } catch (error: any) {
    console.error("GET /api/crm/operations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch operation" },
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

    const op = await TripOperation.findById(params.id);
    if (!op) {
      return NextResponse.json({ success: false, error: "Trip Operation not found" }, { status: 404 });
    }

    // Toggle checklist item action
    if (body.action === "toggle_checklist") {
      const { taskIndex } = body;
      if (taskIndex !== undefined && op.checklist[taskIndex]) {
        op.checklist[taskIndex].completed = !op.checklist[taskIndex].completed;
        op.checklist[taskIndex].completedAt = op.checklist[taskIndex].completed ? new Date() : undefined;
        await op.save();
        return NextResponse.json({ success: true, data: op });
      }
    }

    const updated = await TripOperation.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/crm/operations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update operation" },
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

    const deleted = await TripOperation.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Trip Operation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Trip Operation deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/operations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete operation" },
      { status: 500 }
    );
  }
}
