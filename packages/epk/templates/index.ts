import { EPKTemplate, EPKModuleType } from '../types';

export const EPK_TEMPLATES: EPKTemplate[] = [
  {
    id: 'brutalist-onepage',
    name: 'Brutalist One-Page',
    description: 'Bold, minimalist single-page design with strong typography',
    previewThumbnail: '/templates/brutalist.png',
    layout: 'brutalist-onepage',
    category: 'modern',
    supportedModules: ['bio', 'quotes', 'links', 'tracklist', 'techRider', 'gallery', 'video', 'tourDates'],
    colorScheme: {
      primary: '#0B0B0B',
      accent: '#D7FF3C',
      secondary: '#9B5CFF',
      background: '#FFFFFF',
      text: '#0B0B0B'
    }
  },
  {
    id: 'minimalist-clean',
    name: 'Minimalist Clean',
    description: 'Ultra-clean, spacious design focusing on content with maximum white space',
    previewThumbnail: '/templates/minimalist.png',
    layout: 'minimalist-clean',
    category: 'minimal',
    supportedModules: ['bio', 'quotes', 'links', 'tracklist', 'gallery', 'pressTimeline'],
    colorScheme: {
      primary: '#000000',
      accent: '#FFFFFF',
      secondary: '#F5F5F5',
      background: '#FAFAFA',
      text: '#1A1A1A'
    }
  },
  {
    id: 'magazine-editorial',
    name: 'Magazine Editorial',
    description: 'Editorial-style layout inspired by music magazines',
    previewThumbnail: '/templates/magazine.png',
    layout: 'magazine-editorial',
    category: 'editorial',
    supportedModules: ['bio', 'quotes', 'gallery', 'pressTimeline', 'discography', 'links'],
    colorScheme: {
      primary: '#1A1A1A',
      accent: '#FF3366',
      secondary: '#FFD700',
      background: '#F8F8F8',
      text: '#2A2A2A'
    }
  },
  {
    id: 'tech-neon',
    name: 'Tech Neon',
    description: 'Futuristic cyberpunk-inspired design with neon accents',
    previewThumbnail: '/templates/tech-neon.png',
    layout: 'tech-neon',
    category: 'futuristic',
    supportedModules: ['bio', 'tracklist', 'techRider', 'video', 'links', 'gallery'],
    colorScheme: {
      primary: '#0A0E27',
      accent: '#00FFD1',
      secondary: '#FF00FF',
      background: '#0D1117',
      text: '#E6E6E6'
    }
  },
  {
    id: 'vintage-poster',
    name: 'Vintage Poster',
    description: 'Retro concert poster aesthetic with classic typography',
    previewThumbnail: '/templates/vintage.png',
    layout: 'vintage-poster',
    category: 'retro',
    supportedModules: ['bio', 'quotes', 'tourDates', 'links', 'gallery'],
    colorScheme: {
      primary: '#2C1810',
      accent: '#D4A574',
      secondary: '#8B4513',
      background: '#F4E8D8',
      text: '#3A2415'
    }
  },
  {
    id: 'glass-modern',
    name: 'Glass Morphism',
    description: 'Modern glass effect with blur and transparency',
    previewThumbnail: '/templates/glass.png',
    layout: 'glass-modern',
    category: 'modern',
    supportedModules: ['bio', 'gallery', 'video', 'quotes', 'links', 'discography'],
    colorScheme: {
      primary: '#1E1E1E',
      accent: '#A78BFA',
      secondary: '#60A5FA',
      background: '#F3F4F6',
      text: '#111827'
    }
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    description: 'Premium dark theme with gold accents for luxury brands',
    previewThumbnail: '/templates/luxury.png',
    layout: 'dark-luxury',
    category: 'premium',
    supportedModules: ['bio', 'quotes', 'pressTimeline', 'gallery', 'discography', 'links'],
    colorScheme: {
      primary: '#0A0A0A',
      accent: '#FFD700',
      secondary: '#C0C0C0',
      background: '#121212',
      text: '#E5E5E5'
    }
  },
  {
    id: 'grid-mosaic',
    name: 'Grid Mosaic',
    description: 'Dynamic grid-based layout with image-heavy design',
    previewThumbnail: '/templates/grid.png',
    layout: 'grid-mosaic',
    category: 'visual',
    supportedModules: ['gallery', 'bio', 'video', 'quotes', 'links'],
    colorScheme: {
      primary: '#18181B',
      accent: '#F59E0B',
      secondary: '#10B981',
      background: '#FAFAFA',
      text: '#27272A'
    }
  }
];

export function getTemplate(id: string): EPKTemplate | undefined {
  return EPK_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): EPKTemplate[] {
  return EPK_TEMPLATES.filter(t => t.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(EPK_TEMPLATES.map(t => t.category))];
}
