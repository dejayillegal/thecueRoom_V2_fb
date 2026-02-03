import { createHash } from 'crypto';

const PREFIXES = ['signal', 'bass', 'static', 'sub', 'freq', 'void', 'rhythm', 'echo', 'pulse', 'wave'];
const CORES = ['void', 'ritual', 'operator', 'flow', 'grid', 'node', 'synth', 'core', 'beat', 'signal'];
const SUFFIXES = ['x', 'v2', 'node', 'prime', 'alpha', 'omega', 'zero', 'one', 'mod', 'sync'];

export function generateUndergroundUsername(seed: string): string {
  const hash = createHash('md5').update(seed).digest('hex');
  const pIdx = parseInt(hash.substring(0, 2), 16) % PREFIXES.length;
  const cIdx = parseInt(hash.substring(2, 4), 16) % CORES.length;
  const sIdx = parseInt(hash.substring(4, 6), 16) % SUFFIXES.length;
  
  return `${PREFIXES[pIdx]}${CORES[cIdx]}_${SUFFIXES[sIdx]}`.toLowerCase();
}

export function generateDeterministicAvatar(seed: string): string {
  const hash = createHash('md5').update(seed).digest('hex');
  
  // Base colors - Industrial/Underground Palette
  const hue = parseInt(hash.substring(0, 2), 16) % 60 > 30 ? 65 : 180; // Either Lime (65) or Cyan/Blue (180) accents
  const isLime = hue === 65;
  const accentColor = isLime ? '#D7FF3C' : '#9B5CFF';
  
  // Droid configuration
  const headType = parseInt(hash.substring(2, 3), 16) % 3; // 0: Square, 1: Angled, 2: Narrow
  const eyeType = parseInt(hash.substring(3, 4), 16) % 4; // 0: Visor, 1: Mono, 2: Dual, 3: Cyber-quad
  const mouthType = parseInt(hash.substring(4, 5), 16) % 3; // 0: Grille, 1: Plate, 2: Minimal
  const detailLevel = parseInt(hash.substring(5, 6), 16) % 5 + 3;

  let svg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background & Shadow
  svg += `<rect width="200" height="200" fill="#0B0B0B" />`;
  svg += `<defs>
    <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#222;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#111;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#050505;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0" />
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <style>
      @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      @keyframes flicker { 0% { opacity: 1; } 5% { opacity: 0.4; } 10% { opacity: 1; } 15% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 1; } }
      @keyframes scan { 0% { transform: translateY(-20px); } 100% { transform: translateY(20px); } }
      .eye-glow { animation: pulse 3s infinite ease-in-out; }
      .glitch { animation: flicker 5s infinite; }
      .scanline { animation: scan 2s infinite linear; }
    </style>
  </defs>`;

  // Head Base
  let headPath = "";
  if (headType === 0) { // Square/Industrial
    headPath = "M 60,40 L 140,40 L 150,140 L 50,140 Z";
  } else if (headType === 1) { // Angled/Tactical
    headPath = "M 70,30 L 130,30 L 160,100 L 140,160 L 60,160 L 40,100 Z";
  } else { // Narrow/Android
    headPath = "M 80,30 L 120,30 L 140,140 L 100,170 L 60,140 Z";
  }
  
  // Head Shadow/Outer Glow
  svg += `<path d="${headPath}" fill="none" stroke="${accentColor}" stroke-width="0.5" opacity="0.3" filter="url(#glow)" />`;
  svg += `<path d="${headPath}" fill="url(#metal)" stroke="#333" stroke-width="2" className="glitch" />`;

  // Mechanical Details (Panels)
  for(let i=0; i<detailLevel; i++) {
    const x1 = 70 + (parseInt(hash.substring(i*2, i*2+1), 16) % 60);
    const y1 = 50 + (parseInt(hash.substring(i*2+1, i*2+2), 16) % 80);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x1+10}" y2="${y1}" stroke="#1a1a1a" stroke-width="1" />`;
  }

  // Eyes / Optics
  svg += `<g class="eye-glow">`;
  if (eyeType === 0) { // Visor
    svg += `<rect x="65" y="70" width="70" height="15" fill="#050505" stroke="${accentColor}" stroke-width="1" filter="url(#glow)" />`;
    svg += `<rect x="65" y="70" width="70" height="2" fill="${accentColor}" class="scanline" opacity="0.5" />`;
  } else if (eyeType === 1) { // Mono
    svg += `<circle cx="100" cy="75" r="15" fill="#050505" stroke="#333" stroke-width="2" />`;
    svg += `<circle cx="100" cy="75" r="5" fill="${accentColor}" filter="url(#glow)" />`;
  } else if (eyeType === 2) { // Dual
    svg += `<circle cx="80" cy="75" r="10" fill="#050505" stroke="#333" stroke-width="2" />`;
    svg += `<circle cx="120" cy="75" r="10" fill="#050505" stroke="#333" stroke-width="2" />`;
    svg += `<circle cx="80" cy="75" r="3" fill="${accentColor}" filter="url(#glow)" />`;
    svg += `<circle cx="120" cy="75" r="3" fill="${accentColor}" filter="url(#glow)" />`;
  } else { // Quad
    [ [80,70], [120,70], [80,90], [120,90] ].forEach(([x,y]) => {
      svg += `<rect x="${x-4}" y="${y-4}" width="8" height="8" fill="${accentColor}" opacity="0.8" filter="url(#glow)" />`;
    });
  }
  svg += `</g>`;

  // Mouth / Grille
  if (mouthType === 0) { // Grille
    for(let i=0; i<4; i++) {
      svg += `<line x1="85" y1="${120 + i*5}" x2="115" y2="${120 + i*5}" stroke="#222" stroke-width="2" />`;
    }
  } else if (mouthType === 1) { // Plate
    svg += `<path d="M 80,120 L 120,120 L 110,140 L 90,140 Z" fill="#050505" stroke="#222" />`;
  }

  // Symmetries / Side sensors
  svg += `<rect x="45" y="80" width="10" height="30" fill="#111" stroke="#222" />`;
  svg += `<rect x="145" y="80" width="10" height="30" fill="#111" stroke="#222" />`;
  
  svg += `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function resolveAvatar(profile: any, userId: string): string {
  if (profile?.avatarType === 'custom' && profile?.avatarUrl) {
    return profile.avatarUrl;
  }
  const seed = profile?.avatarSeed || userId || 'default';
  return generateDeterministicAvatar(seed);
}
