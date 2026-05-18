import type { MockCandidate, InterviewSession, User, ResumeData, UserProfile, Assessment, AssessmentResult } from '../types';

// New mock user database to simulate a backend store
export const MOCK_USERS: User[] = [
  { name: 'Candidate User', email: 'candidate@test.com', password: 'hashed_placeholder', role: 'candidate' },
  { name: 'Recruiter User', email: 'recruiter@test.com', password: 'hashed_placeholder', role: 'recruiter' },
];

export const MOCK_CANDIDATE_DATA = new Map<string, { resumeData: ResumeData | null, careerRoadmap: any, interviewHistory: InterviewSession[], userProfile: UserProfile }>();

const mockResume: ResumeData = {
  name: 'Candidate User',
  email: 'candidate@test.com',
  phone: '123-456-7890',
  summary: 'A passionate developer eager to grow and contribute to exciting projects.',
  skills: ['React', 'TypeScript', 'Node.js', 'CSS', 'HTML'],
  experience: [{ jobTitle: 'Junior Developer', company: 'Startup Inc.', duration: '2022-Present', responsibilities: ['Built UI components', 'Fixed bugs'] }],
  education: [{ degree: 'B.S. Computer Science', institution: 'State University', year: '2022' }],
};

const mockUserProfile: UserProfile = {
  fullName: 'Candidate User',
  email: 'candidate@test.com',
  linkedinUrl: 'https://linkedin.com/in/candidate',
  skills: ['React', 'TypeScript', 'Node.js'],
  languages: ['English'],
  profilePhotoUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Candidate User`,
  resumeText: 'This is the resume text for Candidate User.'
};

MOCK_CANDIDATE_DATA.set('candidate@test.com', {
  resumeData: mockResume,
  careerRoadmap: null,
  interviewHistory: [],
  userProfile: mockUserProfile
});


export const MOCK_CANDIDATES: MockCandidate[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    role: 'Product Manager',
    readiness: 92,
    confidence: 88,
    report: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '123-456-7890',
      summary: 'Experienced Product Manager with a track record of launching successful products.',
      skills: ['Product Strategy', 'Agile Methodologies', 'User Research', 'Roadmap Planning'],
      experience: [{ jobTitle: 'Senior PM', company: 'TechCorp', duration: '2019-Present', responsibilities: [] }],
      education: [{ degree: 'MBA', institution: 'Business School', year: '2018' }],
    },
  },
  {
    id: '2',
    name: 'Maria Garcia',
    role: 'UX Designer',
    readiness: 85,
    confidence: 95,
    report: {
      name: 'Maria Garcia',
      email: 'maria@example.com',
      phone: '123-456-7890',
      summary: 'Creative UX Designer focused on user-centered design principles.',
      skills: ['Figma', 'Sketch', 'Prototyping', 'Wireframing', 'Usability Testing'],
      experience: [{ jobTitle: 'UX Designer', company: 'DesignHub', duration: '2020-Present', responsibilities: [] }],
      education: [{ degree: 'B.Sc. in HCI', institution: 'Design University', year: '2020' }],
    },
  },
  {
    id: '3',
    name: 'Sam Chen',
    role: 'Data Scientist',
    readiness: 88,
    confidence: 82,
    report: {
      name: 'Sam Chen',
      email: 'sam@example.com',
      phone: '123-456-7890',
      summary: 'Data Scientist with expertise in machine learning and statistical analysis.',
      skills: ['Python', 'R', 'TensorFlow', 'SQL', 'Data Visualization'],
      experience: [{ jobTitle: 'Data Scientist', company: 'Data Inc.', duration: '2018-Present', responsibilities: [] }],
      education: [{ degree: 'M.S. in Data Science', institution: 'Tech Institute', year: '2018' }],
    },
  },
];

const mockSummary = {
  overallSummary: 'This was a solid interview session. You demonstrated good foundational knowledge.',
  actionableTips: ['Practice articulating the impact of your work using metrics.', 'Try to be more concise in your answers.'],
  encouragement: 'You are well on your way. Keep up the great work!',
  simulatedFacialExpressionAnalysis: 'You likely appeared composed and thoughtful during your responses.',
  simulatedBodyLanguageAnalysis: 'You likely appeared composed and thoughtful during your responses.',
  simulatedAudioAnalysis: 'Your vocal tone was clear and professional.',
  badgesEarned: [],
};

export const MOCK_INTERVIEW_SESSIONS: InterviewSession[] = [
  {
    date: '2025-08-31',
    type: 'Behavioral - Product Manager',
    duration: 10,
    averageScore: 92,
    config: { type: 'Behavioral', difficulty: 'Hard', persona: 'Friendly', role: 'Product Manager' },
    transcript: [],
    summary: mockSummary,
  },
];

// FIX: Add explicit type annotation to prevent type widening of literal types (e.g., 'Technical' to string).
export const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 'asmt_1',
    jobRole: 'Frontend Developer',
    createdBy: 'recruiter@test.com',
    createdAt: new Date('2025-09-01').toISOString(),
    config: { type: 'Technical', difficulty: 'Medium', persona: 'Neutral' },
    questions: ['What is the difference between state and props in React?', 'Explain the CSS box model.', 'How do you handle async operations in JavaScript?']
  }
];

// FIX: Add explicit type annotation to prevent type widening of literal types.
export const MOCK_ASSESSMENT_RESULTS: AssessmentResult[] = [
  {
    id: 'res_1',
    assessmentId: 'asmt_1',
    candidateName: 'Sanjay S',
    candidateEmail: 'sanjay.s@test.com',
    completedAt: new Date('2026-01-05').toISOString(),
    status: 'Shortlisted',
    session: {
      date: '2026-01-05',
      type: 'Technical - Python Developer',
      duration: 25,
      averageScore: 93,
      config: { type: 'Technical', difficulty: 'Hard', persona: 'Neutral', role: 'Python Developer' },
      transcript: [],
      summary: {
        ...mockSummary,
        overallSummary: 'Exceptional performance. Sanjay demonstrated deep understanding of Python concurrency and system design.',
        recruiterReport: 'Highly recommended. Strong technical depth, slightly fast-paced communication but very clear.',
        candidateReport: 'Great job! You nailed the tricky async questions. Work on pacing.'
      },
    }
  },
  {
    id: 'res_2',
    assessmentId: 'asmt_1',
    candidateName: 'Vikram Patel',
    candidateEmail: 'vikram.p@test.com',
    completedAt: new Date('2026-01-06').toISOString(),
    status: 'Pending',
    session: {
      date: '2026-01-06',
      type: 'Technical - Python Developer',
      duration: 22,
      averageScore: 90,
      config: { type: 'Technical', difficulty: 'Hard', persona: 'Neutral', role: 'Python Developer' },
      transcript: [],
      summary: { ...mockSummary, overallSummary: 'Solid candidate, good problem solving skills.' }
    }
  },
  {
    id: 'res_3',
    assessmentId: 'asmt_1',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.s@test.com',
    completedAt: new Date('2026-01-07').toISOString(),
    status: 'Pending',
    session: {
      date: '2026-01-07',
      type: 'Technical - Python Developer',
      duration: 28,
      averageScore: 95,
      config: { type: 'Technical', difficulty: 'Hard', persona: 'Neutral', role: 'Python Developer' },
      transcript: [],
      summary: { ...mockSummary, overallSummary: 'Outstanding communication and technical precision.' }
    }
  },
  {
    id: 'res_4',
    assessmentId: 'asmt_1',
    candidateName: 'Rahul Verma',
    candidateEmail: 'rahul.v@test.com',
    completedAt: new Date('2026-01-04').toISOString(),
    status: 'Pending',
    session: {
      date: '2026-01-04',
      type: 'Technical - Python Developer',
      duration: 20,
      averageScore: 88,
      config: { type: 'Technical', difficulty: 'Medium', persona: 'Neutral', role: 'Python Developer' },
      transcript: [],
      summary: { ...mockSummary, overallSummary: 'Good technical basics, but struggled with advanced topics.' }
    }
  },
  {
    id: 'res_5',
    assessmentId: 'asmt_1',
    candidateName: 'Ananya Iyer',
    candidateEmail: 'ananya.i@test.com',
    completedAt: new Date('2026-01-05').toISOString(),
    status: 'Pending',
    session: {
      date: '2026-01-05',
      type: 'Technical - Python Developer',
      duration: 24,
      averageScore: 92,
      config: { type: 'Technical', difficulty: 'Hard', persona: 'Neutral', role: 'Python Developer' },
      transcript: [],
      summary: { ...mockSummary, overallSummary: 'Very strong candidate. articulate and knowledgeable.' }
    }
  }
];