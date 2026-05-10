import mongoose, { Schema, Document, Model } from "mongoose";

export type AmountMode = "flexible" | "fixed" | "tipjar";

export interface ITipAmount {
  label: string;
  amount: string;
}

export interface IPaymentPage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  description: string;
  amountMode: AmountMode;
  fixedAmount: string | null;
  tipAmounts: ITipAmount[];
  receiveToPublicKey: string;
  isActive: boolean;
  totalReceived: string;
  paymentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentPageSchema = new Schema<IPaymentPage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      match: /^[a-z0-9-]+$/,
    },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    amountMode: {
      type: String,
      enum: ["flexible", "fixed", "tipjar"],
      default: "flexible",
    },
    fixedAmount: { type: String, default: null },
    tipAmounts: [
      {
        label: { type: String, required: true },
        amount: { type: String, required: true },
      },
    ],
    receiveToPublicKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    totalReceived: { type: String, default: "0" },
    paymentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PaymentPageSchema.index({ slug: 1 });
PaymentPageSchema.index({ userId: 1 });

const PaymentPage: Model<IPaymentPage> =
  mongoose.models.PaymentPage ??
  mongoose.model<IPaymentPage>("PaymentPage", PaymentPageSchema);

export default PaymentPage;
