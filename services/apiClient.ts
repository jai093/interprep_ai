/// <reference types="vite/client" />

// Use Vite environment variable in the browser build.
// - When `VITE_API_URL` is set, use it (for deployed/staging backends).
// - When running locally (hostname === 'localhost') and the var is unset, fall back to localhost backend.
// - Otherwise (deployed frontend with no VITE_API_URL), use an empty string so requests become relative to the current origin.
const _envApiUrl = (import.meta.env.VITE_API_URL as string) || '';
let API_URL = '';
if (_envApiUrl) {
  API_URL = _envApiUrl;
} else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  API_URL = 'http://localhost:5000';
} else {
  API_URL = ''; // use relative paths in production when no explicit API host is provided
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'candidate' | 'recruiter';
  };
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(includeAuth),
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_URL}/api${endpoint}`, options);

      if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { error: text || `HTTP Error ${response.status}` };
        }

        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;
