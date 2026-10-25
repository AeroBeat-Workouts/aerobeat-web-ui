// Synthetic static design screenshots only. Run from the owner repo root.
const { chromium } = require('../../aerobeat-web-assembly/node_modules/playwright');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'screenshots/play-calibration-checklist');
const design = pathToFileURL(path.join(__dirname, 'play-calibration-checklist.html')).href;
const cases = [
  ['phone-portrait-knee-flicker', 'knee-flicker', 390, 844],
  ['phone-portrait-holding', 'holding', 390, 844],
  ['phone-portrait-complete', 'complete', 390, 844],
  ['phone-portrait-flow', 'flow', 390, 844],
  ['phone-portrait-boxing-knees-off', 'boxing-knees-off', 390, 844],
  ['desktop-knee-flicker', 'knee-flicker', 1440, 900],
  ['desktop-holding', 'holding', 1440, 900],
  ['desktop-complete', 'complete', 1440, 900],
  ['phone-landscape-knee-flicker', 'knee-flicker', 844, 390],
  ['phone-landscape-flow', 'flow', 844, 390]
];
(async () => {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [name, state, width, height] of cases) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${design}?state=${state}`, { waitUntil: 'load' });
        await page.addStyleTag({ content: '* { animation: none !important; transition: none !important; }' });
        await page.evaluate(() => document.fonts.ready);
        const observed = await page.evaluate(() => ({
          width: innerWidth, height: innerHeight,
          labels: [...document.querySelectorAll('.row > span:nth-child(2)')].map(element => element.textContent),
          values: [...document.querySelectorAll('.row > .value')].map(element => element.textContent),
          panel: (() => { const r = document.querySelector('.panel').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom } })(),
          mode: document.querySelector('#mode').textContent,
          subtitle: document.querySelector('#subtitle').textContent,
          subtitleHidden: document.querySelector('#subtitle').hidden,
          sample: document.querySelector('#sample').textContent
        }));
        assert.deepEqual(errors, [], name);
        assert.equal(observed.width, width, name);
        assert.equal(observed.height, height, name);
        assert.equal(observed.labels.length, state === 'flow' || state === 'boxing-knees-off' ? 10 : 12, name);
        assert.ok(observed.labels.includes('Hold T-pose for 2 seconds'), name);
        assert.equal(observed.labels.includes('Left Knee'), state !== 'flow' && state !== 'boxing-knees-off', name);
        assert.equal(observed.labels.includes('Right Knee'), state !== 'flow' && state !== 'boxing-knees-off', name);
        assert.ok(observed.labels.every(label => !label.startsWith('Visible ')), `${name}: landmark labels must omit Visible`);
        assert.ok(observed.panel.left >= 0 && observed.panel.right <= width && observed.panel.top >= 0 && observed.panel.bottom <= height, name);
        if (state === 'knee-flicker') {
          assert.equal(observed.values[8], 'Missing', name);
          assert.ok(observed.mode.includes('0% CHANCE'), name);
          assert.equal(observed.subtitle, '', `${name}: requested redundant knee instruction must be removed`);
          assert.equal(observed.subtitleHidden, true, `${name}: removed instruction must leave no blank line`);
        }
        if (state === 'complete') assert.equal(observed.values.at(-1), 'Complete', name);
        await page.screenshot({ path: path.join(output, `${name}.png`) });
        console.log(`${name}.png ${width}x${height} ${observed.sample}`);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
