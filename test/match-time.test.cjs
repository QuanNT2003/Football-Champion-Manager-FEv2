const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync(require.resolve('../src/utils/matchTime.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const result = { exports: {} };
new Function('exports', 'module', compiled.outputText)(result.exports, result);
const { formatKickoffTime } = result.exports;

test('server kickoff times are identical for plain TIME and legacy ISO carriers in every browser timezone', () => {
  const originalZone = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Asia/Ho_Chi_Minh', 'America/New_York', 'Asia/Tokyo']) {
      process.env.TZ = zone;
      assert.equal(formatKickoffTime('20:00'), '20:00');
      assert.equal(formatKickoffTime('20:00:00'), '20:00');
      assert.equal(formatKickoffTime('1970-01-01T20:00:00.000Z'), '20:00');
      assert.equal(formatKickoffTime('1970-01-01T03:30:00.000Z'), '03:30');
      assert.equal(formatKickoffTime('1970-01-01T00:00:00.000Z'), '00:00');
    }
  } finally {
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
});

test('missing or invalid times have an explicit fallback', () => {
  for (const value of [undefined, null, '', 'garbage', '24:00', '20:99', '1970-01-01']) {
    assert.equal(formatKickoffTime(value), '--:--');
  }
  assert.equal(formatKickoffTime(null, '—'), '—');
});
