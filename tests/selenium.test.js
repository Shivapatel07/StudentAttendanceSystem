// Optional browser smoke test. Start the app first, then run: node tests/selenium.test.js
// Requires Chrome and a working Selenium/ChromeDriver setup.
const { Builder, By, until } = require('selenium-webdriver');

(async () => {
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get(process.env.BASE_URL || 'http://localhost:3000');
    await driver.wait(until.titleContains('Student Attendance'), 10000);
    const heading = await driver.findElement(By.css('h2')).getText();
    if (!heading.toLowerCase().includes('attendance')) throw new Error('Dashboard heading not found');
    console.log('PASS: dashboard opens and heading is visible.');
  } catch (error) {
    console.error('FAIL:', error.message);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();
