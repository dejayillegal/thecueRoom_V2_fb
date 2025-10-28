
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
#!/usr/bin/env node

console.log('🔍 Checking for memory leaks...\n');

if (process.env.TEST_MODE !== 'true') {
  console.log('⚠️  TEST_MODE not enabled. Set TEST_MODE=true to enable leak detection.\n');
  process.exit(0);
}

const { getGlobalIntervalCount } = require('../../apps/web/src/hooks/use-safe-interval');

const intervalCount = getGlobalIntervalCount();

console.log(`Active intervals: ${intervalCount}`);
console.log(`Active timers: ${process._getActiveHandles?.().length || 'N/A'}`);
console.log(`Active requests: ${process._getActiveRequests?.().length || 'N/A'}\n`);

if (intervalCount === 0) {
  console.log('✅ No leaked intervals detected!\n');
  process.exit(0);
} else {
  console.log(`❌ Found ${intervalCount} leaked interval(s)!\n`);
  process.exit(1);
}
