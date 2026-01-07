import { Schema, model, Document } from 'mongoose';

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

// TODO: Add pre-save hook for password hashing before integrating backend logic
// UserSchema.pre<IUser>('save', async function (next) { ... });

export default model<IUser>('User', UserSchema);
