
#!/usr/bin/env node

const {
  fetchRollingStoneIndia,
  fetchSortMyScene,
  fetchDiceIndia,
  fetchSkillboxIndia,
  fetchPaytmInsider,
  fetchBookMyShow,
  fetchZomatoLive,
  fetchSwiggyEvents,
} = require('../../packages/feeds/sources');

async function checkFeedIntegrity() {
  console.log('🔍 Checking India Gigs Feed Integrity\n');
  console.log('='.repeat(60));
  
  const sources = [
    { name: 'Rolling Stone India', fn: fetchRollingStoneIndia },
    { name: 'SortMyScene', fn: fetchSortMyScene },
    { name: 'DICE India', fn: fetchDiceIndia },
    { name: 'Skillbox India', fn: fetchSkillboxIndia },
    { name: 'Paytm Insider', fn: fetchPaytmInsider },
    { name: 'BookMyShow', fn: fetchBookMyShow },
    { name: 'Zomato Live', fn: fetchZomatoLive },
    { name: 'Swiggy Events', fn: fetchSwiggyEvents },
  ];
  
  let successCount = 0;
  let totalEvents = 0;
  const errors = [];
  
  for (const source of sources) {
    try {
      console.log(`\n📥 Testing ${source.name}...`);
      const events = await source.fn();
      
      if (events.length > 0) {
        console.log(`✅ ${source.name}: ${events.length} events`);
        successCount++;
        totalEvents += events.length;
      } else {
        console.log(`⚠️  ${source.name}: No events found`);
      }
    } catch (error) {
      console.error(`❌ ${source.name}: ${error.message}`);
      errors.push({ source: source.name, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`✅ Successful sources: ${successCount}/${sources.length}`);
  console.log(`📝 Total events: ${totalEvents}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => console.log(`  - ${e.source}: ${e.error}`));
  }
  
  if (successCount >= 6) {
    console.log('\n✅ PASS: At least 6 sources are working');
    process.exit(0);
  } else {
    console.log('\n❌ FAIL: Less than 6 sources are working');
    process.exit(1);
  }
}

checkFeedIntegrity();
