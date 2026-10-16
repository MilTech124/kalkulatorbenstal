import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    login: { type: String, required: true, unique: true, trim: true, lowercase: true },
    /** Format: scrypt$<salt hex>$<hash hex> (patrz lib/auth.ts). */
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { createdAt: Date; updatedAt: Date };

export const UserModel = (mongoose.models.User as mongoose.Model<UserDoc>) || mongoose.model<UserDoc>('User', userSchema);
