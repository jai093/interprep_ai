import apiClient from './apiClient';
import type { Assessment, InterviewSession, InterviewSummary, Badge } from '../types';

export interface CandidateAssessmentResult {
  session: InterviewSession;
  summary: InterviewSummary;
  badges: Badge[];
  transcript: any[];
  averageScore: number;
}

export const assessmentService = {
  async getPublicAssessment(assessmentId: string): Promise<Assessment> {
    return apiClient.request(`/assessments/${assessmentId}`, 'GET', undefined, false);
  },

  async submitAssessmentResult(
    assessmentId: string,
    data: {
      candidateName: string;
      candidateEmail: string;
      session: InterviewSession;
    }
  ): Promise<{ message: string; result: any }> {
    return apiClient.request(`/assessments/${assessmentId}/submit`, 'POST', data, false);
  },

  async getAssessmentResults(assessmentId: string): Promise<any[]> {
    return apiClient.request(`/assessments/${assessmentId}/results`, 'GET', undefined, false);
  },

  // Save interview session with full data (authenticated)
  async saveInterviewSession(sessionData: any): Promise<{ message: string; session: any }> {
    return apiClient.request('/candidate/interviews', 'POST', sessionData);
  },

  // Get interview history (authenticated)
  async getInterviewHistory(): Promise<any[]> {
    return apiClient.request('/candidate/interviews', 'GET');
  },

  // Get specific interview result (authenticated)
  async getInterviewResult(interviewId: string): Promise<any> {
    return apiClient.request(`/candidate/interviews/${interviewId}`, 'GET');
  },
};
