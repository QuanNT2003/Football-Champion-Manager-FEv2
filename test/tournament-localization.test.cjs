const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTs(file, overrides = {}) {
  const source = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const result = { exports: {} };
  const localRequire = specifier => {
    if (specifier in overrides) return overrides[specifier];
    if (specifier.startsWith('.')) return loadTs(path.resolve(path.dirname(file), `${specifier}.ts`), overrides);
    return require(specifier);
  };
  new Function('require', 'module', 'exports', js)(localRequire, result, result.exports);
  return result.exports;
}

const dictionaries = {
  vi: loadTs(path.resolve(__dirname, '../src/i18n/vi.ts')).vi,
  en: loadTs(path.resolve(__dirname, '../src/i18n/en.ts')).en,
};
let language = 'vi';
const i18n = { useTranslation: () => ({ language, t: key => dictionaries[language][key] || key }) };
const localization = loadTs(path.resolve(__dirname, '../src/utils/tournamentLocalization.ts'), { '../i18n': i18n });
const { localizeCompetitionName: comp } = localization;

const continental = [1, 2, 3].map(level => ({
  id: String(7 + level), name: `Cúp C${level} Châu Lục CLB (Tier ${level} Club Championship)`,
  code: `CONTINENTAL_CLUB_C${level}`, competition_type: `CONTINENTAL_CLUB_C${level}`, confederation_code: 'AFC',
}));
const international = [
  { id: '11', name: 'FIFA World Cup (Vô Địch Thế Giới ĐTQG)', code: 'WORLD_CUP', competition_type: 'WORLD_NATIONAL' },
  { id: '12', name: 'Cúp Vô Địch ĐTQG Châu Lục (Asian Cup / Euro / Copa)', code: 'CONTINENTAL_NATIONAL_CUP', competition_type: 'CONTINENTAL_NATIONAL' },
];

test('legacy continental cup tiers never become domestic league tiers in either language', () => {
  for (const [index, item] of continental.entries()) {
    const level = index + 1;
    assert.equal(comp(item.name, 'vi', item), `Cúp C${level} AFC`);
    assert.equal(comp(item.name, 'en', item), level === 1 ? 'AFC Champions League' : `AFC Cup ${level}`);
    assert.equal(comp(item.name, 'vi'), `Cúp C${level} châu lục`);
    assert.doesNotMatch(comp(item.name, 'en'), /National League/);
  }
});

test('national team competition names use only the selected language', () => {
  assert.equal(comp(international[0].name, 'vi', international[0]), 'Cúp thế giới');
  assert.equal(comp(international[0].name, 'en', international[0]), 'FIFA World Cup');
  assert.equal(comp(international[1].name, 'vi', international[1]), 'Cúp ĐTQG châu lục');
  assert.equal(comp(international[1].name, 'en', international[1]), 'Continental Nations Cup');
  assert.equal(comp('FIFA World Cup', 'vi'), 'Cúp thế giới');
  assert.equal(comp('Cúp thế giới', 'en'), 'FIFA World Cup');
});

test('competition metadata is authoritative even if a display name contains a league alias', () => {
  assert.equal(comp('National League (Tier 2)', 'vi', continental[1]), 'Cúp C2 AFC');
  assert.equal(comp('National League (Tier 3)', 'en', continental[2]), 'AFC Cup 3');
});

test('domestic labels remain domestic and Vietnamese labels have no English glosses', () => {
  assert.equal(comp('Giải VĐQG Hạng 1 (Tier 1)', 'vi'), 'Giải VĐQG');
  assert.equal(comp('Giải Hạng Nhì (Tier 3)', 'en'), 'National League (Tier 3)');
  assert.equal(comp('Cúp Quốc Gia (National Cup)', 'vi'), 'Cúp quốc gia');
  assert.equal(comp('Vietnam League', 'vi'), 'Giải VĐQG Việt Nam');
  assert.equal(comp('UEFA Champions League', 'en'), 'UEFA Champions League');
  assert.equal(comp('AFC Cup 2', 'vi'), 'Cúp C2 AFC');
  assert.equal(comp('AFC Cup 3', 'en'), 'AFC Cup 3');
});

test('staff and competition menu headings are present in both dictionaries', () => {
  assert.equal(dictionaries.vi['nav.dock.staff'], 'Ban huấn luyện');
  assert.equal(dictionaries.en['nav.dock.staff'], 'Club Staff');
  for (const key of ['standings.domestic_comps', 'standings.continental_comps', 'standings.international_comps',
    'federation.league_format', 'federation.knockout_format', 'federation.super_cup_format',
    'federation.group_knockout_format', 'federation.youth_format']) {
    assert.ok(dictionaries.vi[key], `Vietnamese ${key}`);
    assert.ok(dictionaries.en[key], `English ${key}`);
    assert.notEqual(dictionaries.en[key], dictionaries.vi[key], `Translated ${key}`);
  }
});

const menuPath = path.resolve(__dirname, '../src/components/shell/FederationMenu.tsx');
if (fs.existsSync(menuPath)) {
  test('rendered federation menu preserves continental cup identities and national-team translations', () => {
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const { MemoryRouter } = require('react-router-dom');
    const { FederationMenu } = loadTs(menuPath, {
      '../../i18n': i18n, '../../utils/tournamentLocalization': localization,
    });
    const menu = { domestic: { league: { name: 'Vietnam League' } }, continental, international };
    for (const lang of ['vi', 'en']) {
      language = lang;
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, {}, React.createElement(FederationMenu, { menu, onSelect() {} })));
      for (const item of [...continental, ...international]) {
        assert.ok(html.includes(comp(item.name, lang, item)), `Rendered ${lang}: ${item.code}`);
      }
      assert.doesNotMatch(html, /National League|Tier [123]|Asian Cup \/ Euro \/ Copa|Vô Địch Thế Giới/);
      assert.ok(html.includes(dictionaries[lang]['v2.continental']));
      assert.ok(html.includes(dictionaries[lang]['v2.international']));
    }
  });
}
