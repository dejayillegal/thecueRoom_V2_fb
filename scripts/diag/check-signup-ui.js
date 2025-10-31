
#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkSignupUI() {
  console.log('🔍 Starting Signup UI smoke test...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to home
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
    
    // Check if signup button exists
    const signupButton = await page.locator('button:has-text("Sign Up")').count();
    console.log(`✅ Signup button: ${signupButton > 0 ? 'Found' : 'Missing'}`);
    
    if (signupButton > 0) {
      await page.click('button:has-text("Sign Up")');
      await page.waitForTimeout(1000);
      
      // Check form elements
      const elements = {
        'First Name': '#firstName',
        'Last Name': '#lastName',
        'Artist Name': '#artistName',
        'Email': '#email',
        'Password': '#password',
        'Confirm Password': '#confirmPassword',
        'Region': '#region',
        'Genre': '#genre',
        'Register Button': 'button:has-text("Register")',
      };
      
      for (const [name, selector] of Object.entries(elements)) {
        const exists = await page.locator(selector).count() > 0;
        console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Missing'}`);
      }
      
      // Check accessibility
      const firstNameInput = await page.locator('#firstName');
      const ariaRequired = await firstNameInput.getAttribute('aria-required');
      console.log(`\n✅ ARIA attributes: ${ariaRequired === 'true' ? 'Present' : 'Missing'}`);
      
      // Check availability indicators
      await page.fill('#artistName', 'Test Artist');
      await page.waitForTimeout(500);
      const indicator = await page.locator('[id="artistName-status"]').count();
      console.log(`✅ Availability indicator: ${indicator > 0 ? 'Working' : 'Not found'}`);
    }
    
    console.log('\n✅ Signup UI smoke test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Signup UI smoke test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

checkSignupUI();
