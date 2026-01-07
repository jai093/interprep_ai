import { GoogleGenAI, Type } from "@google/genai";
import type { ResumeData, CareerRoadmap, InterviewFeedback, InterviewSummary, InterviewSession, FillBlankQuestion, FormalInformalPair, DictionaryModeFeedback, RepetitionFeedback, SpeakingTaskAnalysis, CoachingResponse, CoachChatMessage, InterviewConfig, TranscriptEntry } from '../types';

// Frontend: Vite exposes VITE_* variables via import.meta.env
// Get API key from Vite's exposed environment variables
const API_KEY = (import.meta.env as any)?.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

let ai: GoogleGenAI;
if (!API_KEY) {
  console.error('✗ Gemini API key not found. Set VITE_GEMINI_API_KEY in .env.local');
  // Create a dummy client that throws a clear error when used
  const dummy: any = { 
    models: { 
      generateContent: async () => { 
        throw new Error('Gemini API key missing. Set VITE_GEMINI_API_KEY in .env.local and restart dev server.'); 
      } 
    } 
  };
  ai = dummy as unknown as GoogleGenAI;
} else {
  console.log('✓ Gemini API key loaded successfully');
  ai = new GoogleGenAI({ apiKey: API_KEY });
}
const model = 'gemini-2.5-flash';

const resumeSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        summary: { type: Type.STRING, description: "A professional summary of 2-4 sentences." },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    jobTitle: { type: Type.STRING },
                    company: { type: Type.STRING },
                    duration: { type: Type.STRING, description: "e.g., 'Jan 2020 - Present'" },
                    responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['jobTitle', 'company', 'duration', 'responsibilities']
            }
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    year: { type: Type.STRING, description: "e.g., 'Graduated May 2018'" }
                },
                required: ['degree', 'institution', 'year']
            }
        }
    },
    required: ['name', 'email', 'phone', 'summary', 'skills', 'experience', 'education']
};


export const parseResume = async (resumeText: string): Promise<ResumeData> => {
    const prompt = `Analyze the following resume text. Your primary task is to extract all technical, soft, and other relevant skills mentioned. Populate the rest of the schema as accurately as possible. The 'skills' array should be a comprehensive list. Resume:\n\n${resumeText}`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumeSchema,
        },
    });
    
    // FIX: Trim whitespace from response text before parsing JSON.
    return JSON.parse(response.text.trim()) as ResumeData;
};

const roadmapSchema = {
    type: Type.OBJECT,
    properties: {
        targetRole: { type: Type.STRING },
        skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        shortTermPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    resources: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'description', 'duration', 'resources']
            }
        },
        longTermPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    resources: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'description', 'duration', 'resources']
            }
        }
    },
    required: ['targetRole', 'skillGaps', 'shortTermPlan', 'longTermPlan']
};

export const generateRoadmap = async (skills: string[], targetRole: string): Promise<CareerRoadmap> => {
    const prompt = `Act as an expert career coach. A candidate with the following skills: [${skills.join(', ')}] wants to become a "${targetRole}". 
Your task is to perform a detailed skill gap analysis. First, determine the essential skills required for the target role. Then, compare them to the candidate's current skills to identify what's missing. List these missing skills in the 'skillGaps' field. 
Based on these gaps, create a detailed short-term (1-3 months) and long-term (6-12 months) plan to acquire them. The plans should include specific topics, project ideas, and online resources.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: roadmapSchema
        },
    });
    
    // FIX: Trim whitespace from response text before parsing JSON.
    return JSON.parse(response.text.trim()) as CareerRoadmap;
};


export const generateNextQuestion = async (config: InterviewConfig, history: TranscriptEntry[], resume: ResumeData, questionCount: number): Promise<string> => {
    const historySummary = history.length > 0
        ? `Interview History (previous questions and answer quality scores): ${JSON.stringify(history.map(h => ({ question: h.question, answerQuality: h.feedback.responseQuality })))}`
        : 'This is the first question of the interview.';

    const prompt = `
# Persona: Expert Interviewer (Alexis)
You are Alexis, an AI interviewer hiring for a "${config.role}" position. You are conducting a ${config.difficulty} level ${config.type} interview.

# Candidate Context
- Resume Summary: "${resume.summary}"
- Key Skills: [${resume.skills.join(', ')}]

# Interview Progress
${historySummary}

# Task
Your task is to generate the NEXT interview question (${questionCount} of 5).
1.  The question must be relevant to the "${config.role}" position and tailored to the candidate's resume.
2.  **Crucially, you must adapt the difficulty.** If previous answers were strong (e.g., answerQuality > 75), ask a more challenging follow-up or a new complex question. If they were weak (e.g., answerQuality < 50), ask a simpler, foundational question to help the candidate recover.
3.  Do not repeat questions from the history.
4.  Ensure the question is open-ended and encourages a detailed response.
5.  Return ONLY the question text as a string. Do not include any other text, JSON, or explanation.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });

    return response.text.trim();
};

const feedbackSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "A numerical score from 0-100 for the answer, based on a strict evaluation." },
        responseQuality: { type: Type.NUMBER, description: "A score from 0-100 representing the quality of this specific answer for the transcript." },
        evaluation: {
            type: Type.OBJECT,
            properties: {
                clarity: { type: Type.STRING, description: "Brief, one-sentence feedback on clarity." },
                relevance: { type: Type.STRING, description: "Brief, one-sentence feedback on relevance." },
                structure: { type: Type.STRING, description: "Brief, one-sentence feedback on structure (e.g., STAR method)." },
                confidence: { type: Type.STRING, description: "Brief, one-sentence feedback on confidence inferred from the text." },
            },
            required: ['clarity', 'relevance', 'structure', 'confidence']
        },
        grammarCorrection: {
            type: Type.OBJECT,
            properties: {
                hasErrors: { type: Type.BOOLEAN, description: "True if grammatical errors or significant filler words were found." },
                explanation: { type: Type.STRING, description: "A brief explanation of any grammar mistake. Empty string if no errors." },
            },
            required: ['hasErrors', 'explanation']
        },
        professionalRewrite: { type: Type.STRING, description: "A rewritten, strong, and professional version of the candidate’s response." },
        tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array containing 1-2 actionable tips for improvement." },
        alexisResponse: { type: Type.STRING, description: "A friendly, conversational response from Alexis that summarizes the feedback. This is the text that will be spoken to the user." },
        wordCount: { type: Type.NUMBER, description: "The total number of words in the candidate's answer." },
        fillerWords: { type: Type.NUMBER, description: "The count of filler words like 'um', 'uh', 'like', 'you know', 'so'." },
        hasExample: { type: Type.BOOLEAN, description: "True if the candidate used a concrete example (e.g., mentioned a specific project, situation, or metric)." }
    },
    required: ['score', 'responseQuality', 'evaluation', 'grammarCorrection', 'professionalRewrite', 'tips', 'alexisResponse', 'wordCount', 'fillerWords', 'hasExample']
};


