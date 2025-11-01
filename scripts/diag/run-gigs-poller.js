
#!/usr/bin/env node

const { simulate } = require('../../packages/feeds/poller');

async function main() {
  console.log('🔍 Running Gigs Feed Poller Simulation\n');
  console.log('='.repeat(60));
  
  try {
    const result = await simulate();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Simulation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Simulation failed:', error);
    process.exit(1);
  }
}

main();
