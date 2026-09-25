// Automatic checks for PROTOCOL SAKHA. Run:  npm run test   (needs: npx playwright install chromium)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.join(__dirname, '..', 'www', 'index.html');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS', m); } else { fail++; console.log('  FAIL', m); } };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  pg.on('dialog', d => d.accept());
  await pg.goto(URL); await pg.waitForTimeout(2500);
  const menu = t => pg.evaluate(t => { [...document.querySelectorAll('.menu-item')].find(a => a.textContent.includes(t)).click(); }, t).then(() => pg.waitForTimeout(350));

  console.log('1. Start-up and all screens');
  ok(!errs.length, 'no JavaScript error on start');
  const n = await pg.evaluate(() => document.querySelectorAll('.menu-item').length);
  for (let i = 0; i < n; i++) {
    const lab = await pg.evaluate(i => document.querySelectorAll('.menu-item')[i].innerText, i);
    if (/લોગ આઉટ/.test(lab)) continue;
    await pg.evaluate(i => document.querySelectorAll('.menu-item')[i].click(), i); await pg.waitForTimeout(200);
  }
  ok(!errs.length, 'all ' + n + ' menu screens open without error');
  const size = fs.statSync(path.join(__dirname, '..', 'www', 'app.html')).size;
  ok(size < 1500000, 'app.html size is small (' + Math.round(size / 1024) + ' KB)');

  console.log('2. Employee add / edit / remove / restore');
  await menu('કર્મચારી ઉમેરો');
  await pg.click('#empName'); await pg.keyboard.type('shri Raajesh bhai patel', { delay: 8 });
  ok((await pg.inputValue('#empName')) === 'શ્રી રાજેશ ભાઈ પટેલ', 'Gujarati typing works');
  await pg.fill('#empBno', '9001'); await pg.fill('#empMob', '9000000001');
  await pg.click('text=કર્મચારી સેવ કરો'); await pg.waitForTimeout(300);
  const c0 = await pg.evaluate(() => employeesList.length);
  await pg.evaluate(i => pdrEditEmp(i), c0 - 1); await pg.waitForTimeout(200);
  await pg.click('#pdrEmpRm'); await pg.waitForTimeout(200); await pg.click('#pdrRmOk'); await pg.waitForTimeout(400);
  ok((await pg.evaluate(() => employeesList.length)) === c0 - 1, 'employee removed');
  await menu('કમી કરેલ કર્મચારી'); await pg.click('#viewContent .pdr-mini'); await pg.waitForTimeout(300);
  ok((await pg.evaluate(() => employeesList.length)) === c0, 'employee restored');

  console.log('3. Station board: allocate, rotate, replace');
  await pg.evaluate(() => switchView('requirement')); await pg.waitForTimeout(500);
  const add = async (si, v) => { await pg.selectOption('#pdrbSt', String(si)); for (const [k, x] of Object.entries(v)) await pg.fill('#pdrbN' + k, String(x)); await pg.click('#pdrbOk'); await pg.waitForTimeout(250); };
  await add(0, { PSI: 1, ASI: 1, HC: 2, PC: 3 }); await add(1, { PSI: 1, ASI: 0, HC: 1, PC: 2 });
  const names = await pg.evaluate(() => [...document.querySelectorAll('.pdrb-nm')].map(x => x.innerText.split('\n')[0].replace(/^\d+\.\s*/, '')));
  ok(names.length === 11 && new Set(names).size === 11, '11 different people allocated, none repeated');
  await pg.evaluate(() => document.querySelectorAll('.pdrb-nm')[5].click()); await pg.waitForTimeout(300);
  await pg.click('#pdrbSwOk'); await pg.waitForTimeout(300);
  ok((await pg.evaluate(() => !!document.querySelector('.pdrb-chg-l'))), 'name replaced and change note shown');
  ok((await pg.evaluate(() => JSON.parse(localStorage.getItem('pdr_v4_unavailable') || '[]').length)) >= 1, 'replaced person marked on leave');
  const day1 = await pg.evaluate(() => getCurrentDutyDate());
  const repl = await pg.evaluate(d => { const b = JSON.parse(localStorage.getItem('pdr_board_v1_' + d) || '{}'); return ((b.cards || []).flatMap(c => c.chg || [])[0] || {}).o || ''; }, day1);
  const day2 = await pg.evaluate(d => { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().slice(0, 10); }, day1);
  await pg.evaluate(d => { const t = document.getElementById('topDate'); t.value = d; t.dispatchEvent(new Event('change')); }, day2); await pg.waitForTimeout(300);
  await add(0, { PSI: 1, ASI: 1, HC: 2, PC: 3 });
  const n2 = await pg.evaluate(() => [...document.querySelectorAll('.pdrb-nm')].map(x => x.innerText.split('\n')[0].replace(/^\d+\.\s*/, '')));
  ok(n2.filter(x => names.includes(x) && x !== repl).length === 0, 'next day rotation gives different people (the replaced person may come first, he did not do duty)');
  await pg.evaluate(d => { const t = document.getElementById('topDate'); t.value = d; t.dispatchEvent(new Event('change')); }, day1); await pg.waitForTimeout(300);

  console.log('4. Photo and official order PDF');
  const [ph] = await Promise.all([pg.waitForEvent('download', { timeout: 30000 }), pg.click('#pdrbPhoto')]);
  ok(/\.png$/.test(ph.suggestedFilename()), 'board photo (PNG) created');
  const [pd] = await Promise.all([pg.waitForEvent('download', { timeout: 30000 }), pg.click('#pdrbHk')]);
  const pth = await pd.path(); const head = fs.readFileSync(pth).slice(0, 5).toString();
  ok(head === '%PDF-', 'official order PDF created');

  console.log('5. Calendar (any year) and office settings');
  await menu('રજા કેલેન્ડર'); await pg.selectOption('#pdrCy', '2028'); await pg.waitForTimeout(200); await pg.selectOption('#pdrCm', '2'); await pg.waitForTimeout(200);
  await pg.fill('#pdrHd', '2028-03-10'); await pg.fill('#pdrHn', 'Test holiday'); await pg.click('#pdrHadd'); await pg.waitForTimeout(300);
  ok((await pg.evaluate(() => document.querySelectorAll('.pdr-hrow').length)) >= 1, 'holiday added in 2028');
  await menu('ઓફિસ / હેડર સેટિંગ્સ'); await pg.fill('#pdrOfP', '079-11111111'); await pg.click('#pdrOfSave'); await pg.waitForTimeout(300);
  ok((await pg.innerText('#pdrHdrStrip')).includes('079-11111111'), 'header phone number editable');

  console.log('6. Health check and help');
  await menu('સ્વ-તપાસ'); ok((await pg.evaluate(() => document.querySelectorAll('.pdr-hrow').length)) >= 8, 'health check screen');
  await menu('એપ વિશે'); ok((await pg.evaluate(() => document.querySelectorAll('.pdr-det').length)) >= 8, 'help screen');

  console.log('7. Back button');
  await pg.evaluate(() => switchView('emp-list')); await pg.evaluate(() => switchView('ps-list')); await pg.waitForTimeout(200);
  await pg.click('#pdrBackBar button:first-child'); await pg.waitForTimeout(250);
  ok((await pg.innerText('#viewTitle')).includes('કર્મચારી'), 'back returns to previous screen');


  console.log('8. Demo mode keeps real data safe');
  const realN = await pg.evaluate(() => employeesList.length);
  await pg.evaluate(() => switchView('pdr-demo')); await pg.waitForTimeout(300);
  await Promise.all([pg.waitForNavigation(), pg.evaluate(() => pdrDemoStart())]); await pg.waitForTimeout(2500);
  ok((await pg.evaluate(() => employeesList.length)) === 30 && (await pg.evaluate(() => !!document.getElementById('pdrDemoBar'))), 'demo data with demo bar');
  await Promise.all([pg.waitForNavigation(), pg.evaluate(() => pdrDemoStop())]); await pg.waitForTimeout(2500);
  ok((await pg.evaluate(() => employeesList.length)) === realN, 'real data fully restored after demo');

  ok(!errs.length, 'no JavaScript error during whole test' + (errs.length ? ' -> ' + errs[0] : ''));
  await b.close();
  console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
