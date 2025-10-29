export interface AIJobMetadata {
  jobId: string;
  prompt?: string;
  style?: string;
  artist?: string;
  release?: string;
  seed?: number;
  mode: 'ai' | 'fallback';
  createdAt: string;
}

export interface AIJobResult {
  jobId: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  mode: 'ai' | 'fallback';
  error?: string;
}

export interface GenerationRequest {
  prompt?: string;
  artist?: string;
  release?: string;
  style?: string;
  mode?: 'random';
}
