import { Request, Response, NextFunction } from 'express';
import * as googleTTS from 'google-tts-api';
import { ollamaChat, ollamaChatJSON, getKeyStatus, ChatMessage } from '../services/ollamaService';

// --- Helper: Build a system + user prompt pair ---
function buildMessages(systemPrompt: string, userPrompt: string): ChatMessage[] {
    return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ];
}

// === 1. Parse Resume ===
export const parseResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { resumeText } = req.body;
        if (!resumeText) { res.status(400).json({ error: 'resumeText is required' }); return; }

        const result = await ollamaChatJSON(
            buildMessages(
                `You are an expert resume analyzer. Extract structured data from the resume and return ONLY valid JSON with this exact schema:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "summary": "2-4 sentence professional summary",
  "skills": ["skill1", "skill2", ...],
  "experience": [{"jobTitle": "string", "company": "string", "duration": "string", "responsibilities": ["string"]}],
  "education": [{"degree": "string", "institution": "string", "year": "string"}]
}`,
                `Analyze the following resume text. Extract all technical, soft, and relevant skills. Populate the schema as accurately as possible.\n\nResume:\n${resumeText}`
            ),
            { temperature: 0.3 }
        );

        res.json(result);
    } catch (error) { next(error); }
};

// === 2. Generate Career Roadmap ===
export const generateRoadmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { skills, targetRole } = req.body;
        if (!skills || !targetRole) { res.status(400).json({ error: 'skills and targetRole are required' }); return; }

        const result = await ollamaChatJSON(
            buildMessages(
                `You are an expert career coach. Return ONLY valid JSON with this schema:
{
  "targetRole": "string",
  "skillGaps": ["skill1", "skill2"],
  "shortTermPlan": [{"title": "string", "description": "string", "duration": "string", "resources": ["string"]}],
  "longTermPlan": [{"title": "string", "description": "string", "duration": "string", "resources": ["string"]}]
}`,
                `A candidate with skills: [${skills.join(', ')}] wants to become a "${targetRole}".
Perform a detailed skill gap analysis. Determine essential skills for the target role, compare to current skills, and identify gaps.
Create a short-term (1-3 months) and long-term (6-12 months) plan with specific topics, project ideas, and resources.`
            ),
            { temperature: 0.5 }
        );

        res.json(result);
    } catch (error) { next(error); }
};

// === 3. Generate Next Interview Question ===
export const generateInterviewQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { config, history, resume, questionCount } = req.body;
        if (!config || !resume) { res.status(400).json({ error: 'config and resume are required' }); return; }

        // --- Extract previously asked questions to prevent repeats ---
        const askedQuestions: string[] = (history || []).map((h: any) => h.question).filter(Boolean);
        const askedQuestionsBlock = askedQuestions.length > 0
            ? `\nALREADY ASKED — DO NOT REPEAT OR PARAPHRASE THESE:\n${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
            : '';

        // --- Determine candidate level (strict: only sessions >=75 contribute to avg) ---
        const allScores = (history || []).map((h: any) => h.feedback?.score).filter((s: any) => typeof s === 'number');
        const successScores = allScores.filter((s: number) => s >= 75);
        const totalCount = allScores.length;
        const avgScore = totalCount > 0 ? successScores.reduce((a: number, b: number) => a + b, 0) / totalCount : 0;

        let level = 'Beginner';
        if (avgScore >= 75) level = 'Advanced';
        else if (avgScore >= 45) level = 'Intermediate';

        const interviewType: string = config.type || 'Behavioral';
        const role: string = config.role || 'Software Engineer';

        // --- Level × Type matrix: exactly what kind of question to generate ---
        const levelTypeGuide: Record<string, Record<string, string>> = {
            Beginner: {
                Behavioral: `Simple, friendly screening question a junior recruiter asks in a first-round call. Style: conversational, no jargon. Examples: "Tell me about yourself.", "Why are you interested in this role?", "How do you handle a tough deadline?", "Describe working in a team."`,
                Technical: `Very basic technical question a non-technical recruiter would ask. No algorithms. Examples: "What programming languages are you comfortable with?", "Can you explain what a database is?", "Have you used Git before?", "What does an API do?"`,
                'Role-Specific': `Simple role-awareness question. Examples: "What do you know about the ${role} role?", "What skills matter most for ${role}?", "Have you done any projects related to ${role}?"`,
            },
            Intermediate: {
                Behavioral: `STAR-method behavioral question for candidates with 1–3 years experience. Examples: "Tell me about a time you managed competing priorities.", "Describe a conflict you resolved at work.", "Give an example of a project you led end-to-end."`,
                Technical: `Concept + practical experience question. Tests industry terminology. Examples: "Difference between SQL and NoSQL — when would you pick one?", "Explain synchronous vs. asynchronous programming.", "Describe your experience with CI/CD pipelines."`,
                'Role-Specific': `Company-context scenario for the ${role} role. Examples: "What would your first 30 days look like as a ${role} here?", "How do you stay updated on trends in ${role}?", "Which tools have you used as a ${role}?"`,
            },
            Advanced: {
                Behavioral: `Senior/FAANG-level behavioral question. Examples: "Tell me about a time you drove organisational change.", "Describe a critical decision you made with incomplete data.", "How have you mentored junior team members?"`,
                Technical: `FAANG-calibre deep-dive technical question. Examples: "Design a URL shortener — walk me through your architecture.", "Explain the CAP theorem and its impact on distributed databases.", "How would you optimise a query aggregating millions of rows?"`,
                'Role-Specific': `High-impact senior ${role} question testing strategic thinking and past impact. Examples: "How have you influenced the technical direction of a product?", "Describe the most complex system you built and the key lesson.", "How do you ensure scalability and reliability in production?"`,
            },
        };

        const questionStyle = levelTypeGuide[level]?.[interviewType] || levelTypeGuide['Beginner']['Behavioral'];

        const response = await ollamaChat(
            buildMessages(
                `You are Alexis, a professional AI interviewer at InterprepAI. You are conducting a ${interviewType} interview for a "${role}" position.

