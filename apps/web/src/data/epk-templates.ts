export interface EPKTemplate {
  id: string;
  name: string;
  tag: string;
  modules: string[];
  description: string;
  category:
    | "modern"
    | "minimalist"
    | "editorial"
    | "futuristic"
    | "retro"
    | "premium"
    | "visual";
  thumbnailSvg: string;
  colorScheme: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const EPK_TEMPLATES: EPKTemplate[] = [
  {
    id: "brutalist-onepage",
    name: "Brutalist One-Page",
    tag: "Bold",
    modules: ["bio", "quotes", "links", "tracklist", "techRider"],
    description: "Bold, minimalist single-page design with strong typography",
    category: "modern",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#0B0B0B"/><line x1="10" y1="20" x2="190" y2="20" stroke="#D1FF3D" stroke-width="3"/><rect x="10" y="30" width="180" height="10" fill="#333"/><rect x="10" y="50" width="100" height="6" fill="#555"/><rect x="10" y="60" width="140" height="6" fill="#555"/></svg>`,
    colorScheme: {
      primary: "#0B0B0B",
      accent: "#D1FF3D",
      background: "#000",
      text: "#FFF",
    },
  },
  {
    id: "minimalist-clean",
    name: "Minimalist Clean",
    tag: "Minimal",
    modules: ["bio", "quotes", "links", "tracklist"],
    description: "Ultra-clean, spacious design focusing on content",
    category: "minimalist",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#FAFAFA"/><rect x="60" y="30" width="80" height="4" fill="#000"/><rect x="50" y="50" width="100" height="2" fill="#666"/><rect x="50" y="60" width="100" height="2" fill="#666"/></svg>`,
    colorScheme: {
      primary: "#000",
      accent: "#FFF",
      background: "#FAFAFA",
      text: "#1A1A1A",
    },
  },
  {
    id: "magazine-editorial",
    name: "Magazine Editorial",
    tag: "Editorial",
    modules: ["bio", "quotes", "gallery", "links"],
    description: "Editorial-style layout inspired by music magazines",
    category: "editorial",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#F8F8F8"/><rect x="10" y="10" width="80" height="100" fill="#FF3366"/><rect x="100" y="10" width="90" height="30" fill="#DDD"/><rect x="100" y="50" width="90" height="60" fill="#EEE"/></svg>`,
    colorScheme: {
      primary: "#1A1A1A",
      accent: "#FF3366",
      background: "#F8F8F8",
      text: "#2A2A2A",
    },
  },
  {
    id: "tech-neon",
    name: "Tech Neon",
    tag: "Futuristic",
    modules: ["bio", "tracklist", "techRider", "video", "links"],
    description: "Futuristic cyberpunk-inspired design with neon accents",
    category: "futuristic",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#0A0E27"/><rect x="10" y="10" width="180" height="30" fill="none" stroke="#00FFD1" stroke-width="2"/><rect x="10" y="50" width="80" height="20" fill="#00FFD1" opacity="0.2"/><rect x="100" y="50" width="90" height="20" fill="#FF00FF" opacity="0.2"/></svg>`,
    colorScheme: {
      primary: "#0A0E27",
      accent: "#00FFD1",
      background: "#0D1117",
      text: "#E6E6E6",
    },
  },
  {
    id: "vintage-poster",
    name: "Vintage Poster",
    tag: "Retro",
    modules: ["bio", "quotes", "tourDates", "links"],
    description: "Retro concert poster aesthetic with classic typography",
    category: "retro",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#F4E8D8"/><rect x="20" y="20" width="160" height="80" fill="none" stroke="#8B4513" stroke-width="4"/><rect x="40" y="40" width="120" height="20" fill="#D4A574"/></svg>`,
    colorScheme: {
      primary: "#2C1810",
      accent: "#D4A574",
      background: "#F4E8D8",
      text: "#3A2415",
    },
  },
  {
    id: "glass-modern",
    name: "Glass Morphism",
    tag: "Modern",
    modules: ["bio", "gallery", "video", "quotes", "links"],
    description: "Modern glass effect with blur and transparency",
    category: "modern",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" /></linearGradient></defs><rect width="200" height="120" fill="url(#g1)"/><rect x="20" y="20" width="160" height="80" fill="#FFF" opacity="0.15" rx="10"/></svg>`,
    colorScheme: {
      primary: "#1E1E1E",
      accent: "#A78BFA",
      background: "#F3F4F6",
      text: "#111827",
    },
  },
  {
    id: "dark-luxury",
    name: "Dark Luxury",
    tag: "Premium",
    modules: ["bio", "quotes", "gallery", "links"],
    description: "Premium dark theme with gold accents",
    category: "premium",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#0A0A0A"/><line x1="10" y1="30" x2="190" y2="30" stroke="#FFD700" stroke-width="1"/><rect x="10" y="40" width="180" height="15" fill="#1A1A1A"/><rect x="10" y="60" width="180" height="8" fill="#222"/></svg>`,
    colorScheme: {
      primary: "#0A0A0A",
      accent: "#FFD700",
      background: "#121212",
      text: "#E5E5E5",
    },
  },
  {
    id: "grid-mosaic",
    name: "Grid Mosaic",
    tag: "Visual",
    modules: ["gallery", "bio", "video", "quotes"],
    description: "Dynamic grid-based layout with image-heavy design",
    category: "visual",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#FAFAFA"/><rect x="10" y="10" width="60" height="50" fill="#F59E0B"/><rect x="80" y="10" width="60" height="50" fill="#10B981"/><rect x="150" y="10" width="40" height="50" fill="#3B82F6"/><rect x="10" y="70" width="180" height="40" fill="#DDD"/></svg>`,
    colorScheme: {
      primary: "#18181B",
      accent: "#F59E0B",
      background: "#FAFAFA",
      text: "#27272A",
    },
  },
  {
    id: "poster-stack",
    name: "Poster Stack",
    tag: "Bold",
    modules: ["bio", "gallery", "quotes", "tourDates"],
    description: "Layered poster design with bold elements",
    category: "modern",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#1A1A1A"/><rect x="30" y="20" width="140" height="80" fill="#D1FF3D" opacity="0.9"/><rect x="40" y="30" width="140" height="80" fill="#9B5CFF" opacity="0.7"/></svg>`,
    colorScheme: {
      primary: "#1A1A1A",
      accent: "#D1FF3D",
      background: "#000",
      text: "#FFF",
    },
  },
  {
    id: "modular-studio",
    name: "Modular Studio",
    tag: "Modern",
    modules: ["bio", "tracklist", "techRider", "gallery", "links"],
    description: "Flexible modular layout for comprehensive EPKs",
    category: "modern",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#0F0F0F"/><rect x="10" y="10" width="85" height="50" fill="#222" stroke="#D1FF3D" stroke-width="1"/><rect x="105" y="10" width="85" height="50" fill="#222" stroke="#D1FF3D" stroke-width="1"/><rect x="10" y="70" width="180" height="40" fill="#222" stroke="#D1FF3D" stroke-width="1"/></svg>`,
    colorScheme: {
      primary: "#0F0F0F",
      accent: "#D1FF3D",
      background: "#000",
      text: "#FFF",
    },
  },
  {
    id: "photobook",
    name: "Photobook",
    tag: "Visual",
    modules: ["gallery", "bio", "quotes"],
    description: "Photo-first design emphasizing visual storytelling",
    category: "visual",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#FFF"/><rect x="10" y="10" width="85" height="100" fill="#DDD"/><rect x="105" y="10" width="85" height="45" fill="#EEE"/><rect x="105" y="65" width="85" height="45" fill="#E5E5E5"/></svg>`,
    colorScheme: {
      primary: "#000",
      accent: "#666",
      background: "#FFF",
      text: "#333",
    },
  },
  {
    id: "club-flyer",
    name: "Club Flyer",
    tag: "Bold",
    modules: ["bio", "tourDates", "links"],
    description: "High-energy design inspired by club flyers",
    category: "modern",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#000"/><rect x="10" y="10" width="180" height="40" fill="#FF00FF"/><rect x="10" y="60" width="180" height="50" fill="#00FFFF"/><text x="100" y="35" font-size="20" fill="#000" text-anchor="middle" font-weight="bold">LIVE</text></svg>`,
    colorScheme: {
      primary: "#000",
      accent: "#FF00FF",
      background: "#000",
      text: "#FFF",
    },
  },
  {
    id: "minimalist-column",
    name: "Minimalist One-Column",
    tag: "Minimal",
    modules: ["bio", "tracklist", "links"],
    description: "Single-column minimal design for focused content",
    category: "minimalist",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#FDFDFD"/><rect x="60" y="20" width="80" height="8" fill="#000"/><rect x="60" y="40" width="80" height="4" fill="#999"/><rect x="60" y="50" width="80" height="4" fill="#999"/><rect x="60" y="60" width="80" height="4" fill="#999"/></svg>`,
    colorScheme: {
      primary: "#000",
      accent: "#F5F5F5",
      background: "#FDFDFD",
      text: "#1A1A1A",
    },
  },
  {
    id: "zine-editorial",
    name: "Zine Editorial",
    tag: "Editorial",
    modules: ["bio", "quotes", "gallery", "links"],
    description: "DIY zine-inspired layout with raw aesthetics",
    category: "editorial",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#FFFEF0"/><rect x="10" y="15" width="180" height="25" fill="#000" transform="rotate(-2 100 27)"/><rect x="15" y="50" width="170" height="60" fill="#FFD700" opacity="0.3"/></svg>`,
    colorScheme: {
      primary: "#000",
      accent: "#FFD700",
      background: "#FFFEF0",
      text: "#1A1A1A",
    },
  },
  {
    id: "industrial-poster",
    name: "Industrial Poster",
    tag: "Bold",
    modules: ["bio", "techRider", "quotes", "links"],
    description: "Industrial design with bold typography and grids",
    category: "modern",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#1A1A1A"/><rect x="10" y="10" width="180" height="100" fill="none" stroke="#D1FF3D" stroke-width="2"/><line x1="100" y1="10" x2="100" y2="110" stroke="#555" stroke-width="1"/><line x1="10" y1="60" x2="190" y2="60" stroke="#555" stroke-width="1"/></svg>`,
    colorScheme: {
      primary: "#1A1A1A",
      accent: "#D1FF3D",
      background: "#0F0F0F",
      text: "#FFF",
    },
  },
  {
    id: "photo-lead",
    name: "Photo-Lead",
    tag: "Visual",
    modules: ["gallery", "bio", "links"],
    description: "Lead with stunning visuals, minimal text",
    category: "visual",
    thumbnailSvg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#222"/><rect x="10" y="10" width="180" height="80" fill="#555"/><rect x="10" y="100" width="180" height="10" fill="#D1FF3D"/></svg>`,
    colorScheme: {
      primary: "#222",
      accent: "#D1FF3D",
      background: "#000",
      text: "#FFF",
    },
  },
];

export const EPK_CATEGORIES = [
  { id: "all", label: "All Templates" },
  { id: "modern", label: "Modern" },
  { id: "minimalist", label: "Minimalist" },
  { id: "editorial", label: "Editorial" },
  { id: "futuristic", label: "Futuristic" },
  { id: "retro", label: "Retro" },
  { id: "premium", label: "Premium" },
  { id: "visual", label: "Visual-Heavy" },
];
