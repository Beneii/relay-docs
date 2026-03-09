import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // Mobile viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:8081...');
  try {
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for the app to load
    await page.waitForSelector('div', { timeout: 30000 });
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    await page.screenshot({ path: 'expo-web-app.png' });
    console.log('Screenshot saved to expo-web-app.png');
  } catch (error) {
    console.error('Failed to load expo app:', error);
  } finally {
    await browser.close();
  }
})();
