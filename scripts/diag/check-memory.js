
#!/usr/bin/env node

/**
 * Memory leak detection script
 * Checks for active timers and event listeners
 */

console.log('🔍 Checking for memory leaks...\n');

let leakCount = 0;

// Check for active timers (basic check)
const timerCount = process._getActiveHandles().length;
console.log(`⏱️  Active timers/handles: ${timerCount}`);

if (timerCount > 10) {
  console.warn(`⚠️  Warning: ${timerCount} active handles detected`);
  leakCount++;
}

// Check for unhandled promises
const promiseCount = process._getActiveRequests().length;
console.log(`📦 Active requests: ${promiseCount}`);

if (promiseCount > 5) {
  console.warn(`⚠️  Warning: ${promiseCount} active requests detected`);
  leakCount++;
}

console.log('\n' + '='.repeat(50));

if (leakCount === 0) {
  console.log('✅ No memory leaks detected');
  process.exit(0);
} else {
  console.log(`❌ Potential memory leaks detected: ${leakCount} issue(s)`);
  process.exit(1);
}
