import { Schema, model, Document, Types } from 'mongoose';
import { InterviewConfigSchema } from '../../models/types';
import type { InterviewConfig } from '../../types';

export interface IAssessment extends Document {
  createdBy: string; // store recruiter email to match frontend
  jobRole: string;
  config: Omit<InterviewConfig, 'role'>;
  questions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    createdBy: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

export default model<IAssessment>('Assessment', AssessmentSchema);
