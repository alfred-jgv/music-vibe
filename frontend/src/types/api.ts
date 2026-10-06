export interface Vibe {
    id: string;
    name: string;
  }
  
  export interface Track {
    id: string;
    name: string;
    artist: string;
    album: string | null;
    previewUrl: string | null;
    externalUrl: string | null;
  }
  
  export interface VibeListResponse {
    vibes: Vibe[];
  }
  
  export interface VibeRecommendationResponse {
    vibeId: string;
    vibeName: string;
    tracks: Track[];
  }