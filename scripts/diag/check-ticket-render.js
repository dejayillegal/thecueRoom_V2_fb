
#!/usr/bin/env node

const { renderTicket } = require('../../packages/ai/worker');
const { v4: uuidv4 } = require('uuid');

async function main() {
  console.log('🎫 Ticket Render Memory Test\n');
  
  const initialMem = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Initial memory: ${initialMem.toFixed(2)} MB`);
  
  for (let i = 0; i < 3; i++) {
    const ticket = {
      ticketId: uuidv4(),
      eventId: `event-${i}`,
      userId: `user-${i}`,
      eventTitle: `Test Event ${i + 1}`,
      venue: 'Test Venue',
      date: new Date().toISOString()
    };
    
    console.log(`\nRendering ticket ${i + 1}/3...`);
    await renderTicket(ticket);
    
    const currentMem = process.memoryUsage().heapUsed / 1024 / 1024;
    const growth = currentMem - initialMem;
    console.log(`Memory after ticket ${i + 1}: ${currentMem.toFixed(2)} MB (growth: ${growth.toFixed(2)} MB)`);
    
    if (growth > 50) {
      console.error(`\n❌ Memory growth exceeded 50MB: ${growth.toFixed(2)} MB`);
      process.exit(1);
    }
  }
  
  const finalMem = process.memoryUsage().heapUsed / 1024 / 1024;
  const totalGrowth = finalMem - initialMem;
  
  console.log(`\n✅ Memory test passed`);
  console.log(`Total growth: ${totalGrowth.toFixed(2)} MB`);
  process.exit(0);
}

main();
