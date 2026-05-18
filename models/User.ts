import { Schema, model, models, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Password will be hashed, so it's optional on the interface
  role: 'candidate' | 'recruiter';
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter'],
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Pre-save hook to hash password automatically before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

export default models.User || model<IUser>('User', UserSchema);
