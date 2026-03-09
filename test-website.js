import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  console.log('Navigating to https://relayapp.dev/...');
  await page.goto('https://relayapp.dev/', { waitUntil: 'networkidle' });
  
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  await page.screenshot({ path: 'relay-website.png', fullPage: true });
  console.log('Screenshot saved to relay-website.png');
  
  await browser.close();
})();
