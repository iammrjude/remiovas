import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  username: string;
  displayName: string;
  bio: string;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  walletPublicKey: string;
  walletEncryptedSecret: string;
  walletActivated: boolean;
  usdcBalance: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_-]+$/,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    bio: { type: String, default: "", trim: true, maxlength: 160 },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpiry: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpiry: { type: Date, default: null },
    walletPublicKey: { type: String, required: true },
    walletEncryptedSecret: { type: String, required: true },
    walletActivated: { type: Boolean, default: false },
    usdcBalance: { type: String, default: "0" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.passwordHash;
        delete ret.walletEncryptedSecret;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        return ret;
      },
    },
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ walletPublicKey: 1 });

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
