import apiClient from './apiClient';
import type { RecruiterProfile, RecruiterSettings, Assessment, AssessmentResult } from '../types';

export const recruiterService = {
  async getProfile(): Promise<RecruiterProfile> {
    return apiClient.request('/recruiter/profile', 'GET');
  },

  async updateProfile(profile: Partial<RecruiterProfile>): Promise<{ message: string; profile: RecruiterProfile }> {
    return apiClient.request('/recruiter/profile', 'PUT', profile);
  },

  async getSettings(): Promise<RecruiterSettings> {
    return apiClient.request('/recruiter/settings', 'GET');
  },

  async updateSettings(settings: Partial<RecruiterSettings>): Promise<{ message: string; settings: RecruiterSettings }> {
    return apiClient.request('/recruiter/settings', 'PUT', settings);
  },

  async getAssessments(): Promise<Assessment[]> {
    return apiClient.request('/recruiter/assessments', 'GET');
  },

  async createAssessment(assessment: Omit<Assessment, 'id' | 'createdAt' | 'createdBy'>): Promise<{ message: string; assessment: Assessment }> {
    return apiClient.request('/recruiter/assessments', 'POST', assessment);
  },

  async deleteAssessment(assessmentId: string): Promise<{ message: string }> {
    return apiClient.request(`/recruiter/assessments/${assessmentId}`, 'DELETE', {});
  },

  async getAssessmentResults(): Promise<AssessmentResult[]> {
    return apiClient.request('/recruiter/results', 'GET');
  },

  async getAssessmentResult(resultId: string): Promise<AssessmentResult> {
    return apiClient.request(`/recruiter/results/${resultId}`, 'GET');
  },
};
