import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Task from "@/models/Task";
import User from "@/models/User";

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
    const priority = searchParams.get("priority") || "";

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { assignedToName: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });

    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const pendingTasks = await Task.countDocuments({ status: { $in: ["pending", "in_progress"] } });
    const urgentTasks = await Task.countDocuments({ priority: "urgent", status: { $ne: "completed" } });

    const staffUsers = await User.find({ status: "active" }, "name email");

    return NextResponse.json({
      success: true,
      data: tasks,
      staffUsers,
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        urgentTasks,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/tasks error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks" },
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
      title,
      description,
      priority = "medium",
      dueDate,
      assignedToId,
      assignedToName,
      status = "pending",
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 });
    }

    const newTask = await Task.create({
      title,
      description: description || "",
      priority,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignedTo: (assignedToId || user.id) as any,
      assignedToName: assignedToName || user.name,
      createdBy: user.id as any,
      createdByName: user.name,
      status,
      comments: [],
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/tasks error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
