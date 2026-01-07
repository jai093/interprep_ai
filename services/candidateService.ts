import apiClient from './apiClient';
import type { UserProfile, CareerRoadmap, InterviewSession } from '../types';

export const candidateService = {
  async getProfile(): Promise<UserProfile> {
    return apiClient.request('/candidate/profile', 'GET');
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<{ message: string; profile: UserProfile }> {
    return apiClient.request('/candidate/profile', 'PUT', profile);
  },

  async getCareerRoadmap(): Promise<CareerRoadmap> {
    return apiClient.request('/candidate/roadmap', 'GET');
  },

  async updateCareerRoadmap(roadmap: Partial<CareerRoadmap>): Promise<{ message: string; roadmap: CareerRoadmap }> {
    return apiClient.request('/candidate/roadmap', 'PUT', roadmap);
  },

  async getInterviewHistory(): Promise<InterviewSession[]> {
    return apiClient.request('/candidate/interviews', 'GET');
  },

  async addInterviewSession(session: Omit<InterviewSession, 'date'> & { date: string }): Promise<{ message: string; session: InterviewSession }> {
    return apiClient.request('/candidate/interviews', 'POST', session);
  },
};
