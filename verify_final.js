const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1800 });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.screenshot({ path: 'verification_final.png', fullPage: true });
  await browser.close();
})();