export const getInterviewFeedback = async (question: string, answer: string): Promise<InterviewFeedback> => {
    const prompt = `
# Persona: InterPrepAI Simulation Agent (Alexis)
You are Alexis, the AI agent for InterPrepAI, a smart, adaptive interview simulation platform. Your persona is a friendly, insightful, and encouraging AI career coach. You are conducting a mock interview with a candidate. Your goal is to provide precise, personalized feedback to help them improve.

# Task: Evaluate Interview Answer
You have just asked the candidate a question, and they have provided an answer. Your task is to analyze their answer and provide structured feedback in the specified JSON format.

# Evaluation Criteria
When evaluating, consider the following aspects of the candidate's response:
- **Clarity:** Is the response easy to understand and well-articulated?
- **Relevance:** Does the answer directly address the question?
- **Confidence:** Is the tone self-assured and composed? (Inferred from text)
- **Structure:** Is the response logically organized (e.g., using the STAR method: Situation, Task, Action, Result)?
- **Tone and Language:** Is the tone professional, friendly, and workplace-appropriate?
- **Example Usage:** Are concrete examples, stories, or data used to support the answer?
- **Problem Solving Ability:** Is there evidence of logical thinking and scenario-based reasoning?
- **Grammar & Vocabulary:** Assess for errors, filler words ('um', 'uh', 'like', 'so', 'you know'), and professional language.

# Feedback Rules
1.  **Analyze the answer** based on the comprehensive criteria above.
2.  **Score the answer:** Provide a strict \`score\` from 0-100 for overall performance and a separate \`responseQuality\` score for the transcript view, reflecting how well the answer met the criteria.
3.  **Provide detailed evaluation:** Fill in the \`evaluation\` object with concise, one-sentence feedback for each category.
4.  **Grammar Correction:** Identify errors and count filler words. Provide a professional rewrite of the answer that is strong and concise.
5.  **Craft Alexis's Response:** As Alexis, write a short, conversational, and encouraging spoken response (\`alexisResponse\`) that summarizes the key feedback points. This is what you will "say" to the candidate.

# Input
- Question: "${question}"
- Candidate's Answer: "${answer}"

# Output
Provide your analysis ONLY in the specified JSON format.
`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: feedbackSchema,
        },
    });

    // FIX: Trim whitespace from response text before parsing JSON.
    return JSON.parse(response.text.trim()) as InterviewFeedback;
};

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: { type: Type.STRING, description: "A friendly, 2-3 sentence summary of the overall performance." },
        actionableTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3-5 actionable tips for improvement." },
        encouragement: { type: Type.STRING, description: "A final, encouraging sentence." },
        simulatedFacialExpressionAnalysis: { type: Type.STRING, description: "A simulated, one-sentence analysis of facial expressions (e.g., 'You likely appeared focused and maintained good eye contact.') based on the confidence and quality of the text responses." },
        simulatedBodyLanguageAnalysis: { type: Type.STRING, description: "A simulated, one-sentence analysis of body language (e.g., 'Your posture probably came across as open and engaged.') based on the confidence and quality of the text responses." },
        simulatedAudioAnalysis: { type: Type.STRING, description: "A simulated, one-sentence analysis of vocal tone and pace based on the text responses (e.g., 'Your tone probably came across as steady and professional.')." }
    },
    required: ['overallSummary', 'actionableTips', 'encouragement', 'simulatedFacialExpressionAnalysis', 'simulatedBodyLanguageAnalysis', 'simulatedAudioAnalysis']
};

export const generateInterviewSummary = async (sessionFeedback: InterviewFeedback[]): Promise<InterviewSummary> => {
     const prompt = `
# Persona: InterPrepAI Simulation Agent (Alexis)
You are Alexis, the AI agent for InterPrepAI, a smart, adaptive interview simulation platform. Your persona is a friendly, insightful, and encouraging AI career coach.

# Task: Summarize Interview Performance
The mock interview is complete. Your task is to provide a final summary based on the entire session's performance, using the provided feedback data.

# Summary Rules
1.  **Overall Summary:** Write a friendly, 2-3 sentence summary of the overall performance, mentioning both strengths and key areas for practice.
2.  **Actionable Tips:** Provide a list of 3-5 concrete, actionable tips for improvement based on recurring patterns in the feedback.
3.  **Simulate Non-Verbal Analysis:** This is a key feature. Based on the confidence and quality of the text responses throughout the session, provide brief, *hypothetical* and encouraging analyses for:
    - **simulatedFacialExpressionAnalysis:** What could be inferred about their facial expressions? (e.g., "Based on your confident answers, you likely maintained a friendly and engaged expression.")
    - **simulatedBodyLanguageAnalysis:** What could be inferred about their body language? (e.g., "Your detailed responses suggest you were likely sitting upright and maintained an open posture.")
    - **simulatedAudioAnalysis:** What could be inferred about their vocal tone and pace? (e.g., "Your tone probably came across as steady and professional.")
4.  **Encouragement:** End with a final, positive, and encouraging sentence to motivate the candidate.

# Input
- An array of all feedback given during the session: ${JSON.stringify(sessionFeedback.map(f => ({score: f.score, tips: f.tips, evaluation: f.evaluation, responseQuality: f.responseQuality})))}

# Output
Provide your summary ONLY in the specified JSON format.
`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: summarySchema,
        },
    });

    // FIX: Trim whitespace from response text before parsing JSON.
    return JSON.parse(response.text.trim()) as InterviewSummary;
}

