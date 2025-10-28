#!/usr/bin/env node

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse(url) {
  console.log(`🔍 Running Lighthouse on ${url}...`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox']
  });

  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility'],
    port: chrome.port
  };

  try {
    const runnerResult = await lighthouse(url, options);
    const { lhr } = runnerResult;

    console.log('\n📊 Lighthouse Results:');
    console.log(`Performance Score: ${lhr.categories.performance.score * 100}`);
    console.log(`Accessibility Score: ${lhr.categories.accessibility.score * 100}`);

    await chrome.kill();

    return lhr.categories.performance.score >= 0.7 ? 0 : 1;
  } catch (error) {
    console.error('❌ Lighthouse failed:', error.message);
    await chrome.kill();
    return 1;
  }
}

const url = process.argv[2] || 'http://localhost:5000';
runLighthouse(url).then(code => process.exit(code));