import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

const uniq = Date.now();
const email = `mascot-check-${uniq}@example.com`;
const password = 'TestPass123!';

await page.goto('http://localhost:3000/signup');
await page.waitForLoadState('networkidle');
await page.fill('#email', email);
await page.fill('#password', password);
await page.fill('#confirmPassword', password);
await page.click('button[type="submit"]');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

await page.fill('#fullName', 'Mascot Check Student');
await page.fill('#age', '9');
await page.fill('#parentName', 'Check Parent');
await page.fill('#parentPhone', '03001234567');
await page.selectOption('#gradeBand', 'grade_2');
const schoolInput = await page.$('input[placeholder*="school" i]');
if (schoolInput) await schoolInput.fill('Mascot Check School');
await page.click('button[type="submit"]');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
console.log('After signup URL:', page.url());

// Go to practice, start the quiz
await page.goto('http://localhost:3000/practice');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(400);
await page.click('text=Start Practice');
await page.waitForURL(/\/practice\/.+/, { timeout: 15000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
console.log('Quiz URL:', page.url());

// Framer Motion animates via the Web Animations API (not CSS animations),
// so Playwright's locator.screenshot() auto-wait ("element must be
// stable") never resolves on our continuously-bobbing mascot. Use a plain
// page.screenshot with a manually-computed clip rect instead, which skips
// that actionability wait entirely.
async function shootMascot(path) {
  const box = await page.locator('svg[aria-label*="mascot"]').first().boundingBox();
  if (!box) throw new Error('mascot not found');
  const pad = 10;
  await page.screenshot({
    path,
    clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 },
  });
}

await page.waitForSelector('svg[aria-label*="mascot"]', { timeout: 10000 });
await shootMascot('C:\\Users\\mjuna\\AppData\\Local\\Temp\\claude\\c--Users-mjuna-Desktop-BrightSums\\f77868d6-de6a-4345-870f-f3869a0c18ca\\scratchpad\\mascot-idle.png');
console.log('captured idle');

// We can't know the correct answer client-side (server-authoritative by
// design), so click a different option index each question until both a
// happy (correct) and sad (incorrect) mascot mood have been captured.
let sawHappy = false;
let sawSad = false;
const mascotSvg = page.locator('svg[aria-label*="mascot"]').first();
for (let q = 0; q < 10 && !(sawHappy && sawSad); q++) {
  const optionButtons = page.locator('main button:not([disabled])').filter({ hasNotText: /Next Question|See Reason/i });
  let count = await optionButtons.count();
  for (let i = 0; i < 8 && count === 0; i++) {
    await page.waitForTimeout(400);
    count = await optionButtons.count();
  }
  if (count === 0) {
    console.log(`Q${q}: no clickable option buttons found, stopping`);
    break;
  }
  await optionButtons.first().click();

  // wait for the mood to actually change away from idle (server round-trip)
  let label = await mascotSvg.getAttribute('aria-label');
  for (let i = 0; i < 10 && label?.includes('idle'); i++) {
    await page.waitForTimeout(300);
    label = await mascotSvg.getAttribute('aria-label');
  }
  console.log(`Q${q}: mascot label = ${label}`);

  if (label?.includes('happy') && !sawHappy) {
    await shootMascot('C:\\Users\\mjuna\\AppData\\Local\\Temp\\claude\\c--Users-mjuna-Desktop-BrightSums\\f77868d6-de6a-4345-870f-f3869a0c18ca\\scratchpad\\mascot-happy.png');
    sawHappy = true;
  }
  if (label?.includes('sad') && !sawSad) {
    await shootMascot('C:\\Users\\mjuna\\AppData\\Local\\Temp\\claude\\c--Users-mjuna-Desktop-BrightSums\\f77868d6-de6a-4345-870f-f3869a0c18ca\\scratchpad\\mascot-sad.png');
    sawSad = true;
  }

  // advance to next question, waiting for the button to actually appear
  const nextBtn = page.locator('button:has-text("Next Question")');
  try {
    await nextBtn.first().waitFor({ state: 'visible', timeout: 5000 });
    await nextBtn.first().click();
    await page.waitForTimeout(600);
  } catch {
    console.log(`Q${q}: Next Question button never appeared, stopping`);
    break;
  }
}
console.log('sawHappy:', sawHappy, 'sawSad:', sawSad);

await browser.close();