export const getFollowUpAnswer = async (session: InterviewSession, userQuestion: string): Promise<string> => {
    // A concise summary of transcript for the prompt
    const transcriptSummary = session.transcript.map(t => ({
        question: t.question,
        answer: t.answer.substring(0, 100) + '...', // Truncate answer to keep prompt lighter
        score: t.feedback.score,
        feedbackSummary: t.feedback.evaluation.structure
    }));

    const prompt = `
# Persona: InterPrepAI Simulation Agent (Alexis)
You are Alexis from InterPrepAI, a friendly, insightful, and encouraging AI career coach. You are having a follow-up conversation with a candidate right after they completed a mock interview. Your tone is conversational and helpful.

# Context: Interview Data
Here is the data from the interview session you just conducted:
- Job Role: ${session.config.role}
- Overall Score: ${session.averageScore}%
- Your Final Summary: ${session.summary.overallSummary}
- Your Main Tips: ${session.summary.actionableTips.join('; ')}
- Transcript Snippets & Feedback: ${JSON.stringify(transcriptSummary)}

# Task: Answer the Candidate's Question
The candidate has a follow-up question. Provide a helpful, concise, and encouraging answer based *primarily* on the interview context provided. If the question is general (e.g., "how can I get better at interviews?"), use the context to make your answer specific to their performance. Do not make up new feedback. Your goal is to clarify and elaborate on the existing report. Do not return JSON. Return only the text of your answer. Keep your response to 2-4 sentences.

# Candidate's Question:
"${userQuestion}"

# Your Answer (as Alexis):
`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return response.text;
}

export const generateAssessmentQuestions = async (
  jobRole: string,
  interviewType: 'Behavioral' | 'Technical' | 'Role-Specific',
  difficulty: 'Easy' | 'Medium' | 'Hard',
  numberOfQuestions: number = 5
): Promise<string[]> => {
  const prompt = `
    You are an expert HR professional and hiring manager responsible for creating interview assessments.
    Your task is to generate ${numberOfQuestions} high-quality interview questions for a candidate applying for the role of "${jobRole}".

    The assessment details are as follows:
    - Interview Type: ${interviewType}
    - Difficulty Level: ${difficulty}

    Instructions:
    1. Generate exactly ${numberOfQuestions} questions.
    2. The questions must be appropriate for the specified interview type and difficulty.
    3. For 'Technical' or 'Role-Specific' types, ensure the questions are relevant to the skills and responsibilities of a "${jobRole}".
    4. For 'Behavioral' types, the questions should probe for competencies relevant to a "${jobRole}".
    5. The questions should be clear, concise, and open-ended.
    6. Return ONLY a JSON array of strings. Do not include any other text, markdown, or explanation.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  // FIX: Trim whitespace from response text before parsing JSON.
  return JSON.parse(response.text.trim()) as string[];
};

// --- AI Coach (Scenario-based) Functions ---

export const startCoachingSession = async (candidateName: string): Promise<string> => {
    const prompt = `Start a scenario-based HR conversation. You are the HR manager. The candidate's name is ${candidateName}.
    Your first turn should be a dialogue script that includes a greeting to the candidate and then "Tell me about yourself." with a blank for the candidate to fill in.
    Follow this format exactly:
    HR: Hi ${candidateName}, how’s your day going?
    Candidate: Hello sir, very well. Thank you for asking.
    HR: Tell me about yourself.
    Candidate: ________`;

    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text.trim();
};

const coachingResponseSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.OBJECT,
            properties: {
                grammar: { type: Type.STRING },
                clarity: { type: Type.STRING },
                professionalism: { type: Type.STRING },
                tone: { type: Type.STRING },
            },
            required: ['grammar', 'clarity', 'professionalism', 'tone']
        },
        correctedVersion: { type: Type.STRING, description: "A corrected, improved version of the candidate's answer." },
        explanation: { type: Type.STRING, description: "A brief explanation of why the corrected version is better." },
        nextQuestion: { type: Type.STRING, description: "The next logical, day-to-day HR interview question." }
    },
    required: ['analysis', 'correctedVersion', 'explanation', 'nextQuestion']
};


export const getCoachingResponse = async (conversationHistory: CoachChatMessage[], latestAnswer: string): Promise<{ feedback: CoachingResponse; nextQuestion: string }> => {
    const historyText = conversationHistory.map(c => `${c.speaker}: ${c.message}`).join('\n');

    const prompt = `You are an expert HR interview coach continuing a conversation.
    The conversation so far:
    ${historyText}
    Candidate: ${latestAnswer}

    Your task is to:
    1. Analyze the candidate's latest answer for grammar, clarity, professionalism, and tone.
    2. Provide a corrected, improved version of their answer.
    3. Briefly explain why the corrected version is better.
    4. Ask the next logical, day-to-day interview question to continue the conversation naturally. **Based on the quality and correctness of the candidate's latest answer, adapt the difficulty of your next question. If their answer was weak, ask a simpler, more direct question. If their answer was strong, ask a more challenging follow-up question that requires deeper thinking.**

    Provide your response in the specified JSON format.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: coachingResponseSchema,
        },
    });

    const parsedResponse = JSON.parse(response.text.trim()) as { analysis: any; correctedVersion: any; explanation: any; nextQuestion: any; };
    const { nextQuestion, ...feedback } = parsedResponse;
    return { feedback, nextQuestion };
};


