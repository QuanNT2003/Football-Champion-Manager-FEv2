const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function service(file, response) {
  const calls = [];
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText;
  const requireMock = spec => {
    assert.equal(spec, './client');
    return { request: async (url, options) => { calls.push({ url, options }); return response; } };
  };
  new Function('require', 'module', 'exports', source)(requireMock, mod, mod.exports);
  return { ...mod.exports, calls };
}

test('balance maps the real API fields and decimal strings to the finance screen', async () => {
  const { financesApi } = service('finances.service.ts', { clubId: '10', cash: '73000000.00', gold: 250, status: 'ACTIVE' });
  assert.deepEqual(await financesApi.getBalance('10'), { club_id: '10', cash_balance: 73000000, gold_balance: 250 });
});

test('sponsorship ledger entries retain their actual amount, date and category', async () => {
  const { financesApi } = service('finances.service.ts', [{ id: '2', club_id: '10', type: 'SPONSORSHIP', amount: '12000000.00', description: 'Sponsor income', transaction_date: '2026-11-27T08:00:00.000Z' }]);
  const [row] = await financesApi.getTransactions('10');
  assert.equal(row.transaction_type, 'SPONSORSHIP');
  assert.equal(row.created_at, '2026-11-27T08:00:00.000Z');
  assert.equal(row.amount, 12000000);
  assert.equal(row.description, 'Sponsor income');
  assert.equal(row.balance_after, undefined, 'the API supplies no historic closing balance');
});

test('sponsor actions use authenticated club endpoints and send no client-supplied amount', async () => {
  const response = { contracts: [], offers: [], available_slots: 4 };
  const { sponsorshipsApi, calls } = service('sponsorships.service.ts', response);
  assert.equal(await sponsorshipsApi.get('10'), response);
  assert.equal(await sponsorshipsApi.open('10'), response);
  assert.equal(await sponsorshipsApi.sign('10', '21'), response);
  assert.deepEqual(calls, [
    { url: '/finances/club/10/sponsorships', options: undefined },
    { url: '/finances/club/10/sponsorships/offers', options: { method: 'POST' } },
    { url: '/finances/club/10/sponsorships/21/sign', options: { method: 'POST' } },
  ]);
});