CANDIDATE LEVEL: ${level}
QUESTION STYLE TO FOLLOW: ${questionStyle}

STRICT RULES:
- Output ONE single interview question only — nothing else.
- Keep it SHORT: max 30 words, ideally under 20.
- Sound natural, like a real interviewer speaking aloud.
- No preamble, no greeting, no explanation, no numbering.
- No quotes around your output.
- Return ONLY the raw question text.`,
                `Candidate Resume: "${resume.summary}"
Key Skills: [${resume.skills?.slice(0, 8).join(', ') || 'Not provided'}]
${askedQuestionsBlock}

This is question ${questionCount || 1} of 5. Generate the next ${interviewType} question for this ${level}-level candidate applying for "${role}".`
            ),
            { temperature: 0.75 }
        );

        // Strip any accidental quotes, numbering, or markdown the model might add
        const cleanQuestion = response.trim().replace(/^["'`]|["'`]$/g, '').replace(/^\d+[.)]\s*/, '');
        res.json({ question: cleanQuestion });
    } catch (error) { next(error); }
};

// === 4. Get Interview Feedback ===
export const getInterviewFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { question, answer } = req.body;
        if (!question || !answer) { res.status(400).json({ error: 'question and answer are required' }); return; }

        const result = await ollamaChatJSON(
            buildMessages(
                `You are Alexis, an extremely strict and perfectionist AI career coach. Evaluate the candidate's interview answer with very high standards.

Strictness Criteria:
- Grammar & Syntax: Penalize heavily for any grammatical errors or awkward phrasing.
- Tone & Professionalism: Must be highly professional, structured (STAR method), and confident.
- Sentence Formation: Evaluate for clarity, vocabulary depth, and impact.
- Content: Relevance and specificity are paramount.

Scoring Policy:
- 0-45%: Poor or basic communication.
- 45-75%: Good attempt but missing professional polish or depth.
- 75%+: Exceptional readiness. This is a very high bar and hard to reach.

Return ONLY valid JSON with this schema:
{
  "score": number (0-100),
  "responseQuality": number (0-100),
  "evaluation": {"clarity": "string", "relevance": "string", "structure": "string", "confidence": "string"},
  "grammarCorrection": {"hasErrors": boolean, "explanation": "string"},
  "professionalRewrite": "string (1-2 concise sentences only, no padding)",
  "tips": ["string"],
  "alexisResponse": "string (1-2 sentences, firm but helpful)",
  "wordCount": number,
  "fillerWords": number,
  "hasExample": boolean
}`,
                `Evaluate this interview answer strictly:
Question: "${question}"
Candidate's Answer: "${answer}"

Provide 1-2 actionable tips for reaching the 75%+ excellence threshold.`
            ),
            { temperature: 0.3 }
        );

        res.json(result);
    } catch (error) { next(error); }
};

