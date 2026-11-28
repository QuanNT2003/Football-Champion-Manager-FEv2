const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
const overrides = {};
function load(file) {
  if (file.endsWith('.css')) return {};
  if (!fs.existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(ext => file + ext).find(fs.existsSync);
  if (!file) throw new Error('Missing module');
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText.replaceAll('import.meta.env', '({})');
  const localRequire = spec => spec in overrides ? overrides[spec] : spec.startsWith('.') ? load(path.resolve(path.dirname(file), spec)) : require(spec);
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  cache.set(file, mod.exports); return mod.exports;
}
const dictionaries = { vi: load(root + '/i18n/vi.ts').vi, en: load(root + '/i18n/en.ts').en };
let language = 'vi';
const i18n = { useTranslation: () => ({ language, t: (key, params) => {
  let value = dictionaries[language][key] || (typeof params === 'string' ? params : key);
  for (const [name, entry] of Object.entries(typeof params === 'object' ? params : {})) value = value.replaceAll(`{${name}}`, String(entry));
  return value;
} }) };
overrides['../i18n'] = overrides['../../i18n'] = i18n;
overrides['../services/players.service'] = { playersApi: {} };
const { PlayerAvailabilityBadges } = load(root + '/components/common/PlayerAvailabilityBadges.tsx');
const { PlayerAvailabilityPanel } = load(root + '/components/player/PlayerAvailabilityPanel.tsx');
const { SquadView } = load(root + '/components/SquadView.tsx');
const { hasPlayerRestrictions } = load(root + '/utils/playerAvailability.ts');
const player = {
  id: '1', name: 'Nguyễn An', first_name: 'Nguyễn', last_name: 'An', age: 24, position: { code: 'CB' },
  status: { is_injured: true, is_suspended: true, injury_days_remaining: 7,
    active_injuries: [{ id: '1', name: 'Căng cơ', days_remaining: 7 }],
    suspensions: [
      { id: '2', applies_to_next_match: true, reason: 'RED_CARD', competition_season_id: '10', competition_name: 'Giải A', matches_banned: 2, matches_served: 0, matches_remaining: 2 },
      { id: '3', applies_to_next_match: true, reason: 'FIVE_YELLOW_CARDS', competition_season_id: '20', competition_name: 'Cúp B', matches_banned: 1, matches_served: 0, matches_remaining: 1 },
    ],
  },
};
const render = (p = player, compact = false) => renderToStaticMarkup(React.createElement(PlayerAvailabilityBadges, { player: p, compact }));


const panel = (p = player, detail = null, loading = false) => renderToStaticMarkup(React.createElement(PlayerAvailabilityPanel, { player: p, detail, loading }));

const yellowWarning = (count = 2, applies = true, competition = 'Giải A') => ({
  ...player, status: { is_injured: false, is_suspended: false, suspensions: [],
    yellow_cards: [{ season_id: '7', competition_season_id: '10', competition_name: competition,
      count, total: count, threshold: 3, applies_to_next_match: applies }] },
});

test('one or two accumulated yellows show on squad and pitch without implying suspension', () => {
  language = 'vi';
  for (const count of [1, 2]) {
    const p = yellowWarning(count);
    assert.match(render(p), /availability-card yellow/);
    assert.match(render(p, true), /availability-card yellow/);
    assert.ok(!render(p).includes('availability-card red'));
    assert.equal(hasPlayerRestrictions(p), false);
    const html = panel(p);
    assert.ok(html.includes('Thẻ vàng: ' + count + '/3'));
    assert.ok(html.includes('Giải A'));
    assert.ok(!html.includes('Treo giò'));
    const squad = renderToStaticMarkup(React.createElement(SquadView, { players: [p], onSelectPlayer: () => {}, onUpdateTransferListing: () => {} }));
    assert.match(squad, /availability-card yellow/);
  }
});

test('yellow totals from another competition remain in profile but are hidden before the next fixture', () => {
  language = 'vi';
  const p = yellowWarning(2, false, 'Cúp B');
  assert.equal(render(p), '');
  assert.equal(render(p, true), '');
  assert.ok(panel(p).includes('Thẻ vàng: 2/3'));
  assert.ok(panel(p).includes('Cúp B'));
});

test('after each three yellows only the active ban is shown until a new cycle starts', () => {
  language = 'vi';
  const p = yellowWarning(0);
  p.status.yellow_cards[0].total = 3;
  assert.equal(render(p), '');
  assert.equal(panel(p), '');
  p.status.suspensions = [{ ...player.status.suspensions[1], reason: 'YELLOW_ACCUMULATION', applies_to_next_match: true }];
  p.status.is_suspended = true;
  assert.match(render(p), /availability-card yellow/);
  assert.ok(panel(p).includes('Treo giò: còn 1 trận'));
  p.status.yellow_cards[0].count = 1;
  p.status.yellow_cards[0].total = 4;
  assert.equal((render(p).match(/availability-card yellow/g) || []).length, 1);
  assert.ok(panel(p).includes('Thẻ vàng: 1/3'));
});

test('yellow warning text is localized and a fresh profile clears stale roster warnings', () => {
  language = 'en';
  const p = yellowWarning();
  assert.ok(panel(p).includes('Yellow cards: 2/3'));
  assert.equal(panel(p, { ...p, status: { is_injured: false, is_suspended: false, yellow_cards: [] } }), '');
  language = 'vi';
});

test('shared league/Super Cup yellow warning uses one concise scope label', () => {
  language = 'vi';
  const p = yellowWarning(2);
  p.status.yellow_cards[0].scope = 'DOMESTIC_LEAGUE_AND_SUPER_CUP';
  assert.match(render(p, true), /availability-card yellow/);
  assert.ok(panel(p).includes('Thẻ vàng: 2/3'));
  assert.ok(panel(p).includes('VĐQG / Siêu cúp'));
  assert.ok(!panel(p).includes('Giải A'));
});

test('served red and accumulated-yellow bans disappear even if an old global flag remains set', () => {
  language = 'vi';
  const p = yellowWarning(0);
  p.status.yellow_cards[0].total = 3;
  p.status.is_suspended = true;
  p.status.suspensions = player.status.suspensions.map(ban => ({ ...ban, matches_remaining: 0, matches_served: ban.matches_banned }));
  assert.equal(render(p), '');
  assert.equal(render(p, true), '');
  assert.equal(panel(p), '');
  assert.equal(hasPlayerRestrictions(p), false);
  p.status.yellow_cards[0].count = 1;
  p.status.yellow_cards[0].total = 4;
  assert.match(render(p), /availability-card yellow/);
  assert.ok(!render(p).includes('availability-card red'));
  assert.ok(panel(p).includes('Thẻ vàng: 1/3'));
  assert.ok(!panel(p).includes('Treo giò'));
});


test('roster and pitch show distinct status icons without visible durations or competition details', () => {
  language = 'vi';
  const html = render();
  assert.match(html, /availability-card red/); assert.match(html, /availability-card yellow/); assert.match(html, /lucide-bandage/);
  for (const hidden of ['còn 7 ngày', 'còn 2 trận', 'Giải A', 'Cúp B', 'Căng cơ']) assert.ok(!html.includes(hidden), hidden);
  assert.match(render(player, true), /player-availability compact/);
});

test('profile keeps one concise line per injury or competition ban', () => {
  language = 'vi';
  const detail = { ...player, active_injury: { id: '1', injury_type: 'Căng cơ', severity: 'MODERATE', days_remaining: 7, expected_return_date: '2026-12-03' } };
  const html = panel(player, detail);
  for (const value of ['Treo giò: còn 2 trận', 'Treo giò: còn 1 trận', 'Giải A', 'Cúp B', 'Căng cơ', 'Còn 7 ngày']) assert.ok(html.includes(value), value);
  assert.ok(!html.includes('Treo giò: còn 3 trận'));
  for (const extra of ['đã chấp hành', 'Mức độ', '03/12/2026', 'Thẻ đỏ trực tiếp']) assert.ok(!html.includes(extra), extra);
});

test('second-yellow and legacy unknown flags retain truthful profile information', () => {
  language = 'en';
  const second = { ...player, status: { ...player.status, suspensions: [{ ...player.status.suspensions[0], reason: 'SECOND_YELLOW' }] } };
  assert.match(render(second, true), /availability-card second-yellow/);
  const html = panel(second);
  for (const value of ['Suspended: 2 matches left', 'Giải A', '7 days remaining']) assert.ok(html.includes(value), value);
  language = 'vi';
  const unknown = panel({ ...player, status: { is_injured: true, is_suspended: true } });
  assert.ok(unknown.includes('chưa rõ ngày trở lại')); assert.ok(unknown.includes('chưa rõ số trận còn lại'));
});

test('current profile is authoritative; navigating to another player cannot display the previous bans', () => {
  language = 'vi';
  const healthy = { ...player, id: '2', status: { is_injured: false, is_suspended: false, active_injuries: [], suspensions: [] } };
  assert.ok(!panel(healthy, player).includes('Giải A'));
  const recovered = { ...healthy, id: player.id };
  const html = panel(player, recovered);
  assert.equal(html, '');
  assert.equal(render(healthy), ''); assert.equal(hasPlayerRestrictions(healthy), false);
});

test('an inspectable icon opens the profile while stopping the lineup selection click', () => {
  let stopped = 0, opened = 0;
  const element = PlayerAvailabilityBadges({ player, onInspect: () => opened++ });
  assert.equal(element.type, 'button');
  element.props.onClick({ stopPropagation: () => stopped++ });
  assert.equal(opened, 1); assert.equal(stopped, 1);
});

test('Squad places icons with the player name and leaves detailed ban text for the profile', () => {
  language = 'vi';
  const html = renderToStaticMarkup(React.createElement(SquadView, { players: [player], onSelectPlayer: () => {}, onUpdateTransferListing: () => {} }));
  assert.ok(html.includes('Mở hồ sơ xem thẻ và chấn thương')); assert.ok(!html.includes('Treo giò: còn'));
  const raw = render({ ...player, status: null, player_status: player.status }); assert.match(raw, /availability-card red/);
});

test('pitch and squad hide cup-only bans before a league game while the profile still shows the full ban', () => {
  language = 'vi';
  const cupBan = { ...player.status.suspensions[0], applies_to_next_match: false, competition_name: 'Cúp B' };
  const p = { ...player, status: { is_injured: false, is_suspended: true, next_match: { id: '90', competition_season_id: '91' }, suspensions: [cupBan] } };
  assert.equal(render(p), ''); assert.equal(hasPlayerRestrictions(p), false);
  const html = panel(p); assert.ok(html.includes('Cúp B')); assert.ok(html.includes('Treo giò: còn 2 trận'));
  assert.match(render({ ...p, status: { ...p.status, suspensions: [{ ...cupBan, applies_to_next_match: true }] } }), /availability-card red/);
});

test('no upcoming match hides suspension icons without hiding injury icons or modal details', () => {
  language = 'vi';
  const p = { ...player, status: { ...player.status, next_match: null, suspensions: player.status.suspensions.map(b => ({ ...b, applies_to_next_match: false })) } };
  const html = render(p); assert.match(html, /lucide-bandage/); assert.ok(!html.includes('availability-card'));
  assert.ok(panel(p).includes('Treo giò: còn 2 trận'));
});

test('player profile explains shared league/Super Cup red scope even when the next game does not use it', () => {
  language = 'vi';
  const p = { ...player, status: { is_injured: false, is_suspended: true, suspensions: [{ ...player.status.suspensions[0], applies_to_next_match: false, scope: 'DOMESTIC_LEAGUE_AND_SUPER_CUP' }] } };
  assert.equal(render(p), '');
  assert.ok(panel(p).includes('VĐQG / Siêu cúp'));
  assert.ok(!panel(p).includes('Chấp hành tại'));
});
