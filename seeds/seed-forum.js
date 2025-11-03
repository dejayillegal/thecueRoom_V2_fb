const fs = require('fs');
const path = require('path');

const seedDir = path.join(process.cwd(), 'seeds', 'data');
if (!fs.existsSync(seedDir)) {
  fs.mkdirSync(seedDir, { recursive: true });
}

const users = [
  { id: 'u1', username: 'testdj', displayName: 'Test DJ', role: 'artist', verified: true },
  { id: 'u2', username: 'listener01', displayName: 'Listener 01', role: 'user', verified: true },
  { id: 'u3', username: 'producerx', displayName: 'Producer X', role: 'artist', verified: true }
];

const threads = [
  { 
    id: 't1', 
    title: 'Best DAW for underground techno production?', 
    userId: 'u3', 
    categoryId: 'production',
    body: 'Looking for recommendations on DAWs for techno production',
    tags: ['production', 'techno', 'daw'],
    replyCount: 1,
    likesCount: 24,
    viewCount: 320
  },
  { 
    id: 't2', 
    title: 'Welcome to thecueRoom Forum!', 
    userId: 'u2', 
    categoryId: 'general',
    body: 'Excited to be part of this community',
    tags: ['general', 'welcome'],
    replyCount: 1,
    likesCount: 10,
    viewCount: 36
  }
];

const replies = [
  { id: 'r1', threadId: 't1', userId: 'u1', body: 'I use Ableton with lots of hardware. Practice is key!' },
  { id: 'r2', threadId: 't2', userId: 'u2', body: 'Happy to be here. Great vibes.' }
];

fs.writeFileSync(path.join(seedDir, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(seedDir, 'threads.json'), JSON.stringify(threads, null, 2));
fs.writeFileSync(path.join(seedDir, 'replies.json'), JSON.stringify(replies, null, 2));

console.log('✅ Forum seed data created');
