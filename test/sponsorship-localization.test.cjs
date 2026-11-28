const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../src');
const modules = new Map();
let language = 'vi';

function load(file) {
  if (file.endsWith('.css')) return {};
  if (!fs.existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(ext => file + ext).find(fs.existsSync);
  if (!file) throw new Error('Module not found');
  if (modules.has(file)) return modules.get(file);
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const localRequire = spec => spec === '../i18n' ? { useTranslation: () => ({ language, t }) }
    : spec.startsWith('.') ? load(path.resolve(path.dirname(file), spec)) : require(spec);
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  modules.set(file, mod.exports);
  return mod.exports;
}

const dictionaries = { vi: load(root + '/i18n/vi.ts').vi, en: load(root + '/i18n/en.ts').en };
function t(key, params = {}) {
  let value = dictionaries[language][key];
  assert.equal(typeof value, 'string', `Missing ${language} translation: ${key}`);
  for (const [name, entry] of Object.entries(params)) value = value.replaceAll(`{${name}}`, String(entry));
  return value;
}
const localization = load(root + '/utils/sponsorshipLocalization.ts');
const { SponsorList } = load(root + '/components/SponsorList.tsx');

test('both dictionaries contain all sponsorship keys and matching placeholders', () => {
  const keys = lang => Object.keys(dictionaries[lang]).filter(key => key.startsWith('sponsors.')).sort();
  assert.deepEqual(keys('vi'), keys('en'));
  for (const key of keys('vi')) {
    for (const lang of ['vi', 'en']) assert.ok(dictionaries[lang][key].trim());
    const params = value => [...value.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
    assert.deepEqual(params(dictionaries.vi[key]), params(dictionaries.en[key]), key);
  }
});

const seedPath = path.resolve(__dirname, '../../qkaito_football_champion_seed_data.sql');
test('every industry in the real sponsor catalog has a bilingual translation', { skip: !fs.existsSync(seedPath) }, () => {
  const sql = fs.readFileSync(seedPath, 'utf8');
  const block = sql.slice(sql.indexOf('INSERT INTO `sponsors`')).split('ON DUPLICATE KEY UPDATE')[0];
  const rows = [...block.matchAll(/^\(\d+, '[^']+', '([^']+)'/gm)];
  assert.equal(rows.length, 60);
  for (const [, industry] of rows) {
    const en = localization.localizeSponsorIndustry(industry, 'en');
    assert.notEqual(en, industry, industry);
    assert.equal(localization.localizeSponsorIndustry(en, 'vi'), industry);
  }
});

test('industry lookup tolerates case/spacing and preserves custom brands and industries', () => {
  assert.equal(localization.localizeSponsorIndustry('  bất   ĐỘNG sản  ', 'en'), 'Real Estate');
  assert.equal(localization.localizeSponsorIndustry('REAL ESTATE', 'vi'), 'Bất động sản');
  assert.equal(localization.localizeSponsorIndustry('Custom Industry', 'en'), 'Custom Industry');
});

test('season labels use the season number rather than a nonconsecutive database ID', () => {
  assert.equal(localization.localizeSponsorSeason('Season 1', 'vi'), 'Mùa 1');
  assert.equal(localization.localizeSponsorSeason('Mùa giải 2', 'en'), 'Season 2');
  assert.equal(localization.localizeSponsorSeason('Season 18', 'vi', 2), 'Mùa 2');
  assert.equal(localization.localizeSponsorSeason('Custom season', 'en'), 'Custom season');
});

test('real sponsor rows render in the selected language without changing brand names', () => {
  const sponsors = [{ id: '1', name: 'GrandEstate Holdings', industry: 'Bất động sản', amount: 12500000, description: 'Hidden description' }];
  language = 'en';
  const en = renderToStaticMarkup(React.createElement(SponsorList, { sponsors }));
  assert.match(en, /GrandEstate Holdings/);
  assert.match(en, /Real Estate/);
  assert.match(en, /€12\.5M/);
  assert.match(en, /Until season end/);
  assert.doesNotMatch(en, /Bất động sản|Có hiệu lực|Hidden description/);
  language = 'vi';
  const vi = renderToStaticMarkup(React.createElement(SponsorList, { sponsors, onSign: () => {} }));
  assert.match(vi, /GrandEstate Holdings/);
  assert.match(vi, /Bất động sản/);
  assert.match(vi, /€12,5M/);
  assert.match(vi, /Ký hợp đồng/);
  assert.doesNotMatch(vi, /Real Estate|Sign contract|Hidden description/);
});

test('coded and legacy API failures resolve to keys and retranslate when language changes', () => {
  for (const [input, expected] of [
    [{ response: { data: { code: 'SPONSORSHIP_LIMIT_REACHED' } } }, 'sponsors.error.limit_reached'],
    [{ response: { data: { message: 'Hợp đồng này đã được ký hoặc hết hiệu lực' } } }, 'sponsors.error.offer_unavailable'],
    [{ response: { status: 401 } }, 'sponsors.error.auth_required'],
    [{ response: { data: { message: ['Unknown validation error'] } } }, 'sponsors.sign_error'],
    [{ response: { data: { code: 500, message: 'Internal error details' } } }, 'sponsors.sign_error'],
    [null, 'sponsors.sign_error'],
  ]) {
    const key = localization.sponsorshipErrorKey(input, 'sponsors.sign_error');
    assert.equal(key, expected);
    language = 'en'; const en = t(key);
    language = 'vi'; const vi = t(key);
    assert.notEqual(en, vi);
    assert.doesNotMatch(en, /đã|hợp đồng|không|Internal error details/);
  }
});

test('all backend sponsorship error codes have translations', () => {
  for (const code of ['CLUB_NOT_FOUND', 'FORBIDDEN', 'NO_ACTIVE_SEASON', 'CASH_NOT_CONFIGURED', 'NO_SPONSORS', 'OFFER_NOT_FOUND', 'OFFER_UNAVAILABLE', 'LIMIT_REACHED', 'ACCOUNT_NOT_FOUND']) {
    const key = localization.sponsorshipErrorKey({ response: { data: { code: `SPONSORSHIP_${code}` } } }, 'sponsors.sign_error');
    assert.notEqual(key, 'sponsors.sign_error');
    for (const lang of ['en', 'vi']) assert.ok(dictionaries[lang][key]);
  }
});

test('success notifications retain data so the text and amount follow the current language', () => {
  const success = { name: 'NexSport Football', amount: 12500000 };
  language = 'en';
  assert.equal(t('sponsors.signed', { ...success, amount: localization.formatSponsorAmount(success.amount, language) }), 'Signed with NexSport Football and received €12.5M.');
  language = 'vi';
  assert.equal(t('sponsors.signed', { ...success, amount: localization.formatSponsorAmount(success.amount, language) }), 'Đã ký hợp đồng với NexSport Football, nhận €12,5M.');
});

test('sponsorship ledger descriptions translate while brand names and stored data are preserved', () => {
  const stored = 'Tài trợ GrandEstate Holdings - Season 1';
  assert.equal(localization.localizeSponsorshipDescription(stored, 'en'), 'Sponsorship from GrandEstate Holdings - Season 1');
  assert.equal(localization.localizeSponsorshipDescription(stored, 'vi'), 'Tài trợ GrandEstate Holdings - Mùa 1');
  assert.equal(localization.localizeSponsorshipDescription('Sponsorship from Test - Brand - Season 2', 'vi'), 'Tài trợ Test - Brand - Mùa 2');
  assert.equal(localization.localizeSponsorshipDescription(undefined, 'en'), 'Sponsorship');
  assert.equal(localization.localizeSponsorshipDescription('Custom ledger text', 'vi'), 'Custom ledger text');
  assert.equal(stored, 'Tài trợ GrandEstate Holdings - Season 1');
});
