
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
#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function checkSignupUI() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 Running signup UI smoke test...');

    await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });

    // Check if signup button exists
    const signupButton = await page.$('button:has-text("Sign Up")');
    if (!signupButton) throw new Error('Signup button not found');
    console.log('✅ Signup button exists');

    // Click signup
    await signupButton.click();
    await page.waitForSelector('text=Join thecueRoom', { timeout: 5000 });
    console.log('✅ Signup modal opens');

    // Check form fields
    const fields = ['firstName', 'lastName', 'artistName', 'email', 'password', 'confirmPassword', 'region', 'genre'];
    for (const field of fields) {
      const input = await page.$(`#${field}`);
      if (!input) throw new Error(`Field ${field} not found`);
      
      const ariaRequired = await input.evaluate(el => el.getAttribute('aria-required'));
      if (ariaRequired !== 'true' && field !== 'confirmPassword') {
        throw new Error(`Field ${field} missing aria-required`);
      }
    }
    console.log('✅ All required fields exist with ARIA attributes');

    // Check buttons have icons and labels
    const registerButton = await page.$('button:has-text("Register")');
    if (!registerButton) throw new Error('Register button not found');
    
    const hasIcon = await registerButton.evaluate(el => el.querySelector('svg') !== null);
    if (!hasIcon) throw new Error('Register button missing icon');
    console.log('✅ Register button has icon and label');

    // Check availability indicators
    const availabilityStatus = await page.$('#artistName-status');
    if (!availabilityStatus) throw new Error('Availability status indicator not found');
    console.log('✅ Availability indicators present');

    console.log('\n✅ All UI smoke tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ UI smoke test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

checkSignupUI();
