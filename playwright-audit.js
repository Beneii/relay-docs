import { chromium } from 'playwright';

const baseUrl = process.env.RELAY_AUDIT_URL || 'http://127.0.0.1:5173';
const executablePath = process.env.RELAY_CHROMIUM_EXECUTABLE;
const viewport = { width: 1440, height: 1200 };

async function preparePage(page, theme) {
  await page.addInitScript((initialTheme) => {
    localStorage.setItem('theme', initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, theme);

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForSelector('main');

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `,
  });

  await page.evaluate((activeTheme) => {
    localStorage.setItem('theme', activeTheme);
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, theme);

  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });

  await page.waitForTimeout(500);
}

async function captureScreenshot(browser, theme, path) {
  const context = await browser.newContext({
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    viewport,
  });

  const page = await context.newPage();
  await preparePage(page, theme);
  await page.screenshot({ path, fullPage: true });
  await context.close();
}

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  await captureScreenshot(browser, 'light', '/tmp/relay-light-full.png');
  await captureScreenshot(browser, 'dark', '/tmp/relay-dark-full.png');
  console.log('Saved /tmp/relay-light-full.png');
  console.log('Saved /tmp/relay-dark-full.png');
} finally {
  await browser.close();
}
