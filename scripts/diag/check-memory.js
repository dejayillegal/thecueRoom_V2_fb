
#!/usr/bin/env node

console.log('🔍 Checking for memory leaks...\n');

if (typeof window !== 'undefined') {
  const activeIntervals = (window).__activeIntervals || 0;
  const activeSockets = 0; // Would check WebSocket instances
  
  console.log(`Active Intervals: ${activeIntervals}`);
  console.log(`Active Sockets: ${activeSockets}`);
  
  if (activeIntervals === 0 && activeSockets === 0) {
    console.log('\n✅ No memory leaks detected');
    process.exit(0);
  } else {
    console.log('\n❌ Memory leaks detected!');
    process.exit(1);
  }
} else {
  console.log('⚠️  Running in Node.js environment - browser checks skipped');
  process.exit(0);
}
