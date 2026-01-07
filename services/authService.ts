import apiClient, { AuthResponse } from './apiClient';
import type { User } from '../types';

export const authService = {
  async signup(
    userData: {
      name: string;
      email: string;
      password: string;
      company?: string;
    },
    role: 'candidate' | 'recruiter'
  ): Promise<AuthResponse> {
    const response = await apiClient.request<AuthResponse>(
      '/auth/signup',
      'POST',
      { ...userData, role },
      false
    );
    apiClient.setAccessToken(response.accessToken);
    return response;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.request<AuthResponse>(
      '/auth/login',
      'POST',
      { email, password },
      false
    );
    apiClient.setAccessToken(response.accessToken);
    return response;
  },

  async logout(): Promise<void> {
    await apiClient.request('/auth/logout', 'POST', {});
    apiClient.setAccessToken(null);
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return apiClient.request('/auth/me', 'GET');
  },

  async deleteAccount(): Promise<void> {
    await apiClient.request('/auth/account', 'DELETE', {});
    apiClient.setAccessToken(null);
  },

  setAccessToken(token: string | null): void {
    apiClient.setAccessToken(token);
  },
};
