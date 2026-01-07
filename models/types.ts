import { Schema } from 'mongoose';

// --- Embedded Schemas for ResumeData ---
export const ExperienceSchema = new Schema({
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    duration: { type: String, required: true },
    responsibilities: [{ type: String }]
}, { _id: false });

export const EducationSchema = new Schema({
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, required: true }
}, { _id: false });

export const ResumeDataSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    summary: { type: String },
    skills: [{ type: String }],
    experience: [ExperienceSchema],
    education: [EducationSchema]
}, { _id: false });


// --- Embedded Schema for CareerRoadmap ---
export const RoadmapStepSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    resources: [{ type: String }]
}, { _id: false });


// --- Embedded Schemas for InterviewSession ---
export const InterviewConfigSchema = new Schema({
    type: { type: String, enum: ['Behavioral', 'Technical', 'Role-Specific'], required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    persona: { type: String, enum: ['Neutral', 'Friendly', 'Strict'], required: true },
    role: { type: String } // Role is part of the parent session/assessment, but included here for completeness
}, { _id: false });

export const InterviewFeedbackSchema = new Schema({
    score: { type: Number, required: true },
    evaluation: {
        clarity: { type: String },
        relevance: { type: String },
        structure: { type: String },
        confidence: { type: String }
    },
    grammarCorrection: {
        hasErrors: { type: Boolean },
        explanation: { type: String }
    },
    professionalRewrite: { type: String },
    tips: [{ type: String }],
    alexisResponse: { type: String },
    wordCount: { type: Number },
    fillerWords: { type: Number },
    hasExample: { type: Boolean },
    responseQuality: { type: Number }
}, { _id: false });

export const TranscriptEntrySchema = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    feedback: { type: InterviewFeedbackSchema, required: true }
}, { _id: false });

export const InterviewSummarySchema = new Schema({
    overallSummary: { type: String },
    actionableTips: [{ type: String }],
    encouragement: { type: String },
    simulatedFacialExpressionAnalysis: { type: String },
    simulatedBodyLanguageAnalysis: { type: String },
    simulatedAudioAnalysis: { type: String }
}, { _id: false });

// This schema is for embedding a full session inside another document (like AssessmentResult)
export const EmbeddedInterviewSessionSchema = new Schema({
    date: { type: Date, required: true },
    type: { type: String, required: true },
    duration: { type: Number, required: true },
    averageScore: { type: Number, required: true },
    config: { type: InterviewConfigSchema, required: true },
    transcript: { type: [TranscriptEntrySchema], required: true },
    summary: { type: InterviewSummarySchema, required: true }
}, { _id: false });
