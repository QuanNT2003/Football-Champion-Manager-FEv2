const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadTs(relative, overrides = {}) {
  const file = path.resolve(__dirname, relative);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const result = { exports: {} };
  const localRequire = name => {
    if (name in overrides) return overrides[name];
    if (name.startsWith('.')) return loadTs(path.resolve(path.dirname(file), name + '.ts'), overrides);
    return require(name);
  };
  new Function('require', 'module', 'exports', js)(localRequire, result, result.exports);
  return result.exports;
}

for (const language of ['vi', 'en']) {
  const dictionary = loadTs('../src/i18n/' + language + '.ts')[language];
  const { LeagueStatsView } = loadTs('../src/components/standings/LeagueStatsView.tsx', {
    '../../i18n': { useTranslation: () => ({ t: (key, fallback) => dictionary[key] || fallback || key }) },
    'react-router-dom': { useOutletContext: () => ({}) },
    '../../services/players.service': { playersApi: {} },
  });
  test(language + ': displays all three leaderboards and the unrated empty state', () => {
    const html = renderToStaticMarkup(React.createElement(LeagueStatsView, {
      topScorers: [], topAssists: [], topPlayers: [],
    }));
    for (const key of ['standings.top_scorers', 'standings.top_assists', 'standings.top_players',
      'stats.best_players_criteria', 'stats.no_ratings']) {
      assert.ok(dictionary[key], key);
      assert.ok(html.includes(dictionary[key]), key);
    }
  });
  test(language + ': shows ten best players with numeric ratings, appearances and MOTM', () => {
    const players = Array.from({ length: 12 }, (_, i) => ({
      player: { id: String(i + 1), name: 'Rated Player ' + (i + 1) },
      club: { name: 'Hà Nội' }, rating: '8.2500', appearances: 5, motm: 2,
    }));
    const html = renderToStaticMarkup(React.createElement(LeagueStatsView, {
      topScorers: [{ player: { id: '20', name: 'Goal Leader' }, goals: 7 }],
      topAssists: [{ player: { id: '21', name: 'Assist Leader' }, assists: 4 }], topPlayers: players,
    }));
    assert.equal((html.match(/Rated Player /g) || []).length, 10);
    assert.ok(html.includes('Rated Player 10'));
    assert.ok(!html.includes('Rated Player 11'));
    assert.ok(html.includes('8.25'));
    assert.ok(html.includes('5 ' + dictionary['stats.appearances_unit']));
    assert.ok(html.includes('2 ' + dictionary['stats.motm_unit']));
    assert.ok(html.includes('Goal Leader') && html.includes('Assist Leader'));
    assert.ok(html.includes(dictionary['standings.view_player_detail']));
  });
}

test('best-player request preserves country, group and limit filters', async () => {
  let requested;
  const { competitionsApi } = loadTs('../src/services/competitions.service.ts', {
    './client': { request: async url => { requested = url; return []; } },
  });
  assert.deepEqual(await competitionsApi.getTopPlayers('1', '84', 10, '7'), []);
  assert.equal(requested, '/competitions/1/top-players?countryId=84&limit=10&groupId=7');
  await competitionsApi.getTopPlayers('8');
  assert.equal(requested, '/competitions/8/top-players');
});
