import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentRequestStatus =
  | "pending"
  | "completed"
  | "expired"
  | "refunded"
  | "held";

export interface IPaymentRequest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  pageId: mongoose.Types.ObjectId;
  pageSlug: string;
  requestId: string;
  title: string;
  description: string;
  expectedAmount: string;
  expectedAsset: string;
  memo: string;
  receiveToPublicKey: string;
  status: PaymentRequestStatus;
  expiresAt: Date;
  paidAt: Date | null;
  txHash: string | null;
  paidAmount: string | null;
  paidByAddress: string | null;
  refundTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRequestSchema = new Schema<IPaymentRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pageId: { type: Schema.Types.ObjectId, ref: "PaymentPage", required: true },
    pageSlug: { type: String, required: true },
    requestId: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    expectedAmount: { type: String, required: true },
    expectedAsset: { type: String, default: "USDC" },
    memo: { type: String, required: true, unique: true },
    receiveToPublicKey: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "expired", "refunded", "held"],
      default: "pending",
    },
    expiresAt: { type: Date, required: true },
    paidAt: { type: Date, default: null },
    txHash: { type: String, default: null },
    paidAmount: { type: String, default: null },
    paidByAddress: { type: String, default: null },
    refundTxHash: { type: String, default: null },
  },
  { timestamps: true }
);

PaymentRequestSchema.index({ memo: 1 });
PaymentRequestSchema.index({ requestId: 1 });
PaymentRequestSchema.index({ userId: 1 });
PaymentRequestSchema.index({ status: 1, expiresAt: 1 });

const PaymentRequest: Model<IPaymentRequest> =
  mongoose.models.PaymentRequest ??
  mongoose.model<IPaymentRequest>("PaymentRequest", PaymentRequestSchema);

export default PaymentRequest;
