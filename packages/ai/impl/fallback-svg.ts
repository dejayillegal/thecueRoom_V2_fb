import { nanoid } from 'nanoid';

export type SVGPreset =
  | 'neon-accent'
  | 'monochrome'
  | 'geometric'
  | 'brutalist'
  | 'cybergrind'
  | 'vaporwave'
  | 'chromatic-grid'
  | 'noir-light'
  | 'acid-geometry'
  | 'liquid-metal';

export interface FallbackSVGOptions {
  preset: SVGPreset;
  artist?: string;
  release?: string;
  seed?: number;
}

export interface SVGGeneratorOptions {
  preset?: string;
  seed?: number;
  artist?: string;
  release?: string;
  resolution?: string;
}

const PRESETS = {
  'neon-accent': {
    bg: '#0B0B0B',
    gradient1: '#D7FF3C',
    gradient2: '#9B5CFF',
    pattern: 'grain',
  },
  'monochrome': {
    bg: '#1A1A1A',
    gradient1: '#FFFFFF',
    gradient2: '#808080',
    pattern: 'lines',
  },
  'geometric': {
    bg: '#000000',
    gradient1: '#FF006E',
    gradient2: '#00F5FF',
    pattern: 'circles',
  },
  'brutalist': {
    bg: '#2A2A2A',
    gradient1: '#FF3C00',
    gradient2: '#FFFF00',
    pattern: 'blocks',
  },
  // Adding the remaining presets to ensure compatibility with existing SVGPreset type
  // These will not be used by the new generateSVG but keep the type definition valid
  'cybergrind': {
    bg: '#000000',
    gradient1: '#00ffff',
    gradient2: '#00ff00',
    pattern: '',
  },
  'vaporwave': {
    bg: '#FF6EC7',
    gradient1: '#B28DFF',
    gradient2: '#FFB5E8',
    pattern: '',
  },
  'chromatic-grid': {
    bg: '#000000',
    gradient1: '#FF00FF',
    gradient2: '#00FFFF',
    pattern: '',
  },
  'noir-light': {
    bg: '#000000',
    gradient1: '#FFFFFF',
    gradient2: '#FFFFFF',
    pattern: '',
  },
  'acid-geometry': {
    bg: '#1a001a',
    gradient1: '#FF00FF',
    gradient2: '#00FF00',
    pattern: '',
  },
  'liquid-metal': {
    bg: '#C0C0C0',
    gradient1: '#E8E8E8',
    gradient2: '#A8A8A8',
    pattern: '',
  },
};

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function generateNeonAccent(random: () => number, artist?: string, release?: string): string {
  const angle = Math.floor(random() * 360);
  const hue1 = 280 + Math.floor(random() * 40);
  const hue2 = 320 + Math.floor(random() * 40);

  const shapes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const cx = random() * 1024;
    const cy = random() * 1024;
    const r = 100 + random() * 200;
    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#grad${i})" opacity="${0.3 + random() * 0.4}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue1}, 70%, 15%);stop-opacity:1"/>
      <stop offset="100%" style="stop-color:hsl(${hue2}, 80%, 10%);stop-opacity:1"/>
    </linearGradient>
    ${Array.from({ length: 8 }, (_, i) => `
    <radialGradient id="grad${i}">
      <stop offset="0%" style="stop-color:hsl(${hue1 + i * 10}, 90%, 60%);stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:hsl(${hue2 - i * 5}, 85%, 40%);stop-opacity:0.2"/>
    </radialGradient>`).join('')}
    <filter id="glow">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g filter="url(#glow)">
    ${shapes.join('\n    ')}
  </g>
  ${artist ? `<text x="512" y="900" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" opacity="0.9">${escapeXML(artist)}</text>` : ''}
  ${release ? `<text x="512" y="960" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="hsl(${hue1}, 80%, 70%)" opacity="0.8">${escapeXML(release)}</text>` : ''}
</svg>`;
}

function generateMonochrome(random: () => number, artist?: string, release?: string): string {
  const gridSize = 8;
  const cellSize = 1024 / gridSize;
  const cells: string[] = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (random() > 0.5) {
        cells.push(`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${random() > 0.5 ? '#000' : '#fff'}"/>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#fff"/>
  ${cells.join('\n  ')}
  <rect x="0" y="0" width="1024" height="1024" fill="none" stroke="#000" stroke-width="20"/>
  ${artist ? `<text x="512" y="900" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="64" font-weight="900" fill="#000">${escapeXML(artist).toUpperCase()}</text>` : ''}
  ${release ? `<text x="512" y="960" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#666">${escapeXML(release).toUpperCase()}</text>` : ''}
</svg>`;
}

function generateGeometric(random: () => number, artist?: string, release?: string): string {
  const shapes: string[] = [];
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

  for (let i = 0; i < 12; i++) {
    const points: string[] = [];
    const sides = 3 + Math.floor(random() * 4);
    const cx = random() * 1024;
    const cy = random() * 1024;
    const radius = 50 + random() * 150;

    for (let j = 0; j < sides; j++) {
      const angle = (j * 2 * Math.PI) / sides;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    const color = colors[Math.floor(random() * colors.length)];
    shapes.push(`<polygon points="${points.join(' ')}" fill="${color}" opacity="${0.6 + random() * 0.3}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2C3E50;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#34495E;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${shapes.join('\n  ')}
  ${artist ? `<text x="512" y="900" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white" opacity="0.95">${escapeXML(artist)}</text>` : ''}
  ${release ? `<text x="512" y="960" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#4ECDC4" opacity="0.9">${escapeXML(release)}</text>` : ''}
</svg>`;
}

function generateBrutalist(random: () => number, artist?: string, release?: string): string {
  const bars: string[] = [];
  for (let i = 0; i < 15; i++) {
    const y = i * 70;
    const width = 200 + random() * 600;
    const shade = Math.floor(random() * 100);
    bars.push(`<rect x="0" y="${y}" width="${width}" height="60" fill="rgb(${shade}, ${shade}, ${shade})"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <pattern id="noise" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="#1a1a1a"/>
      ${Array.from({ length: 50 }, () => {
        const x = random() * 100;
        const y = random() * 100;
        const shade = Math.floor(random() * 50) + 30;
        return `<rect x="${x}" y="${y}" width="2" height="2" fill="rgb(${shade}, ${shade}, ${shade})"/>`;
      }).join('')}
    </pattern>
  </defs>
  <rect width="1024" height="1024" fill="url(#noise)"/>
  ${bars.join('\n  ')}
  ${artist ? `<text x="50" y="900" font-family="Arial Black, sans-serif" font-size="72" font-weight="900" fill="white" transform="skewY(-5)">${escapeXML(artist).toUpperCase()}</text>` : ''}
  ${release ? `<text x="50" y="980" font-family="Arial, sans-serif" font-size="32" fill="#ccc" transform="skewY(-5)">${escapeXML(release).toUpperCase()}</text>` : ''}
</svg>`;
}

function generateCybergrind(random: () => number, artist?: string, release?: string): string {
  const lines: string[] = [];
  const circuits: string[] = [];

  for (let i = 0; i < 30; i++) {
    const x1 = random() * 1024;
    const y1 = random() * 1024;
    const x2 = random() * 1024;
    const y2 = random() * 1024;
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#00ffff" stroke-width="${1 + random() * 3}" opacity="${0.2 + random() * 0.5}"/>`);
  }

  for (let i = 0; i < 20; i++) {
    const cx = random() * 1024;
    const cy = random() * 1024;
    const r = 5 + random() * 15;
    circuits.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#00ff00" stroke-width="2" opacity="${0.6 + random() * 0.4}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#001a33;stop-opacity:1"/>
    </linearGradient>
    <filter id="glitch">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3"/>
      <feDisplacementMap in="SourceGraphic" scale="5"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g opacity="0.7">
    ${lines.join('\n    ')}
  </g>
  <g>
    ${circuits.join('\n    ')}
  </g>
  ${artist ? `<text x="512" y="900" text-anchor="middle" font-family="Courier New, monospace" font-size="64" font-weight="bold" fill="#00ffff" filter="url(#glitch)">${escapeXML(artist).toUpperCase()}</text>` : ''}
  ${release ? `<text x="512" y="970" text-anchor="middle" font-family="Courier New, monospace" font-size="36" fill="#00ff00" opacity="0.8">${escapeXML(release).toUpperCase()}</text>` : ''}
</svg>`;
}

function generateVaporwave(random: () => number, artist?: string, release?: string): string {
  const gridLines: string[] = [];
  const spacing = 40;

  for (let i = 0; i < 1024; i += spacing) {
    gridLines.push(`<line x1="0" y1="${i}" x2="1024" y2="${i}" stroke="#ff00ff" stroke-width="1" opacity="0.3"/>`);
    gridLines.push(`<line x1="${i}" y1="0" x2="${i}" y2="1024" stroke="#00ffff" stroke-width="1" opacity="0.3"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="sunset" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6EC7;stop-opacity:1"/>
      <stop offset="50%" style="stop-color:#FFB5E8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#B28DFF;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#sunset)"/>
  <g transform="translate(512, 600) scale(1, 0.3)">
    ${gridLines.join('\n    ')}
  </g>
  <circle cx="512" cy="300" r="150" fill="#FFD700" opacity="0.8"/>
  <circle cx="512" cy="300" r="140" fill="#FFA000" opacity="0.6"/>
  ${artist ? `<text x="512" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#fff" stroke="#ff00ff" stroke-width="2">${escapeXML(artist)}</text>` : ''}
  ${release ? `<text x="512" y="920" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#fff" opacity="0.9">${escapeXML(release)}</text>` : ''}
</svg>`;
}

function generateChromaticGrid(random: () => number, artist?: string, release?: string): string {
  const gridSize = 16;
  const cellSize = 1024 / gridSize;
  const cells: string[] = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const hue = ((x + y) * 20) % 360;
      const lightness = 40 + random() * 30;
      cells.push(`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="hsl(${hue}, 80%, ${lightness}%)" opacity="${0.7 + random() * 0.3}"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <filter id="blur">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="#000"/>
  <g filter="url(#blur)">
    ${cells.join('\n    ')}
  </g>
  ${artist ? `<rect x="0" y="850" width="1024" height="174" fill="#000" opacity="0.7"/><text x="512" y="920" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white">${escapeXML(artist)}</text>` : ''}
  ${release ? `<text x="512" y="990" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#ccc">${escapeXML(release)}</text>` : ''}
</svg>`;
}

function generateNoirLight(random: () => number, artist?: string, release?: string): string {
  const beams: string[] = [];

  for (let i = 0; i < 5; i++) {
    const x = 200 + i * 150;
    const width = 30 + random() * 50;
    beams.push(`<rect x="${x}" y="0" width="${width}" height="1024" fill="url(#beam${i})" opacity="${0.3 + random() * 0.4}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="spotlight">
      <stop offset="0%" style="stop-color:#fff;stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:#000;stop-opacity:1"/>
    </radialGradient>
    ${Array.from({ length: 5 }, (_, i) => `
    <linearGradient id="beam${i}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fff;stop-opacity:${0.2 + random() * 0.3}"/>
      <stop offset="100%" style="stop-color:#fff;stop-opacity:0"/>
    </linearGradient>`).join('')}
  </defs>
  <rect width="1024" height="1024" fill="#000"/>
  ${beams.join('\n  ')}
  <circle cx="512" cy="512" r="400" fill="url(#spotlight)" opacity="0.6"/>
  ${artist ? `<text x="512" y="900" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="bold" fill="white" opacity="0.95">${escapeXML(artist)}</text>` : ''}
  ${release ? `<text x="512" y="970" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#ccc" opacity="0.8">${escapeXML(release)}</text>` : ''}
</svg>`;
}

function generateAcidGeometry(random: () => number, artist?: string, release?: string): string {
  const shapes: string[] = [];
  const neonColors = ['#FF00FF', '#00FF00', '#00FFFF', '#FFFF00', '#FF0080'];

  for (let i = 0; i < 20; i++) {
    const cx = random() * 1024;
    const cy = random() * 1024;
    const r = 20 + random() * 100;
    const color = neonColors[Math.floor(random() * neonColors.length)];

    if (random() > 0.5) {
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${2 + random() * 4}" opacity="${0.4 + random() * 0.5}"/>`);
    } else {
      const size = 40 + random() * 120;
      shapes.push(`<rect x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${2 + random() * 4}" opacity="${0.4 + random() * 0.5}" transform="rotate(${random() * 360} ${cx} ${cy})"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bg">
      <stop offset="0%" style="stop-color:#1a001a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#000;stop-opacity:1"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g filter="url(#glow)">
    ${shapes.join('\n    ')}
  </g>
  ${artist ? `<text x="512" y="900" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="64" font-weight="900" fill="#00FF00" filter="url(#glow)">${escapeXML(artist).toUpperCase()}</text>` : ''}
  ${release ? `<text x="512" y="970" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#FF00FF" opacity="0.9">${escapeXML(release).toUpperCase()}</text>` : ''}
</svg>`;
}

function generateLiquidMetal(random: () => number, artist?: string, release?: string): string {
  const waves: string[] = [];

  for (let i = 0; i < 10; i++) {
    const y = i * 100;
    const amplitude = 30 + random() * 50;
    const frequency = 0.005 + random() * 0.01;
    const points: string[] = [];

    for (let x = 0; x <= 1024; x += 10) {
      const offsetY = Math.sin(x * frequency) * amplitude;
      points.push(`${x},${y + offsetY}`);
    }

    const path = `M ${points.join(' L ')} L 1024,1024 L 0,1024 Z`;
    waves.push(`<path d="${path}" fill="url(#wave${i})" opacity="${0.3 + random() * 0.4}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C0C0C0;stop-opacity:1"/>
      <stop offset="50%" style="stop-color:#E8E8E8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#A8A8A8;stop-opacity:1"/>
    </linearGradient>
    ${Array.from({ length: 10 }, (_, i) => `
    <linearGradient id="wave${i}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#888;stop-opacity:0.8"/>
      <stop offset="50%" style="stop-color:#fff;stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:#888;stop-opacity:0.8"/>
    </linearGradient>`).join('')}
    <filter id="metallic">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
      <feOffset dx="2" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.5"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#metal)"/>
  <g filter="url(#metallic)">
    ${waves.join('\n    ')}
  </g>
  ${artist ? `<text x="512" y="900" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#333" filter="url(#metallic)">${escapeXML(artist)}</text>` : ''}
  ${release ? `<text x="512" y="970" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#555" opacity="0.9">${escapeXML(release)}</text>` : ''}
</svg>`;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateFallbackSVG(options: FallbackSVGOptions): string {
  const seed = options.seed ?? Math.floor(Math.random() * 1000000);
  const random = seededRandom(seed);

  const generators: Record<SVGPreset, (random: () => number, artist?: string, release?: string) => string> = {
    'neon-accent': generateNeonAccent,
    'monochrome': generateMonochrome,
    'geometric': generateGeometric,
    'brutalist': generateBrutalist,
    'cybergrind': generateCybergrind,
    'vaporwave': generateVaporwave,
    'chromatic-grid': generateChromaticGrid,
    'noir-light': generateNoirLight,
    'acid-geometry': generateAcidGeometry,
    'liquid-metal': generateLiquidMetal,
  };

  const generator = generators[options.preset];
  return generator(random, options.artist, options.release);
}

export function getRandomPreset(): SVGPreset {
  const presets: SVGPreset[] = [
    'neon-accent',
    'monochrome',
    'geometric',
    'brutalist',
    'cybergrind',
    'vaporwave',
    'chromatic-grid',
    'noir-light',
    'acid-geometry',
    'liquid-metal',
  ];
  return presets[Math.floor(Math.random() * presets.length)] as SVGPreset;
}

export const PRESET_METADATA: Record<SVGPreset, { name: string; description: string }> = {
  'neon-accent': {
    name: 'Neon Accent',
    description: 'Purple/pink gradient glow with chrome shapes',
  },
  'monochrome': {
    name: 'Monochrome',
    description: 'Black/white brutalist grid composition',
  },
  'geometric': {
    name: 'Geometric',
    description: 'Triangles, polygons, structured shapes',
  },
  'brutalist': {
    name: 'Brutalist',
    description: 'Rough textures, industrial gradients',
  },
  'cybergrind': {
    name: 'Cybergrind',
    description: 'Glitchy circuits, blue lasers',
  },
  'vaporwave': {
    name: 'Vaporwave',
    description: 'Pastel gradients, digital sun, 80s wireframes',
  },
  'chromatic-grid': {
    name: 'Chromatic Grid',
    description: 'Rainbow grids with blur filters',
  },
  'noir-light': {
    name: 'Noir Light',
    description: 'High-contrast light shafts, noir spotlight',
  },
  'acid-geometry': {
    name: 'Acid Geometry',
    description: 'Neon geometric chaos, techno vibe',
  },
  'liquid-metal': {
    name: 'Liquid Metal',
    description: 'Silver distortions, wave mesh lighting',
  },
};

export function generateSVG(options: SVGGeneratorOptions): string {
  const presetKey = options.preset || 'neon-accent';
  const preset = PRESETS[presetKey] || PRESETS['neon-accent'];
  const seed = options.seed || Math.random();

  // Seeded random
  const rng = (s: number) => {
    const x = Math.sin(s * seed) * 10000;
    return x - Math.floor(x);
  };

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${preset.gradient1};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${preset.gradient2};stop-opacity:0.8" />
    </linearGradient>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="${rng(1) * 0.5 + 0.5}" numOctaves="4" />
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="1024" height="1024" fill="${preset.bg}"/>
  <rect width="1024" height="1024" fill="url(#grad1)" opacity="0.6"/>
  <rect width="1024" height="1024" filter="url(#noise)" opacity="0.15"/>

  ${generatePattern(preset.pattern, seed, rng)}

  <rect x="64" y="64" width="896" height="896" fill="none" stroke="${preset.gradient1}" stroke-width="4" opacity="0.3"/>
  ${options.artist ? `<text x="512" y="900" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" opacity="0.9">${escapeXML(options.artist)}</text>` : ''}
  ${options.release ? `<text x="512" y="960" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="${preset.gradient1}" opacity="0.8">${escapeXML(options.release)}</text>` : ''}
</svg>`;

  return svg;
}

function generatePattern(type: string, seed: number, rng: (s: number) => number): string {
  switch (type) {
    case 'grain':
      return `<circle cx="${rng(2) * 800 + 112}" cy="${rng(3) * 800 + 112}" r="${rng(4) * 300 + 100}" fill="white" opacity="0.05"/>`;
    case 'lines':
      return Array.from({ length: 20 }, (_, i) =>
        `<line x1="0" y1="${i * 50}" x2="1024" y2="${i * 50}" stroke="white" stroke-width="2" opacity="0.1"/>`
      ).join('');
    case 'circles':
      return Array.from({ length: 10 }, (_, i) =>
        `<circle cx="${rng(i * 2) * 1024}" cy="${rng(i * 3) * 1024}" r="${rng(i * 4) * 200 + 50}" fill="none" stroke="white" stroke-width="2" opacity="0.1"/>`
      ).join('');
    case 'blocks':
      return Array.from({ length: 15 }, (_, i) =>
        `<rect x="${rng(i * 2) * 900}" y="${rng(i * 3) * 900}" width="${rng(i * 4) * 100 + 50}" height="${rng(i * 5) * 100 + 50}" fill="white" opacity="0.05"/>`
      ).join('');
    default:
      return '';
  }
}