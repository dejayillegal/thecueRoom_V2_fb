
#!/usr/bin/env node

/**
 * Complete workflow health check
 * Verifies all components are working end-to-end
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://0.0.0.0:5000';
const CHECKS = [
  { name: 'Health Check', path: '/api/health' },
  { name: 'Sources API', path: '/api/sources' },
  { name: 'Feeds API', path: '/api/feeds?limit=5' },
  { name: 'Admin Cron Config', path: '/api/admin/cron-config' },
];

function checkEndpoint(name, path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        resolve({
          name,
          path,
          status: res.statusCode,
          success,
          hasData: data.length > 0,
        });
      });
    }).on('error', (error) => {
      resolve({
        name,
        path,
        status: 0,
        success: false,
        error: error.message,
      });
    });
  });
}

async function runHealthCheck() {
  console.log('🏥 thecueRoom Workflow Health Check\n');
  console.log('═'.repeat(70));
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = await Promise.all(
    CHECKS.map(({ name, path }) => checkEndpoint(name, path))
  );

  let passCount = 0;
  let failCount = 0;

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const status = result.error ? `ERROR: ${result.error}` : `HTTP ${result.status}`;
    
    console.log(`${icon} ${result.name.padEnd(25)} ${status}`);
    
    if (result.success) {
      passCount++;
    } else {
      failCount++;
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log(`\n📊 Results: ${passCount}/${CHECKS.length} checks passed`);

  if (failCount === 0) {
    console.log('✅ All workflow components healthy\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failCount} checks failed\n`);
    process.exit(1);
  }
}

runHealthCheck();
