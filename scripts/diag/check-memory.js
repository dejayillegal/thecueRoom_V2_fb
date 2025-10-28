#!/usr/bin/env node

const activeTimers = new Set();
const activeSockets = new Set();

const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;

global.setInterval = function(...args) {
  const id = originalSetInterval.apply(this, args);
  activeTimers.add(id);
  return id;
};

global.clearInterval = function(id) {
  activeTimers.delete(id);
  return originalClearInterval.call(this, id);
};

console.log('🔍 Memory Leak Detection');
console.log('========================\n');

setTimeout(() => {
  console.log(`Active Timers: ${activeTimers.size}`);
  console.log(`Active Sockets: ${activeSockets.size}`);

  if (activeTimers.size === 0 && activeSockets.size === 0) {
    console.log('\n✅ No memory leaks detected');
    process.exit(0);
  } else {
    console.log('\n⚠️  Potential memory leaks detected');
    process.exit(1);
  }
}, 1000);