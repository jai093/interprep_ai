import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AssessmentContext {
    jobRole: string;
    transcript: { sender: string; content: string }[];
    previousTopic?: string;
}

interface EvaluationResult {
    score: number;
    feedback: string;
    metrics: {
        relevance: number;
        clarity: number;
        correctness: number;
    };
}

export interface ReportResult {
    metrics: {
        strengths: string[];
        weaknesses: string[];
        communicationScore: number;
    };
    candidateReport: string;
    recruiterReport: string;
}

export const generateNextQuestion = async (context: AssessmentContext): Promise<string> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const historyText = context.transcript
        .map((t) => `${t.sender === 'ai' ? 'Interviewer' : 'Candidate'}: ${t.content}`)
        .join('\n');

    const prompt = `
    You are an AI technical interviewer for the role of ${context.jobRole}.
    
    Interview History:
    ${historyText}

    Based on the history (or stating from scratch if empty), generate the next interview question. 
    - If this is the start, ask a relevant opening question about their background or core skills.
    - If the candidate just answered, ask a follow-up or move to the next relevant topic.
    - Keep the question professional, concise, and challenging but fair.
    - Do NOT repeat questions.
    - Output ONLY the question text.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('AI Question Generation Failed:', error);
        return "Could you tell me about your experience with this technology?"; // Fallback
    }
};

export const evaluateResponse = async (
    question: string,
    answer: string,
    jobRole: string
): Promise<EvaluationResult> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Role: ${jobRole}
    Question: "${question}"
    Candidate Answer: "${answer}"

    Evaluate the answer based on:
    1. Relevance (0-10)
    2. Clarity (0-10)
    3. Technical Correctness (0-10)

    Provide a JSON output ONLY:
    {
      "score": number, // Overall score 0-10
      "feedback": string, // 1-2 sentence feedback
      "metrics": {
        "relevance": number,
        "clarity": number,
        "correctness": number
      }
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, '').trim(); // Clean md blocks
        return JSON.parse(text);
    } catch (error) {
        console.error('AI Evaluation Failed:', error);
        return {
            score: 5,
            feedback: "Evaluation unavailable at this moment.",
            metrics: { relevance: 5, clarity: 5, correctness: 5 }
        };
    }
};

export const generateReport = async (
    jobRole: string,
    transcript: { sender: string; content: string }[],
    evaluations: EvaluationResult[]
): Promise<ReportResult> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const transcriptText = transcript
        .map((t) => `${t.sender === 'ai' ? 'Interviewer' : 'Candidate'}: ${t.content}`)
        .join('\n');

    const prompt = `
    Role: Senior Technical Recruiter & Career Coach
    Job Role: ${jobRole}

    Interview Transcript:
    ${transcriptText}

    Per-Question Evaluations:
    ${JSON.stringify(evaluations, null, 2)}

    Generate a final assessment report in JSON format ONLY:
    {
        "metrics": {
            "strengths": ["string", "string"],
            "weaknesses": ["string", "string"],
            "communicationScore": number // 0-10
        },
        "candidateReport": "Constructive feedback for the candidate (2 paragraphs)",
        "recruiterReport": "Summary for the hiring manager (2 paragraphs)"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('AI Report Generation Failed:', error);
        return {
            metrics: { strengths: ["N/A"], weaknesses: ["N/A"], communicationScore: 0 },
            candidateReport: "Report generation unavailable.",
            recruiterReport: "Report generation unavailable."
        };
    }
};
