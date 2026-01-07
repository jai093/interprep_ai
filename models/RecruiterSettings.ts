import { Schema, model, Document, Types } from 'mongoose';

export interface IRecruiterSettings extends Document {
  user: Types.ObjectId;
  emailNotifications: boolean;
  assessmentReminders: boolean;
  weeklyReports: boolean;
  autoReject: boolean;
  passingScore: number;
  timeLimit: number;
}

const RecruiterSettingsSchema = new Schema<IRecruiterSettings>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  emailNotifications: { type: Boolean, default: true },
  assessmentReminders: { type: Boolean, default: true },
  weeklyReports: { type: Boolean, default: false },
  autoReject: { type: Boolean, default: false },
  passingScore: { type: Number, default: 70 },
  timeLimit: { type: Number, default: 60 },
});

export default model<IRecruiterSettings>('RecruiterSettings', RecruiterSettingsSchema);
