import { Schema, model, Document, Types } from 'mongoose';

export interface ISessionResponse {
    questionId: string;
    questionText: string;
    answerText: string; // or audioUrl later
    evaluation?: {
        score: number; // 0-10
        feedback: string;
        metrics: {
            relevance: number;
            clarity: number;
            correctness: number;
        };
    };
    timestamp: Date;
}

export interface ISessionTranscript {
    sender: 'ai' | 'user';
    content: string;
    timestamp: Date;
}

export interface IAssessmentSession extends Document {
    assessmentId: Types.ObjectId;
    candidateId: Types.ObjectId;
    status: 'initialized' | 'in-progress' | 'completed' | 'expired';
    transcript: ISessionTranscript[];
    responses: ISessionResponse[];
    metrics: {
        overallScore?: number;
        strengths: string[];
        weaknesses: string[];
        communicationScore?: number;
    };
    currentQuestionIndex: number; // For tracking progress if using fixed list, or just count
    metadata: {
        startedAt: Date;
        completedAt?: Date;
        expiresAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AssessmentSessionSchema = new Schema<IAssessmentSession>(
    {
        assessmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Assessment',
            required: true,
        },
        candidateId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['initialized', 'in-progress', 'completed', 'expired'],
            default: 'initialized',
        },
        transcript: [
            {
                sender: { type: String, enum: ['ai', 'user'], required: true },
                content: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
            },
        ],
        responses: [
            {
                questionId: String,
                questionText: String,
                answerText: String,
                evaluation: {
                    score: Number,
                    feedback: String,
                    metrics: {
                        relevance: Number,
                        clarity: Number,
                        correctness: Number,
                    },
                },
                timestamp: { type: Date, default: Date.now },
            },
        ],
        metrics: {
            overallScore: Number,
            strengths: [String],
            weaknesses: [String],
            communicationScore: Number,
        },
        currentQuestionIndex: { type: Number, default: 0 },
        metadata: {
            startedAt: { type: Date, default: Date.now },
            completedAt: Date,
            expiresAt: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for quick lookups by candidate and status
AssessmentSessionSchema.index({ candidateId: 1, assessmentId: 1 });
AssessmentSessionSchema.index({ status: 1 });

export default model<IAssessmentSession>('AssessmentSession', AssessmentSessionSchema);
