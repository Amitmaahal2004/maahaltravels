import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Customer from "@/models/Customer";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "leads", "edit");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();
    const { action, ...updateData } = body;

    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Convert lead to customer action
    if (action === "convert") {
      let customer = await Customer.findOne({ email: lead.email.toLowerCase() });
      if (!customer) {
        const allowedSources = ["website", "whatsapp", "instagram", "google", "referral", "other"] as const;
        const mappedSource = allowedSources.includes(lead.leadSource as any) ? (lead.leadSource as any) : "other";

        customer = await Customer.create({
          name: lead.name,
          email: lead.email.toLowerCase(),
          phone: lead.phone,
          whatsapp: lead.whatsapp || lead.phone,
          source: mappedSource,
          customerType: "individual",
          status: "active",
          tags: ["Converted from Lead", lead.destination],
          notes: `Converted from lead on ${new Date().toLocaleDateString()}. Notes: ${lead.notes || "None"}`,
          assignedTo: user.id,
        });
      }

      lead.status = "converted";
      lead.convertedCustomerId = customer._id;
      await lead.save();

      return NextResponse.json({
        success: true,
        message: "Lead successfully converted to customer",
        customer,
        lead,
      });
    }

    // Normal update
    const updated = await Lead.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/crm/leads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
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

    const permError = assertPermission(user, "leads", "delete");
    if (permError) return permError;

    await connectToDatabase();

    const deleted = await Lead.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/leads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