// === 5. Generate Interview Summary ===
export const generateInterviewSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { sessionFeedback } = req.body;
        if (!sessionFeedback) { res.status(400).json({ error: 'sessionFeedback is required' }); return; }

        const result = await ollamaChatJSON(
            buildMessages(
                `You are Alexis from InterPrepAI. Summarize the interview performance and return ONLY valid JSON with this schema:
{
  "overallSummary": "2-3 sentence summary",
  "actionableTips": ["tip1", "tip2", "tip3"],
  "encouragement": "motivating sentence",
  "simulatedFacialExpressionAnalysis": "one sentence in simple, encouraging English",
  "simulatedBodyLanguageAnalysis": "one sentence in simple, encouraging English",
  "simulatedAudioAnalysis": "one sentence detailing tone, pace, and presence in simple, encouraging English"
}`,
                `Session feedback data: ${JSON.stringify(sessionFeedback.map((f: any) => ({
                    score: f.score, tips: f.tips, evaluation: f.evaluation, responseQuality: f.responseQuality
                })))}

Provide:
1. Friendly 2-3 sentence summary (strengths + areas for practice)
2. 3-5 actionable tips based on recurring patterns
3. Simple, conversational English sentences detailing facial expressions, body language, and audio tone/pace, based on confidence/quality. Avoid using statistical percentages.
4. Final encouraging sentence`
            ),
            { temperature: 0.5 }
        );

        res.json(result);
    } catch (error) { next(error); }
};

// === 6. Follow-Up Answer ===
export const getFollowUpAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { session, userQuestion } = req.body;
        if (!session || !userQuestion) { res.status(400).json({ error: 'session and userQuestion are required' }); return; }

        const transcriptSummary = session.transcript?.map((t: any) => ({
            question: t.question,
            answer: t.answer?.substring(0, 100) + '...',
            score: t.feedback?.score,
        })) || [];

        const response = await ollamaChat(
            buildMessages(
                `You are Alexis from InterPrepAI, a friendly AI career coach. You just conducted a mock interview. Answer the candidate's follow-up question based on the interview data. Keep your response to 2-4 sentences.`,
                `Interview Data:
- Role: ${session.config?.role}
- Overall Score: ${session.averageScore}%
- Summary: ${session.summary?.overallSummary}
- Tips: ${session.summary?.actionableTips?.join('; ')}
- Transcript: ${JSON.stringify(transcriptSummary)}

Candidate's Question: "${userQuestion}"

Provide a helpful, concise answer based on the interview context. Do not return JSON.`
            ),
            { temperature: 0.6 }
        );

        res.json({ answer: response });
    } catch (error) { next(error); }
};

// === 7. Generate Assessment Questions ===
export const generateAssessmentQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { jobRole, interviewType, difficulty, numberOfQuestions } = req.body;
        if (!jobRole || !interviewType || !difficulty) { res.status(400).json({ error: 'jobRole, interviewType, difficulty are required' }); return; }

        // Map Easy/Medium/Hard to candidate level style
        const difficultyStyle: Record<string, string> = {
            Easy: `Simple, conversational questions a junior recruiter asks in a first-round screen. No technical jargon. Questions like "Tell me about yourself", "Why do you want this role?", "Describe teamwork you've done." Max 20 words each.`,
            Medium: `Professional questions for candidates with 1-3 years experience. Use STAR method for behavioral, practical knowledge for technical, and role-readiness for role-specific. Max 25 words each.`,
            Hard: `Senior-level FAANG-calibre questions. Deep system design, strategic leadership, complex decision-making. Expect nuanced, expert-level answers. Max 30 words each.`,
        };

        const typeGuidance: Record<string, string> = {
            Behavioral: `Focus on past experiences, teamwork, conflict resolution, communication, and professional growth. Questions must start with "Tell me about a time", "Describe a situation", or "Give an example of".`,
            Technical: `Focus on technical concepts, tools, problem-solving approaches relevant to ${jobRole}. Test understanding, not memorisation.`,
            'Role-Specific': `Focus on role responsibilities, industry knowledge, tools used in ${jobRole}, and how the candidate would approach the job day-to-day.`,
        };

        const style = difficultyStyle[difficulty] || difficultyStyle['Medium'];
        const typeGuide = typeGuidance[interviewType] || typeGuidance['Behavioral'];
        const n = numberOfQuestions || 5;

        const result = await ollamaChatJSON<string[]>(
            buildMessages(
                `You are a senior HR professional creating interview questions. Return ONLY a valid JSON array of exactly ${n} strings — nothing else. No keys, no objects, no explanations.`,
                `Create exactly ${n} ${interviewType} interview questions for a "${jobRole}" role.

DIFFICULTY STYLE: ${style}
TYPE GUIDANCE: ${typeGuide}

Rules:
- Each question must be unique — no overlap in topic or phrasing.
- Questions should sound exactly like what a real interviewer says aloud.
- Keep each question short and clear.
- Return ONLY a JSON array: ["Question 1?", "Question 2?", ...]`
            ),
            { temperature: 0.65 }
        );

        res.json({ questions: Array.isArray(result) ? result : [] });
    } catch (error) { next(error); }
};

