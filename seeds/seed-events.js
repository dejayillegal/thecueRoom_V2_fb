const fs = require('fs');
const path = require('path');

const seedDir = path.join(process.cwd(), 'seeds', 'data');
if (!fs.existsSync(seedDir)) {
  fs.mkdirSync(seedDir, { recursive: true });
}

const events = [
  { 
    id: 'e1', 
    title: 'Underground Warehouse Party - Bangalore', 
    city: 'Bangalore',
    venue: 'Secret Warehouse',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    source: 'manual',
    approved: true,
    genres: ['techno', 'house']
  },
  { 
    id: 'e2', 
    title: 'Modular Night - Mumbai', 
    city: 'Mumbai',
    venue: 'The Loft',
    startTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    source: 'manual',
    approved: true,
    genres: ['experimental', 'modular']
  }
];

fs.writeFileSync(path.join(seedDir, 'events.json'), JSON.stringify(events, null, 2));
console.log('✅ Event seed data created');
