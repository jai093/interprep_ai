import { Schema, model, Document, Types } from 'mongoose';

export interface IRecruiterProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  company: string;
}

const RecruiterProfileSchema = new Schema<IRecruiterProfile>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    default: '',
  },
});

export default model<IRecruiterProfile>('RecruiterProfile', RecruiterProfileSchema);
