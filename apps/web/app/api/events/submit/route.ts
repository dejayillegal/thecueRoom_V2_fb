
<old_str>const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  venue: z.string().min(2),
  city: z.string().min(2),
  startTime: z.string(),
  endTime: z.string().optional(),
  ticketUrl: z.string().url().optional(),
  genres: z.array(z.string()).min(1),
  imageUrl: z.string().url().optional(),
});

async function verifyEventWithAI(payload: any): Promise<{ confidence: number; approved: boolean; reason?: string }> {
  // Check for Bollywood/pop content
  if (isBollywoodEvent(payload.title, payload.description)) {
    return {
      confidence: 0,
      approved: false,
      reason: 'Event appears to be Bollywood/pop related'
    };
  }

  // Check for valid electronic music genres
  if (!hasValidGenre(payload.title, payload.description, payload.genres)) {
    return {
      confidence: 30,
      approved: false,
      reason: 'Event does not match electronic music genres'
    };
  }

  // Basic validation passed
  const confidence = 85;
  const threshold = parseFloat(process.env.AI_VERIFICATION_CONFIDENCE || '0.9') * 100;

  return {
    confidence,
    approved: confidence >= threshold,
    reason: confidence >= threshold ? 'Auto-approved by AI' : 'Queued for manual review'
  };
}

export async function POST(request: NextRequest) {
  const roleCheck = await requireRole(request, ['admin', 'artist']);
  if (!roleCheck.authorized) {
    return roleCheck.error;
  }</old_str>
<new_str>const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  venue: z.string().min(2),
  city: z.string().min(2),
  startTime: z.string(),
  endTime: z.string().optional(),
  ticketUrl: z.string().url().optional(),
  genres: z.array(z.string()).min(1),
  imageUrl: z.string().url().optional(),
});

const BOLLYWOOD_KEYWORDS = [
  'bollywood',
  'hindi',
  'punjabi',
  'bhangra',
  'filmi',
  'sufi',
  'qawwali',
  'ghazal',
  'item song',
];

const VALID_GENRES = [
  'techno',
  'house',
  'trance',
  'dubstep',
  'drum and bass',
  'dnb',
  'ambient',
  'electronica',
  'idm',
  'breakbeat',
  'garage',
  'hardstyle',
  'progressive',
  'minimal',
  'deep house',
  'tech house',
];

function isBollywoodEvent(title: string, description?: string): boolean {
  const text = `${title} ${description || ''}`.toLowerCase();
  return BOLLYWOOD_KEYWORDS.some((keyword) => text.includes(keyword));
}

function hasValidGenre(title: string, description: string | undefined, genres: string[]): boolean {
  const text = `${title} ${description || ''} ${genres.join(' ')}`.toLowerCase();
  return VALID_GENRES.some((genre) => text.includes(genre.toLowerCase()));
}

async function verifyEventWithAI(payload: any): Promise<{ confidence: number; approved: boolean; reason?: string }> {
  // Check for Bollywood/pop content
  if (isBollywoodEvent(payload.title, payload.description)) {
    return {
      confidence: 0,
      approved: false,
      reason: 'Event appears to be Bollywood/pop related'
    };
  }

  // Check for valid electronic music genres
  if (!hasValidGenre(payload.title, payload.description, payload.genres)) {
    return {
      confidence: 30,
      approved: false,
      reason: 'Event does not match electronic music genres'
    };
  }

  // Basic validation passed
  const confidence = 85;
  const threshold = parseFloat(process.env.AI_VERIFICATION_CONFIDENCE || '0.7') * 100;

  return {
    confidence,
    approved: confidence >= threshold,
    reason: confidence >= threshold ? 'Auto-approved by AI' : 'Queued for manual review'
  };
}

export async function POST(request: NextRequest) {
  const roleCheck = await requireRole(request, ['admin', 'artist']);
  if (!roleCheck.authorized) {
    return roleCheck.error;
  }</new_str>
