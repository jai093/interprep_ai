import { ollamaChatJSON } from "./ollamaService";
import { TranscriptEntry } from "../../types";

export interface ReportResult {
    metrics: {
        strengths: string[];
        weaknesses: string[];
        communicationScore: number;
    };
    candidateReport: string;
    recruiterReport: string;
}

export const generateReport = async (
    jobRole: string,
    transcript: TranscriptEntry[]
): Promise<ReportResult> => {
    const transcriptText = transcript
        .map((t) => `Question: ${t.question}\nAnswer: ${t.answer}\nScore: ${t.feedback?.score || 0}/10\nFeedback: ${t.feedback?.evaluation?.clarity || 'N/A'}`)
        .join('\n\n');

    const prompt = `
    Role: Senior Technical Recruiter & Career Coach
    Job Role: ${jobRole}

    Interview Transcript & Preliminary Scores:
    ${transcriptText}

    Task: Generate a final assessment report in valid JSON format.
    
    The JSON object must have this exact structure:
    {
        "metrics": {
            "strengths": ["string", "string", "string"],
            "weaknesses": ["string", "string", "string"],
            "communicationScore": number
        },
        "candidateReport": "A constructive, encouraging 2-paragraph summary for the candidate, highlighting what they did well and how to improve.",
        "recruiterReport": "A professional, objective 2-paragraph summary for the hiring manager, assessing technical fit and soft skills. Recommend if they should be shortlisted."
    }
    `;

    try {
        const result = await ollamaChatJSON(
             [
                { role: 'system', content: 'You are an expert HR assessor. Output only valid JSON matching the requested structure.' },
                { role: 'user', content: prompt }
            ],
            { temperature: 0.4 }
        );
        return result as ReportResult;
    } catch (error) {
        console.error('AI Report Generation Failed:', error);
        return {
            metrics: { strengths: ["Analysis unavailable"], weaknesses: ["Analysis unavailable"], communicationScore: 0 },
            candidateReport: "We could not generate your report at this time. Please contact support.",
            recruiterReport: "Automated analysis failed."
        };
    }
};
