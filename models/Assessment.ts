import { Schema, model, Document, Types } from 'mongoose';
import { InterviewConfigSchema } from './types';
import { InterviewConfig } from '../types';

export interface IAssessment extends Document {
  createdBy: Types.ObjectId; // The recruiter (User) who created it
  jobRole: string;
  config: Omit<InterviewConfig, 'role'>;
  questions: string[];
}

const AssessmentSchema = new Schema<IAssessment>({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobRole: {
    type: String,
    required: true,
  },
  config: {
    type: InterviewConfigSchema,
    required: true,
  },
  questions: {
    type: [String],
    required: true,
    validate: (v: string | any[]) => Array.isArray(v) && v.length > 0,
  },
}, {
  timestamps: true,
});

export default model<IAssessment>('Assessment', AssessmentSchema);
