import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    await connectDB();

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: authUser.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: authUser.userId }),
      Notification.countDocuments({ userId: authUser.userId, isRead: false }),
    ]);

    return ok({ notifications, total, unreadCount, page, limit });
  } catch (err) {
    console.error("Notifications error:", err);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const body = await req.json();
    const { id, markAllRead } = body;

    await connectDB();

    if (markAllRead) {
      await Notification.updateMany({ userId: authUser.userId, isRead: false }, { $set: { isRead: true } });
    } else if (id) {
      await Notification.findOneAndUpdate({ _id: id, userId: authUser.userId }, { $set: { isRead: true } });
    }

    return ok({ message: "Notifications updated" });
  } catch (err) {
    console.error("Mark notification error:", err);
    return serverError();
  }
}
