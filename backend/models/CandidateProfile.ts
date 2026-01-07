import { Schema, model, Document, Types } from 'mongoose';
import { ResumeDataSchema } from '../../models/types';
import type { ResumeData } from '../../types';

export interface ICandidateProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  linkedinUrl: string;
  skills: string[];
  languages: string[];
  profilePhotoUrl: string;
  resumeText?: string;
  resumeData?: ResumeData;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateProfileSchema = new Schema<ICandidateProfile>(
  {
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
    linkedinUrl: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    profilePhotoUrl: {
      type: String,
      default: '',
    },
    resumeText: {
      type: String,
      default: '',
    },
    resumeData: {
      type: ResumeDataSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model<ICandidateProfile>('CandidateProfile', CandidateProfileSchema);
