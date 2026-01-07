import { Schema, model, Document, Types } from 'mongoose';
import { InterviewConfigSchema, TranscriptEntrySchema, InterviewSummarySchema } from './types';
import { InterviewConfig, TranscriptEntry, InterviewSummary } from '../types';

export interface IInterviewSession extends Document {
  user: Types.ObjectId; // The candidate who took the practice interview
  date: Date;
  type: string;
  duration: number;
  averageScore: number;
  config: InterviewConfig;
  transcript: TranscriptEntry[];
  summary: InterviewSummary;
}

const InterviewSessionSchema = new Schema<IInterviewSession>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    required: true,
  },
  duration: { // in seconds
    type: Number,
    required: true,
  },
  averageScore: {
    type: Number,
    required: true,
  },
  config: {
    type: InterviewConfigSchema,
    required: true,
  },
  transcript: {
    type: [TranscriptEntrySchema],
    required: true,
  },
  summary: {
    type: InterviewSummarySchema,
    required: true,
  },
}, {
  timestamps: true,
});

export default model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