// --- Communication Coach Functions ---

export const generateFillBlankQuestion = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<FillBlankQuestion> => {
    const prompt = `Create a fill-in-the-blank question to test professional communication at a ${difficulty} difficulty level.
    The sentence should be a common workplace scenario.
    Provide one clearly formal/professional correct option and two clearly informal/less professional options. For harder difficulties, make the incorrect options more subtle.
    Provide a brief, helpful explanation for why the formal option is the best choice in a professional context.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ['sentence', 'options', 'correctAnswer', 'explanation']
            }
        },
    });
    // FIX: Trim whitespace from response text before parsing JSON and add type assertion.
    return JSON.parse(response.text.trim()) as FillBlankQuestion;
};

export const generateFormalInformalPair = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<FormalInformalPair> => {
    const prompt = `Provide a single pair of an informal word/phrase and its formal equivalent suitable for a professional vocabulary exercise. The difficulty of the vocabulary should be ${difficulty}. For example, an easy pair is "kick off" and "initiate", a hard pair might be "on the back burner" and "deprioritized".`;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    informal: { type: Type.STRING },
                    formal: { type: Type.STRING }
                },
                required: ['informal', 'formal']
            }
        }
    });
    // FIX: Trim whitespace from response text before parsing JSON and add type assertion.
    return JSON.parse(response.text.trim()) as FormalInformalPair;
};

export const analyzeDictionarySentence = async (formalWord: string, userSentence: string): Promise<DictionaryModeFeedback> => {
    const prompt = `A user was given the formal word "${formalWord}" to use in a sentence. The user provided: "${userSentence}".
    Your task is to provide a detailed analysis of the user's sentence.
    Provide your analysis in the specified JSON format.
    - isCorrect: boolean, true if the sentence is grammatically correct and uses the word appropriately.
    - overallFeedback: string, a one-sentence summary of the user's performance.
    - analysis: an object with detailed, one-sentence feedback for each category:
        - grammar: Analyze the overall grammar of the sentence.
        - context: Did the user create a situation where the word makes sense?
        - professionalism: Is the sentence appropriate for a professional workplace?
        - formalWordAnalysis: **Critically evaluate if the formal word "${formalWord}" was used correctly and naturally. Comment on its placement and if it fits the sentence's tone.**
    - exampleSentence: string, a well-formed example sentence using the formal word.`;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isCorrect: { type: Type.BOOLEAN },
                    overallFeedback: { type: Type.STRING },
                    analysis: {
                        type: Type.OBJECT,
                        properties: {
                            grammar: { type: Type.STRING },
                            context: { type: Type.STRING },
                            professionalism: { type: Type.STRING },
                            formalWordAnalysis: { type: Type.STRING },
                        },
                        required: ['grammar', 'context', 'professionalism', 'formalWordAnalysis']
                    },
                    exampleSentence: { type: Type.STRING }
                },
                required: ['isCorrect', 'overallFeedback', 'analysis', 'exampleSentence']
            }
        }
    });
    // FIX: Trim whitespace from response text before parsing JSON and add type assertion.
    return JSON.parse(response.text.trim()) as DictionaryModeFeedback;
};

export const generateRepetitionSentence = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<string> => {
    const prompt = `Generate a single, clear, professional sentence for a voice repetition test. The difficulty is ${difficulty}. An easy sentence is short with simple words (8-10 words). A medium sentence is longer with more complex vocabulary (10-15 words). A hard sentence is long, uses advanced vocabulary, and may have complex structure (15-20 words). Return only the sentence as a string.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text.trim();
};

