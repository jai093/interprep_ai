import { Schema, model, Document, Types } from 'mongoose';
import { RoadmapStepSchema } from '../../models/types';
import type { RoadmapStep } from '../../types';

export interface ICareerRoadmap extends Document {
  user: Types.ObjectId;
  targetRole: string;
  skillGaps: string[];
  shortTermPlan: RoadmapStep[];
  longTermPlan: RoadmapStep[];
  createdAt: Date;
  updatedAt: Date;
}

const CareerRoadmapSchema = new Schema<ICareerRoadmap>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRole: {
      type: String,
      required: true,
    },
    skillGaps: {
      type: [String],
      default: [],
    },
    shortTermPlan: [RoadmapStepSchema],
    longTermPlan: [RoadmapStepSchema],
  },
  {
    timestamps: true,
  }
);

export default model<ICareerRoadmap>('CareerRoadmap', CareerRoadmapSchema);
