#!/usr/bin/env node
/**
 * Diagnostic script to scan for heavy GPU-intensive CSS properties
 * Identifies banned properties that should be avoided for performance
 * Landing page exceptions are allowed and logged separately
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BANNED_PROPERTIES = [
  'backdrop-filter',
  'filter: blur\\((?:[5-9]\\d|[1-9]\\d{2,})px\\)', // blur >= 50px
  'box-shadow:.*\\d{2,}px', // large box-shadows
  'mix-blend-mode',
];

const ALLOWED_IN_LANDING = ['apps/web/app/page.tsx', 'apps/web/app/globals.css'];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const isLanding = ALLOWED_IN_LANDING.some(allowed => filePath.includes(allowed));

  BANNED_PROPERTIES.forEach(prop => {
    const regex = new RegExp(prop, 'gi');
    let match;
    let lineNum = 1;
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        issues.push({
          file: filePath,
          line: idx + 1,
          content: line.trim(),
          property: prop,
          isLanding,
        });
      }
    });
  });

  return issues;
}

function main() {
  console.log('🔍 Scanning for heavy GPU-intensive CSS properties...\n');

  const patterns = [
    'apps/web/app/**/*.{css,tsx,ts,jsx,js}',
    'apps/web/src/**/*.{css,tsx,ts,jsx,js}',
    'apps/web/components/**/*.{css,tsx,ts,jsx,js}',
  ];

  let allIssues = [];
  let landingExceptions = [];

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { nodir: true });
    files.forEach(file => {
      const issues = scanFile(file);
      allIssues.push(...issues);
    });
  });

  // Separate dashboard issues from landing exceptions
  const dashboardIssues = allIssues.filter(i => !i.isLanding);
  landingExceptions = allIssues.filter(i => i.isLanding);

  if (dashboardIssues.length > 0) {
    console.log('❌ FAILED: Found banned CSS properties in dashboard code:\n');
    dashboardIssues.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    Property: ${issue.property}`);
      console.log(`    Code: ${issue.content}`);
      console.log('');
    });
    process.exit(1);
  }

  console.log('✅ PASSED: No banned CSS properties in dashboard code\n');

  if (landingExceptions.length > 0) {
    console.log('ℹ️  Landing page exceptions (allowed):\n');
    landingExceptions.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    Property: ${issue.property}`);
      console.log(`    Code: ${issue.content}`);
      console.log('');
    });
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Dashboard violations: ${dashboardIssues.length}`);
  console.log(`   Landing exceptions: ${landingExceptions.length}`);
  console.log(`   Total scanned: ${allIssues.length} potential issues\n`);

  process.exit(0);
}

main();
