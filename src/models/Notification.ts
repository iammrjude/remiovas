import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "payment_received"
  | "transfer_sent"
  | "transfer_received"
  | "email_verified"
  | "refund_issued"
  | "wallet_activated"
  | "payment_request_completed"
  | "payment_request_expired";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, string>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "payment_received",
        "transfer_sent",
        "transfer_received",
        "email_verified",
        "refund_issued",
        "wallet_activated",
        "payment_request_completed",
        "payment_request_expired",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Map, of: String, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
