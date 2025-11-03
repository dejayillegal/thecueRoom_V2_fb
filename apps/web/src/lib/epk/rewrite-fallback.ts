type Tone = "press" | "concise" | "promotional" | "technical";

interface RewriteResult {
  tagline: string;
  blurb: string;
  epk_bio: string;
}

const SYNONYMS: Record<string, string[]> = {
  performs: ["plays", "showcases", "presents", "delivers"],
  music: ["sound", "sonic landscape", "audio", "tracks"],
  shows: ["performances", "sets", "appearances", "gigs"],
  style: ["approach", "aesthetic", "vibe", "signature sound"],
  years: ["seasons", "years of experience", "time"],
  experience: ["background", "history", "journey", "career"],
  known: ["recognized", "celebrated", "noted", "acclaimed"],
  unique: ["distinctive", "signature", "original", "standout"],
  energy: ["vibe", "atmosphere", "feeling", "presence"],
  crowd: ["audience", "fans", "listeners", "attendees"],
};

const TONE_TEMPLATES: Record<Tone, { prefix: string; style: string }> = {
  press: {
    prefix: "Acclaimed",
    style: "professional and journalistic",
  },
  concise: {
    prefix: "DJ and producer",
    style: "brief and punchy",
  },
  promotional: {
    prefix: "Electrifying",
    style: "exciting and promotional",
  },
  technical: {
    prefix: "Experienced",
    style: "technical and detailed",
  },
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function parseBio(text: string): {
  sentences: string[];
  genres: string[];
  experience: string | null;
  shows: string[];
  quotes: string[];
} {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const genreKeywords = [
    "house",
    "techno",
    "trance",
    "dnb",
    "dubstep",
    "ambient",
    "electronic",
    "edm",
    "bass",
    "minimal",
  ];
  const genres: string[] = [];

  const lowerText = text.toLowerCase();
  genreKeywords.forEach((genre) => {
    if (lowerText.includes(genre)) {
      genres.push(genre);
    }
  });

  const experienceMatch = text.match(/(\d+)\+?\s*(years?|seasons?)/i);
  const experience = experienceMatch ? experienceMatch[0] : null;

  const shows: string[] = [];
  const showPatterns = [
    /(?:performed|played|appeared)\s+(?:at|in)\s+([A-Z][A-Za-z\s&]+?)(?:[,.!]|$)/g,
    /(?:headlined|supported)\s+(?:at|in)\s+([A-Z][A-Za-z\s&]+?)(?:[,.!]|$)/g,
  ];

  showPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      shows.push(match[1].trim());
    }
  });

  const quotePattern = /"([^"]+)"/g;
  const quotes: string[] = [];
  let quoteMatch;
  while ((quoteMatch = quotePattern.exec(text)) !== null) {
    quotes.push(quoteMatch[1]);
  }

  return { sentences, genres, experience, shows, quotes };
}

function applySynonymsDeterministic(text: string, seed: string): string {
  let result = text;
  const hash = simpleHash(seed);

  Object.entries(SYNONYMS).forEach(([word, replacements], index) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    if (regex.test(result)) {
      const replacementIndex = (hash + index) % replacements.length;
      const replacement = replacements[replacementIndex];
      result = result.replace(regex, replacement);
    }
  });
  return result;
}

function generateTagline(
  parsed: ReturnType<typeof parseBio>,
  tone: Tone,
): string {
  const template = TONE_TEMPLATES[tone];
  const genre = parsed.genres[0] || "Electronic";

  const taglines: Record<Tone, string> = {
    press: `${template.prefix} ${genre} artist`,
    concise: `${genre} ${template.prefix}`,
    promotional: `${template.prefix} ${genre} experience`,
    technical: `${template.prefix} ${genre} specialist`,
  };

  let tagline = taglines[tone];

  if (tagline.length > 80) {
    tagline = tagline.substring(0, 77) + "...";
  }

  return tagline;
}

function generateBlurb(
  parsed: ReturnType<typeof parseBio>,
  tone: Tone,
  seed: string,
): string {
  const genre = parsed.genres[0] || "electronic music";
  const experience = parsed.experience || "extensive experience";
  const template = TONE_TEMPLATES[tone];

  let blurb = "";

  switch (tone) {
    case "press":
      blurb = `${template.prefix} ${genre} artist with ${experience} in the industry, known for ${parsed.shows.length > 0 ? "performances at " + parsed.shows.slice(0, 2).join(" and ") : "captivating live sets"}.`;
      break;
    case "concise":
      blurb = `${genre} ${template.prefix}. ${experience}. ${parsed.shows.length > 0 ? "Featured at " + parsed.shows[0] : "Dynamic live performer"}.`;
      break;
    case "promotional":
      blurb = `${template.prefix} ${genre} artist bringing ${experience} to every performance. ${parsed.shows.length > 0 ? "Headlined " + parsed.shows.slice(0, 2).join(", ") : "Unforgettable sets guaranteed"}.`;
      break;
    case "technical":
      blurb = `${template.prefix} ${genre} producer and DJ with ${experience}. Specializes in ${parsed.genres.slice(0, 2).join(", ")} production${parsed.shows.length > 0 ? ", with appearances at " + parsed.shows[0] : ""}.`;
      break;
  }

  blurb = applySynonymsDeterministic(blurb, seed);

  if (blurb.length < 90) {
    blurb = blurb + " " + (parsed.sentences[0] || "").substring(0, 50);
  }

  if (blurb.length > 160) {
    blurb = blurb.substring(0, 157) + "...";
  }

  return blurb;
}

function generateEPKBio(
  parsed: ReturnType<typeof parseBio>,
  tone: Tone,
  seed: string,
): string {
  const template = TONE_TEMPLATES[tone];
  const genre = parsed.genres.join(", ") || "electronic music";
  const experience = parsed.experience || "years of experience";

  let bio = "";

  const intro = `${template.prefix} artist in the ${genre} scene, with ${experience} delivering dynamic performances and innovative productions.`;

  const body =
    parsed.sentences.slice(0, 3).join(". ") ||
    "Known for captivating audiences with unique sonic landscapes and technical prowess.";

  const shows =
    parsed.shows.length > 0
      ? ` Notable appearances include ${parsed.shows.slice(0, 3).join(", ")}.`
      : " Continues to push boundaries in live performance and studio production.";

  const quotes =
    parsed.quotes.length > 0
      ? ` Critics have noted: "${parsed.quotes[0]}"`
      : "";

  bio = intro + " " + applySynonymsDeterministic(body, seed) + shows + quotes;

  if (bio.length > 500) {
    bio = bio.substring(0, 497) + "...";
  } else if (bio.length < 300) {
    bio =
      bio +
      " " +
      (parsed.sentences.slice(3, 5).join(". ") ||
        "Committed to excellence in every aspect of their craft.");
  }

  return bio;
}

export function deterministicRewrite(
  text: string,
  tone: Tone = "press",
): RewriteResult {
  if (!text || text.trim().length === 0) {
    return {
      tagline: "Electronic Music Artist",
      blurb:
        "Innovative producer and performer bringing fresh energy to the electronic music scene.",
      epk_bio:
        "An emerging artist in the electronic music landscape, dedicated to creating memorable experiences through sound. With a passion for innovation and a commitment to craft, they continue to evolve and inspire audiences worldwide.",
    };
  }

  const seed = text + tone;
  const parsed = parseBio(text);

  return {
    tagline: generateTagline(parsed, tone),
    blurb: generateBlurb(parsed, tone, seed),
    epk_bio: generateEPKBio(parsed, tone, seed),
  };
}

export function sanitizeForHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
