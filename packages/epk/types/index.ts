export interface EPKModule {
  id: string;
  type: 'bio' | 'tracklist' | 'gallery' | 'techRider' | 'links' | 'quotes';
  order: number;
  data: any;
}

export interface TechRiderItem {
  id: string;
  type: 'cdj' | 'mixer' | 'speakers' | 'turntable' | 'custom';
  label: string;
  quantity?: number;
}

export interface TracklistItem {
  title: string;
  soundcloudUrl?: string;
  releaseLinks?: { platform: string; url: string }[];
}

export interface EPKTemplate {
  id: string;
  name: string;
  description: string;
  previewThumbnail: string;
  layout: 'brutalist-onepage' | 'gallery-two-column' | 'console-minimal' | 'presskit-compact';
}

export interface EPKGenerateRequest {
  templateId: string;
  modules: EPKModule[];
  artistName?: string;
  releaseTitle?: string;
  resolution?: number;
  includeWatermark?: boolean;
  exportFormat: 'pdf' | 'zip' | 'png';
}

export interface EPKJob {
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIRewriteRequest {
  text: string;
  tone?: 'press' | 'bio' | 'concise' | 'brutalist';
}

export interface AIRewriteResponse {
  ok: boolean;
  rewritten: string;
  usedHF?: boolean;
}