export const analyzeRepetition = async (originalSentence: string, userTranscript: string): Promise<RepetitionFeedback> => {
    const prompt = `A user was asked to repeat the sentence: "${originalSentence}".
    Their voice-to-text transcript was: "${userTranscript}".
    Compare the transcript to the original sentence.
    - \`isCorrect\` should be true only if the transcript is a nearly perfect match.
    - \`feedback\` should note any missed words, extra words, or incorrect words.
    - Provide a simulated \`clarityScore\` and \`fluencyScore\` from 0-100 based on how well the transcript matches the original. A perfect match is 100. A transcript with many errors should be lower.`;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING },
                    clarityScore: { type: Type.NUMBER },
                    fluencyScore: { type: Type.NUMBER }
                },
                required: ['isCorrect', 'feedback', 'clarityScore', 'fluencyScore']
            }
        }
    });
    // FIX: Trim whitespace from response text before parsing JSON and add type assertion to resolve potential type inference issues.
    return JSON.parse(response.text.trim()) as RepetitionFeedback;
};

export const generateSpeakingTopic = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<string> => {
    const prompt = `Generate a single, open-ended topic for a 30-second professional speaking exercise. The difficulty level is ${difficulty}. An easy topic is very common (e.g., "Describe your ideal work environment"). A medium topic requires more specific thought (e.g., "What is a skill you'd like to learn and why?"). A hard topic is more abstract or complex (e.g., "Discuss the impact of AI on your industry."). Return only the topic as a string.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text.trim();
};

export const analyzeSpeakingTask = async (topic: string, userTranscript: string): Promise<SpeakingTaskAnalysis> => {
    const prompt = `A user was asked to speak for 30 seconds on the topic: "${topic}".
    Here is their transcribed response: "${userTranscript}".
    Provide a detailed analysis of their response.
    - \`score\`: An overall score from 0-100.
    - \`feedback\`: An object with brief, one-sentence feedback on grammar, structure, vocabulary, pacing (inferred from word count), filler words (count them if any), and professional tone.
    - \`improvements\`: A list of 2-3 specific, actionable improvement tips.`;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    feedback: {
                        type: Type.OBJECT,
                        properties: {
                            grammar: { type: Type.STRING },
                            structure: { type: Type.STRING },
                            vocabulary: { type: Type.STRING },
                            pacing: { type: Type.STRING },
                            fillerWords: { type: Type.STRING },
                            tone: { type: Type.STRING }
                        },
                        required: ['grammar', 'structure', 'vocabulary', 'pacing', 'fillerWords', 'tone']
                    },
                    improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['score', 'feedback', 'improvements']
            }
        }
    });
    // FIX: Trim whitespace from response text before parsing JSON and add type assertion to resolve potential type inference issues.
    return JSON.parse(response.text.trim()) as SpeakingTaskAnalysis;
};