import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType =
  | "send"
  | "receive"
  | "deposit"
  | "withdraw"
  | "fee"
  | "refund";

export type TransactionStatus = "pending" | "completed" | "failed";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  asset: string;
  fee: string;
  netAmount: string;
  fromAddress: string | null;
  toAddress: string | null;
  toUsername: string | null;
  memo: string | null;
  txHash: string | null;
  paymentPageId: mongoose.Types.ObjectId | null;
  paymentRequestId: mongoose.Types.ObjectId | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["send", "receive", "deposit", "withdraw", "fee", "refund"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    amount: { type: String, required: true },
    asset: { type: String, default: "USDC" },
    fee: { type: String, default: "0" },
    netAmount: { type: String, required: true },
    fromAddress: { type: String, default: null },
    toAddress: { type: String, default: null },
    toUsername: { type: String, default: null },
    memo: { type: String, default: null },
    txHash: { type: String, default: null },
    paymentPageId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentPage",
      default: null,
    },
    paymentRequestId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentRequest",
      default: null,
    },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ txHash: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
