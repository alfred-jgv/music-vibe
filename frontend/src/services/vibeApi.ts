import type { VibeListResponse, VibeRecommendationResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

export class ApiError extends Error {
    public status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export const vibeApi = {
  listVibes: () => request<VibeListResponse>('/api/vibes'),
  recommend: (vibeId: string) =>
    request<VibeRecommendationResponse>(`/api/vibes/${encodeURIComponent(vibeId)}`),
};