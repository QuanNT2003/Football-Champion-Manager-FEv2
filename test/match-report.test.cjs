const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
const fixture = require('./fixtures/match-report.json');
const cache = new Map();
const overrides = {};
function load(file) {
  if (file.endsWith('.css')) return {};
  if (!fs.existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(ext => file + ext).find(fs.existsSync);
  if (!file) throw new Error('Missing test module');
  if (cache.has(file)) return cache.get(file);
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const localRequire = specifier => specifier in overrides ? overrides[specifier] : specifier.startsWith('.')
    ? load(path.resolve(path.dirname(file), specifier)) : require(specifier);
  new Function('require', 'module', 'exports', code)(localRequire, result, result.exports);
  cache.set(file, result.exports); return result.exports;
}
const root = path.resolve(__dirname, '../src');
const dictionaries = { vi: load(root + '/i18n/vi.ts').vi, en: load(root + '/i18n/en.ts').en };
let language = 'vi';
const t = (key, fallback) => dictionaries[language][key] || (typeof fallback === 'string' ? fallback : key);
overrides['../i18n'] = { useTranslation: () => ({ language, t }) };
overrides['../services/matches.service'] = { matchesApi: {} };
const { MatchCenterView } = load(root + '/components/MatchCenterView.tsx');
const { MatchResultHeader } = load(root + '/components/MatchDetailView.tsx');
const { MatchReportPanel } = load(root + '/components/MatchReportPanel.tsx');
const { MatchPreviewModal } = load(root + '/components/MatchPreviewModal.tsx');
const { MatchPreviewLink } = load(root + '/components/MatchPreviewLink.tsx');
const { MatchTimeline } = load(root + '/components/MatchTimeline.tsx');
const { matchGoals, groupedScorers, matchMinute, lineupCoordinates, orderedMatchEvents } = load(root + '/utils/matchPresentation.ts');
const render = component => renderToStaticMarkup(React.createElement(MemoryRouter, {}, component));
const text = html => html.replace(/<[^>]+>|<!--.*?-->/g, '');

test('ratings show recorded fitness rather than condition and do not relabel legacy condition as fitness', () => {
  language = 'vi';
  const report = structuredClone(fixture);
  for (const lineup of report.lineups) for (const player of lineup.players) { player.fitnessEnd = 67; player.conditionEnd = 11; }
  const html = render(React.createElement(MatchReportPanel, { match: report, tab: 'ratings', onTabChange: () => {} }));
  assert.ok(text(html).includes('67%'));
  assert.ok(!text(html).includes('11%'));
  for (const lineup of report.lineups) for (const player of lineup.players) delete player.fitnessEnd;
  const legacy = render(React.createElement(MatchReportPanel, { match: report, tab: 'ratings', onTabChange: () => {} }));
  assert.ok(!text(legacy).includes('11%'));
});

test('match headers and previews omit rank details even when the API supplies ranking data', () => {
  for (const lang of ['vi', 'en']) for (const positionsUpdated of [false, undefined]) {
    language = lang;
    const match = { ...fixture, ranking: { positionsUpdated,
      home: { clubId: fixture.homeClub.id, pointsBefore: 1400, pointsAfter: 1370.91, change: -29.09, rankBefore: 5505, rankAfter: 5506 },
      away: { clubId: fixture.awayClub.id, pointsBefore: 1000, pointsAfter: 1029.09, change: 29.09, rankBefore: 5506, rankAfter: 5505 },
    } };
    for (const component of [React.createElement(MatchResultHeader, { match }), React.createElement(MatchPreviewModal, { matchId: match.id, initialMatch: match, onClose: () => {} })]) {
      const html = render(component);
      assert.doesNotMatch(html, /match-ranking|29\.09|1370\.91|1029\.09|5505|5506|Điểm rank|Ranking points|Hạng cập nhật|Ranks published/);
      assert.ok(text(html).includes('2 – 1'));
      assert.ok(text(html).includes('Nguyễn Tiến Linh'));
    }
  }
  language = 'vi';
});

test('completed fixtures offer a preview dialog and retain compact scorers without opening the full report', () => {
  language = 'vi';
  const html = render(React.createElement(MatchCenterView, { matches: [fixture] }));
  assert.match(html, /href="\/matches\/42"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /role="dialog"/);
  assert.ok(text(html).includes('2 – 1'));
  assert.ok(text(html).includes('N. Tiến Linh'));
  assert.ok(text(html).includes('12′, 45+2′ (P)'));
  assert.ok(text(html).includes('Marcus Cole'));
  assert.doesNotMatch(html, /role="tablist"|match-detail-panel|match-result-header/);
  assert.ok(!text(html).includes('Hoàng Đức Minh'));
});

test('scheduled matches show VS and do not reveal result summaries from stale data', () => {
  const html = render(React.createElement(MatchCenterView, { matches: [{ ...fixture, status: 'SCHEDULED' }] }));
  assert.ok(text(html).includes('VS'));
  assert.ok(!text(html).includes('Nguyễn Tiến Linh'));
  assert.ok(!text(html).includes('Marcus Cole'));
});

test('header shows score, goals, stoppage-time minutes and both card colors', () => {
  const html = render(React.createElement(MatchResultHeader, { match: fixture }));
  assert.ok(text(html).includes('2 – 1'));
  for (const value of ['Nguyễn Tiến Linh', '45+2′', 'Thẻ vàng', 'Thẻ đỏ', 'Trần Văn Sơn', 'Jack Turner']) assert.ok(text(html).includes(value), value);
  assert.match(html, /match-card-icon yellow/);
  assert.match(html, /match-card-icon red/);
  assert.ok(!text(html).includes('86%'), 'statistics belong in tabs');
});

test('shootout score is explicitly separated from the match score', () => {
  const html = render(React.createElement(MatchResultHeader, { match: { ...fixture, homeScore: 1, awayScore: 1,
    homeRegularScore: 1, awayRegularScore: 1, homePenaltyScore: 4, awayPenaltyScore: 5, resultType: 'PENALTIES' } }));
  assert.ok(text(html).includes('1 – 1'));
  assert.ok(text(html).includes('Luân lưu 4–5'));
});

test('five accessible tabs render the requested section, with lineups separate from tactics and ratings', () => {
  for (const lang of ['vi', 'en']) {
    language = lang;
    for (const tab of ['statistics', 'lineups', 'tactics', 'ratings', 'timeline']) {
      const html = render(React.createElement(MatchReportPanel, { match: fixture, tab }));
      assert.equal((html.match(/role="tab"/g) || []).length, 5);
      assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
      for (const key of ['statistics', 'lineups', 'tactics', 'ratings', 'timeline']) {
        assert.ok(html.includes(`id="match-tab-${key}"`));
        assert.ok(html.includes(`id="match-panel-${key}"`));
        assert.ok(text(html).includes(t(`match_detail.tab_${key}`)));
      }
      if (tab === 'statistics') { assert.ok(text(html).includes('86%')); assert.ok(!text(html).includes('Hoàng Đức Minh')); }
      if (tab === 'lineups') { assert.equal((html.match(/class="match-pitch-player"/g) || []).length, 22); assert.ok(text(html).includes('Nguyễn Tiến Linh') || text(html).includes('N. Tiến Linh')); }
      if (tab === 'tactics') { assert.ok(text(html).includes('Hoàng Đức Minh')); assert.ok(text(html).includes('Trần Quốc Bảo')); assert.match(html, /value="65"/); }
      if (tab === 'timeline') { assert.ok(text(html).includes(t('match_report.event_goal'))); assert.ok(text(html).includes('45+2′')); }
      if (tab === 'ratings') { assert.ok(text(html).includes('8.8')); assert.ok(text(html).includes('81%')); assert.ok(!html.includes('match-lineup-pitch')); }
      assert.doesNotMatch(text(html), /match_detail\.|match_report\./, 'all report labels are translated');
    }
  }
});

test('legacy matches without snapshots remain readable without inventing statistics', () => {
  language = 'vi';
  for (const tab of ['statistics', 'lineups', 'tactics', 'ratings']) {
    const html = render(React.createElement(MatchReportPanel, { match: { ...fixture, statistics: undefined, lineups: undefined }, tab }));
    assert.ok(text(html).includes(t('match_detail.no_data')));
  }
});

test('goal summaries omit shootouts and group multiple goals by player and club', () => {
  const goals = matchGoals({ events: [...fixture.events, { id: '8', eventType: 'PENALTY_SCORED', clubId: '10', minute: 120, player: { id: '109', name: 'Nguyễn Tiến Linh' } }] });
  assert.equal(goals.length, 3);
  assert.equal(groupedScorers(goals, '10').length, 1);
  assert.equal(groupedScorers(goals, '10')[0].goals.length, 2);
  assert.equal(matchMinute({ minute: 90, metadata: { addedTime: 4 } }), '90+4′');
});

test('pitch uses recorded formation coordinates and provides a finite legacy fallback', () => {
  const players = fixture.lineups[0].players.filter(p => p.started);
  const positions = lineupCoordinates(players);
  assert.equal(positions.length, 11);
  assert.ok(positions.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 10 && p.x <= 90 && p.y >= 12 && p.y <= 88));
  const keeper = positions.find(p => p.player.position === 'GK');
  const striker = positions.find(p => p.player.position === 'ST');
  assert.ok(keeper.y > striker.y);
  assert.ok(lineupCoordinates(players.map(p => ({ ...p, coordinates: undefined }))).every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test('preview preserves the result summary and offers a separate full-report action', () => {
  language = 'vi';
  const html = render(React.createElement(MatchPreviewModal, { matchId: fixture.id, initialMatch: fixture, onClose() {} }));
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.ok(text(html).includes(t('match_detail.preview_title')));
  assert.ok(text(html).includes('2 – 1'));
  assert.ok(text(html).includes('Nguyễn Tiến Linh'));
  assert.ok(text(html).includes('Thẻ vàng'));
  assert.ok(text(html).includes('Thẻ đỏ'));
  assert.match(html, /href="\/matches\/42"/);
  assert.ok(text(html).includes(t('match_detail.view_details')));
  assert.ok(text(html).includes(t('match_detail.close_preview')));
  assert.doesNotMatch(html, /role="tablist"|match-lineup-pitch/);
});

test('preview triggers remain accessible links without mounting hidden dialogs before opening', () => {
  const html = render(React.createElement(MatchPreviewLink, { matchId: '42' }, 'Open fixture'));
  assert.match(html, /href="\/matches\/42"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /role="dialog"/);
  const missingId = render(React.createElement(MatchPreviewLink, {}, 'All matches'));
  assert.match(missingId, /href="\/matches"/);
  assert.doesNotMatch(missingId, /aria-haspopup/);
});

test('upcoming previews keep the simulate action and full-report navigation', () => {
  const html = render(React.createElement(MatchPreviewModal, { matchId: '42', initialMatch: { ...fixture, status: 'SCHEDULED', events: [] }, onClose() {} }));
  assert.ok(text(html).includes('VS'));
  assert.ok(text(html).includes(t('matches.simulate_btn')));
  assert.ok(text(html).includes(t('match_detail.view_details')));
});

test('timeline orders phases, stoppage time, substitutions, cards and shootout independently of source order', () => {
  language = 'vi';
  const events = [
    { id: '1', eventType: 'KICK_OFF', minute: 0, metadata: { phase: 'FIRST_HALF', sequence: 1 } },
    { id: '2', eventType: 'PASS_COMPLETED', minute: 44, clubId: '10', player: { id: '106', name: 'Thiên Phúc' }, metadata: { phase: 'FIRST_HALF', sequence: 2 } },
    { id: '3', eventType: 'GOAL', minute: 45, clubId: '10', player: { id: '109', name: 'Nguyễn Tiến Linh' }, relatedPlayer: { id: '108', name: 'Phan Hoàng Phúc' }, metadata: { phase: 'FIRST_HALF', sequence: 3, addedTime: 2, homeScore: 1, awayScore: 0, xG: .25 } },
    { id: '4', eventType: 'HALF_TIME', minute: 45, metadata: { phase: 'FIRST_HALF', sequence: 4, addedTime: 3 } },
    { id: '5', eventType: 'SUBSTITUTION', minute: 65, clubId: '10', player: { id: '112', name: 'Lê Thanh Bình' }, relatedPlayer: { id: '110', name: 'Vũ Anh Khoa' }, metadata: { phase: 'SECOND_HALF', sequence: 5 } },
    { id: '6', eventType: 'GOAL', minute: 76, clubId: '20', player: { id: '209', name: 'Marcus Cole' }, metadata: { phase: 'SECOND_HALF', sequence: 6, homeScore: 1, awayScore: 1 } },
    { id: '7', eventType: 'RED_CARD', minute: 81, clubId: '20', player: { id: '202', name: 'Jack Turner' }, metadata: { phase: 'SECOND_HALF', sequence: 7 } },
    { id: '8', eventType: 'PENALTY_MISSED', minute: 120, clubId: '10', player: { id: '109', name: 'Nguyễn Tiến Linh' }, metadata: { phase: 'SHOOTOUT', sequence: 8, homePenaltyScore: 4, awayPenaltyScore: 4 } },
    { id: '9', eventType: 'PENALTY_SCORED', minute: 120, clubId: '20', player: { id: '209', name: 'Marcus Cole' }, metadata: { phase: 'SHOOTOUT', sequence: 9, homePenaltyScore: 4, awayPenaltyScore: 5 } },
  ];
  const scrambled = [events[8], events[6], events[4], events[2], events[1], events[7], events[3], events[0], events[5]];
  const match = { ...fixture, events: scrambled };
  assert.deepEqual(orderedMatchEvents(scrambled).map(e => e.id), events.map(e => e.id));
  const highlights = text(render(React.createElement(MatchTimeline, { match })));
  assert.ok(!highlights.includes('Thiên Phúc'));
  for (const value of ['45+2′', 'Kiến tạo: Phan Hoàng Phúc', 'Vào sân: Lê Thanh Bình', 'Ra sân: Vũ Anh Khoa', 'Thẻ đỏ', 'Luân lưu 4–5', 'Hiệp một', 'Hiệp hai']) assert.ok(highlights.includes(value), value);
  assert.ok(highlights.indexOf('45+2′') < highlights.indexOf('65′'));
  assert.ok(highlights.indexOf('65′') < highlights.indexOf('81′'));
  assert.ok(highlights.indexOf('81′') < highlights.indexOf('Luân lưu: thành công'));
  const all = text(render(React.createElement(MatchTimeline, { match, mode: 'all' })));
  assert.ok(all.includes('Thiên Phúc'));
  assert.ok(all.includes(t('match_report.event_pass_completed')));
});

test('empty and legacy timelines remain readable and preserve stable chronological order', () => {
  const html = render(React.createElement(MatchTimeline, { match: { ...fixture, events: [] } }));
  assert.ok(text(html).includes(t('match_detail.no_events')));
  const events = [
    { id: 'late', eventType: 'GOAL', minute: 90, metadata: { addedTime: 4 } },
    { id: 'equal1', eventType: 'YELLOW_CARD', minute: 45, metadata: { addedTime: 2 } },
    { id: 'equal2', eventType: 'SUBSTITUTION', minute: 45, metadata: { addedTime: 2 } },
  ];
  assert.deepEqual(orderedMatchEvents(events).map(e => e.id), ['equal1', 'equal2', 'late']);
  assert.deepEqual(events.map(e => e.id), ['late', 'equal1', 'equal2'], 'sorting does not mutate the response');
});