// === 8. Start Coaching Session ===
export const startCoachingSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { candidateName } = req.body;
        if (!candidateName) { res.status(400).json({ error: 'candidateName is required' }); return; }

        const response = await ollamaChat(
            buildMessages(
                `You are an HR interview coach conducting a scenario-based mock interview.`,
                `Start a scenario-based HR conversation. The candidate's name is ${candidateName}.
Your first turn should be a dialogue script:
HR: Hi ${candidateName}, how's your day going?
Candidate: Hello sir, very well. Thank you for asking.
HR: Tell me about yourself.
Candidate: ________`
            ),
            { temperature: 0.7 }
        );

        res.json({ script: response });
    } catch (error) { next(error); }
};

// === 9. Get Coaching Response ===
export const getCoachingResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { conversationHistory, latestAnswer } = req.body;
        if (!latestAnswer) { res.status(400).json({ error: 'latestAnswer is required' }); return; }

        const historyText = conversationHistory?.map((c: any) => `${c.speaker}: ${c.message}`).join('\n') || '';

        const result = await ollamaChatJSON(
            buildMessages(
                `You are an expert HR interview coach. Return ONLY valid JSON with this schema:
{
  "analysis": {"grammar": "string", "clarity": "string", "professionalism": "string", "tone": "string"},
  "correctedVersion": "string",
  "explanation": "string",
  "nextQuestion": "string"
}`,
                `Conversation so far:\n${historyText}\nCandidate: ${latestAnswer}

Analyze the latest answer for grammar, clarity, professionalism, tone.
Provide a corrected version and brief explanation.
Ask the next logical interview question, adapting difficulty based on answer quality.`
            ),
            { temperature: 0.5 }
        );

        const { nextQuestion, ...feedback } = result as any;
        res.json({ feedback, nextQuestion });
    } catch (error) { next(error); }
};

// === 10. Generate Fill-in-the-Blank Question ===
export const generateFillBlank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { difficulty } = req.body;
        const result = await ollamaChatJSON(
            buildMessages(
                `You create professional communication exercises. Return ONLY valid JSON:
{"sentence": "string with ___", "options": ["opt1","opt2","opt3"], "correctAnswer": "string", "explanation": "string"}`,
                `Create a fill-in-the-blank question at ${difficulty || 'Medium'} difficulty.
The sentence should be a common workplace scenario.
One clearly formal/professional correct option and two informal options.
Brief explanation for why the formal option is best.`
            ),
            { temperature: 0.7 }
        );
        res.json(result);
    } catch (error) { next(error); }
};

// === 11. Generate Formal/Informal Pair ===
export const generateFormalPair = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { difficulty } = req.body;
        const result = await ollamaChatJSON(
            buildMessages(
                `Return ONLY valid JSON: {"informal": "string", "formal": "string"}`,
                `Provide one informal word/phrase and its formal equivalent for a professional vocabulary exercise. Difficulty: ${difficulty || 'Medium'}. Example: "kick off" → "initiate".`
            ),
            { temperature: 0.7 }
        );
        res.json(result);
    } catch (error) { next(error); }
};

// === 12. Analyze Dictionary Sentence ===
export const analyzeSentence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { formalWord, userSentence } = req.body;
        if (!formalWord || !userSentence) { res.status(400).json({ error: 'formalWord and userSentence required' }); return; }

        const result = await ollamaChatJSON(
            buildMessages(
                `You analyze professional vocabulary usage. Return ONLY valid JSON:
{"isCorrect": boolean, "overallFeedback": "string", "analysis": {"grammar": "string", "context": "string", "professionalism": "string", "formalWordAnalysis": "string"}, "exampleSentence": "string"}`,
                `The user was given the formal word "${formalWord}" to use in a sentence.
User's sentence: "${userSentence}"
Analyze grammar, context, professionalism, and word usage. Provide an example sentence.`
            ),
            { temperature: 0.4 }
        );
        res.json(result);
    } catch (error) { next(error); }
};

