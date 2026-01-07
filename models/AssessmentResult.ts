import { Schema, model, Document, Types } from 'mongoose';
import { EmbeddedInterviewSessionSchema } from './types';
import { InterviewSession } from '../types';

export interface IAssessmentResult extends Document {
  assessment: Types.ObjectId;
  candidateName: string;
  candidateEmail: string;
  candidateUser?: Types.ObjectId; // The candidate's User ID if they are registered
  session: InterviewSession; // Embedded full interview session data
}

const AssessmentResultSchema = new Schema<IAssessmentResult>({
  assessment: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  candidateEmail: {
    type: String,
    required: true,
  },
  candidateUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  session: {
    type: EmbeddedInterviewSessionSchema,
    required: true,
  },
}, {
  timestamps: true,
});

export default model<IAssessmentResult>('AssessmentResult', AssessmentResultSchema);
