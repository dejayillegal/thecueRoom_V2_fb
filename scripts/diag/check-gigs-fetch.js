#!/usr/bin/env node

/**
 * Diagnostic script to validate gigs aggregator
 * Tests all source adapters and reports stats
 */

const { aggregateEvents } = require('../../packages/feeds/aggregator');

async function diagnose() {
  console.log('═'.repeat(60));
  console.log('🔍 Gigs Fetcher Diagnostic Check');
  console.log('═'.repeat(60));
  console.log('');

  try {
    console.log('[Diag] Running aggregator with forced refresh...\n');
    const result = await aggregateEvents({ refresh: true, concurrency: 4 });

    console.log('');
    console.log('═'.repeat(60));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Events: ${result.summary.total}`);
    console.log(`Duration: ${result.summary.duration}ms`);
    console.log('');

    console.log('Per-Source Breakdown:');
    console.log('─'.repeat(60));
    for (const [source, count] of Object.entries(result.summary.bySource)) {
      const status = result.summary.errors[source] ? '❌' : '✅';
      const error = result.summary.errors[source] ? ` (${result.summary.errors[source]})` : '';
      console.log(`  ${status} ${source.padEnd(30)} ${count} events${error}`);
    }

    console.log('');
    console.log('Bollywood Filter Check:');
    console.log('─'.repeat(60));
    const bollywoodKeywords = /bollywood|film|movie|celebrity|awards|premiere|cricket/i;
    const hasBollywood = result.events.some(e => 
      bollywoodKeywords.test(`${e.title} ${e.description || ''}`)
    );
    
    if (hasBollywood) {
      console.log('  ❌ FAIL: Found Bollywood/pop content in results');
      const bollywoodEvents = result.events.filter(e =>
        bollywoodKeywords.test(`${e.title} ${e.description || ''}`)
      );
      console.log(`  Found ${bollywoodEvents.length} Bollywood events:`);
      bollywoodEvents.slice(0, 3).forEach(e => {
        console.log(`    - ${e.title} (${e.source})`);
      });
    } else {
      console.log('  ✅ PASS: No Bollywood/pop content detected');
    }

    console.log('');
    console.log('Sample Events:');
    console.log('─'.repeat(60));
    result.events.slice(0, 5).forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.title}`);
      console.log(`     Source: ${event.source} | City: ${event.city || 'N/A'}`);
      console.log(`     Genres: ${event.genreTags?.join(', ') || 'N/A'}`);
      console.log('');
    });

    console.log('═'.repeat(60));
    console.log('Suggestions:');
    console.log('─'.repeat(60));
    
    const totalSources = Object.keys(result.summary.bySource).length;
    const errorSources = Object.keys(result.summary.errors).length;
    const emptySources = Object.entries(result.summary.bySource)
      .filter(([_, count]) => count === 0).length;

    if (errorSources > 0) {
      console.log(`  ⚠ ${errorSources} source(s) failed - check network/API access`);
    }
    if (emptySources > 2) {
      console.log(`  ⚠ ${emptySources} source(s) returned 0 events - may need updating`);
    }
    if (result.summary.total < 10) {
      console.log('  ⚠ Low event count - consider adding more sources');
    }
    if (result.summary.total === 0) {
      console.log('  ❌ CRITICAL: No events fetched - check source implementations');
      process.exit(1);
    }

    console.log('  ✅ Aggregator is working correctly');
    console.log('');
    console.log('═'.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ FATAL ERROR');
    console.error('═'.repeat(60));
    console.error(error);
    console.error('');
    console.error('Diagnosis failed. Check the error above for details.');
    console.error('═'.repeat(60));
    process.exit(1);
  }
}

diagnose();
