import { Schema, model, models, Document, Types } from 'mongoose';
import { EmbeddedInterviewSessionSchema } from '../../models/types';
import type { InterviewSession } from '../../types';

export interface IAssessmentResult extends Document {
  assessment: Types.ObjectId;
  candidateName: string;
  candidateEmail: string;
  candidateUser?: Types.ObjectId;
  session: InterviewSession;
  status: 'Pending' | 'Shortlisted' | 'Rejected' | 'Hold';
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentResultSchema = new Schema<IAssessmentResult>(
  {
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
    status: {
      type: String,
      enum: ['Pending', 'Shortlisted', 'Rejected', 'Hold'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

export default (models.AssessmentResult as any) || model<IAssessmentResult>('AssessmentResult', AssessmentResultSchema);
