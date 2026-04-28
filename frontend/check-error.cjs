const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`[pageerror] ${error.message}`);
  });

  await page.goto('http://localhost:3000/settings/users', { waitUntil: 'networkidle' }).catch(e => console.log('goto error', e));
  
  await browser.close();
})();