// === 13. Generate Repetition Sentence ===
export const generateRepetitionSentence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { difficulty } = req.body;
        const response = await ollamaChat(
            buildMessages(
                `Generate sentences for voice repetition practice.`,
                `Generate a single, clear sentence for a voice repetition test. Difficulty: ${difficulty || 'Medium'}.
- Easy: 5-8 words, very simple everyday sentence (e.g., "I like to drink coffee in the morning").
- Medium: 10-15 words, professional/workplace context.
- Hard: 15-20 words, advanced professional vocabulary.
Return ONLY the sentence as a plain string. No JSON.`
            ),
            { temperature: 0.7 }
        );
        res.json({ sentence: response });
    } catch (error) { next(error); }
};

// === 14. Analyze Repetition ===
export const analyzeRepetition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { originalSentence, userTranscript } = req.body;
        if (!originalSentence || !userTranscript) { res.status(400).json({ error: 'originalSentence and userTranscript required' }); return; }

        const result = await ollamaChatJSON(
            buildMessages(
                `Compare voice transcripts. Return ONLY valid JSON:
{"isCorrect": boolean, "feedback": "string", "clarityScore": number, "fluencyScore": number}`,
                `Original sentence: "${originalSentence}"
User's transcript: "${userTranscript}"
Compare them. isCorrect = nearly perfect match. Scores 0-100 based on accuracy.`
            ),
            { temperature: 0.3 }
        );
        res.json(result);
    } catch (error) { next(error); }
};

// === 15. Generate Speaking Topic ===
export const generateSpeakingTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { difficulty } = req.body;
        const response = await ollamaChat(
            buildMessages(
                `Generate speaking exercise topics.`,
                `Generate one open-ended topic for a 30-second speaking exercise. Difficulty: ${difficulty || 'Medium'}.
- Easy: very common everyday topics (e.g., "How was your day?", "What is your favourite food and why?", "Talk about your hobbies").
- Medium: professional/workplace context (e.g., "Tell me about a project you worked on").
- Hard: abstract or complex professional scenarios.
Return ONLY the topic as a plain string.`
            ),
            { temperature: 0.8 }
        );
        res.json({ topic: response });
    } catch (error) { next(error); }
};

// === 16. Analyze Speaking Task ===
export const analyzeSpeaking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { topic, userTranscript } = req.body;
        if (!topic || !userTranscript) { res.status(400).json({ error: 'topic and userTranscript required' }); return; }

        const result = await ollamaChatJSON(
            buildMessages(
                `Analyze spoken responses. Return ONLY valid JSON:
{"score": number, "feedback": {"grammar":"string","structure":"string","vocabulary":"string","pacing":"string","fillerWords":"string","tone":"string"}, "improvements": ["string"]}`,
                `Topic: "${topic}"
User's response: "${userTranscript}"
Score 0-100. Analyze grammar, structure, vocabulary, pacing, filler words, tone.
Provide 2-3 specific improvement tips.`
            ),
            { temperature: 0.4 }
        );
        res.json(result);
    } catch (error) { next(error); }
};

// === 17. Text-to-Speech (Google TTS API Fallback for Edge TTS) ===
export const generateTTS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { text, voice = 'en-US' } = req.body;
        if (!text) { res.status(400).json({ error: 'text is required' }); return; }

        // Edge-tts is currently giving 403. Using google-tts-api as a highly reliable fallback
        // It produces a very clear, professional voice similar to Google Assistant.
        // Google-tts-api sometimes throws validation errors for specific localized tags like en-US,
        // so we default to standard 'en'.
        let lang = 'en';
        if (typeof voice === 'string' && voice !== 'en-US' && voice !== 'en-US-JennyNeural') {
            lang = voice.split('-')[0] || 'en'; // fallback to base language code
        }

        const base64AudioArray = await googleTTS.getAllAudioBase64(text, {
            lang,
            slow: false,
            host: 'https://translate.google.com',
            splitPunct: ',.?'
        });
        
        const buffers = base64AudioArray.map(b => Buffer.from(b.base64, 'base64'));
        const audioBuffer = Buffer.concat(buffers);
        
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });
        res.send(audioBuffer);
    } catch (error) { next(error); }
};

// === Status Endpoint ===
export const getAiStatus = async (_req: Request, res: Response): Promise<void> => {
    res.json({
        provider: 'Ollama Cloud',
        model: process.env.OLLAMA_MODEL || 'gpt-oss:120b',
        keys: getKeyStatus(),
    });
};
