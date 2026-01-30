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
  const hue = parseInt(hash.substring(0, 3), 16) % 360;
  const saturation = 50 + (parseInt(hash.substring(3, 5), 16) % 50);
  const lightness = 40 + (parseInt(hash.substring(5, 7), 16) % 20);
  
  const shapes = parseInt(hash.substring(7, 9), 16) % 4;
  const complexity = 3 + (parseInt(hash.substring(9, 11), 16) % 5);
  
  let svg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="200" height="200" fill="#0B0B0B" />`;
  svg += `<defs><filter id="f1"><feGaussianBlur in="SourceGraphic" stdDeviation="5" /></filter></defs>`;
  
  for (let i = 0; i < complexity; i++) {
    const x = (parseInt(hash.substring(i*2, i*2+2), 16) / 255) * 200;
    const y = (parseInt(hash.substring(i*3, i*3+2), 16) / 255) * 200;
    const size = 20 + (parseInt(hash.substring(i*4, i*4+2), 16) / 255) * 80;
    const opacity = 0.3 + (parseInt(hash.substring(i*5, i*5+2), 16) / 255) * 0.4;
    
    const color = `hsla(${(hue + i * 30) % 360}, ${saturation}%, ${lightness}%, ${opacity})`;
    
    if (shapes === 0) {
      svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" filter="url(#f1)" />`;
    } else if (shapes === 1) {
      svg += `<rect x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size}" fill="${color}" transform="rotate(${i * 45} ${x} ${y})" />`;
    } else {
      svg += `<path d="M ${x},${y-size} L ${x+size},${y+size} L ${x-size},${y+size} Z" fill="${color}" opacity="${opacity}" />`;
    }
  }
  
  svg += `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
