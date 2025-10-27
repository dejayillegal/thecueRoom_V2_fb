export type UserRole = 'user' | 'admin';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type GigStatus = 'pending' | 'approved' | 'rejected';

export type AIJobType = 'cover-art' | 'epk' | 'meme' | 'avatar';

export type Source = {
  name: string;
  url: string;
  tags: string[];
  category: string;
  kind: 'rss' | 'scrape';
  maxItems?: number;
  config?: any;
};

export type FeedCategory = 'scene' | 'industry' | 'gear' | 'regional' | 'features' | 'edm' | 'community';

export type AvatarStyle = 'realistic' | 'cartoon' | 'abstract' | 'minimal';

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
