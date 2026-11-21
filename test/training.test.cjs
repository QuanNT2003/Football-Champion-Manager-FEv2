const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Compile the pure helper with the project's installed compiler; no browser or API mocks.
const source = fs.readFileSync(require.resolve('../src/utils/training.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } });
const compiledModule = { exports: {} };
new Function('exports', 'module', compiled.outputText)(compiledModule.exports, compiledModule);
const { summarizeTrainingGains } = compiledModule.exports;

test('summary combines repeated attribute gains across all six drills, without changing the source', () => {
  const drills = [
    { slot: 1, gains: [{ attribute: 'fin', from: 50, to: 51 }, { attribute: 'otb', from: 60, to: 61 }] },
    { slot: 2, gains: [] },
    { slot: 3, gains: [{ attribute: 'fin', from: 51, to: 52 }] },
    { slot: 4, gains: [{ attribute: 'gk_ref', from: 99, to: 100 }] },
    { slot: 5, gains: [{ attribute: 'fin', from: 52, to: 53 }] },
    { slot: 6, gains: [{ attribute: 'otb', from: 61, to: 62 }] },
  ];
  const original = structuredClone(drills);
  assert.deepEqual(summarizeTrainingGains(drills), [
    { attribute: 'fin', amount: 3 }, { attribute: 'otb', amount: 2 }, { attribute: 'gk_ref', amount: 1 },
  ]);
  assert.deepEqual(drills, original);
});

test('unsuccessful or capped attributes produce no positive gain badge', () => {
  assert.deepEqual(summarizeTrainingGains(Array.from({ length: 6 }, () => ({ gains: [] }))), []);
  assert.deepEqual(summarizeTrainingGains([{ gains: [{ attribute: 'fin', from: 100, to: 100 }] }]), []);
});

test('training exposes only first team and one combined youth squad', () => {
  const { trainingSquad } = compiledModule.exports;
  assert.equal(trainingSquad('FIRST_TEAM'), 'FIRST_TEAM');
  assert.equal(trainingSquad('YOUTH_U19'), 'YOUTH');
  assert.equal(trainingSquad('YOUTH_U21'), 'YOUTH');
  assert.equal(trainingSquad('RESERVES'), null);
  assert.equal(trainingSquad('UNKNOWN'), null);
});

test('every backend drill has a real illustration and both Vietnamese and English copy', () => {
  const path = require('node:path');
  const translationsSource = fs.readFileSync(require.resolve('../src/i18n/training.ts'), 'utf8');
  const js = ts.transpileModule(translationsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } });
  const translations = { exports: {} };
  new Function('exports', 'module', js.outputText)(translations.exports, translations);
  const { trainingVi, trainingEn } = translations.exports;
  const rules = fs.readFileSync(path.resolve(__dirname, '../../footballChampion_BE/src/modules/training/training.rules.ts'), 'utf8');
  const catalog = rules.split('export const drillAttributes = {')[1].split('} as const;')[0];
  const codes = [...catalog.matchAll(/^\s+([A-Z][A-Z0-9_]+):/gm)].map(match => match[1]);
  assert.equal(codes.length, 20);
  for (const code of codes) {
    const imagePath = path.resolve(__dirname, '../public/assets/images/training_types', `${code}.jpg`);
    assert.ok(fs.statSync(imagePath).size > 0, `Illustration for ${code}`);
    for (const field of ['name', 'description']) {
      const key = `training.drill.${code}.${field}`;
      assert.ok(trainingVi[key]?.trim(), `Vietnamese ${key}`);
      assert.ok(trainingEn[key]?.trim(), `English ${key}`);
      assert.notEqual(trainingEn[key], trainingVi[key], `Translated ${key}`);
    }
  }
  assert.deepEqual(Object.keys(trainingEn).sort(), Object.keys(trainingVi).sort());
});

test('library groups retain goalkeeper, tactical and physical drills as well as attacking drills', () => {
  const { trainingDrillGroup } = compiledModule.exports;
  assert.equal(trainingDrillGroup('ATTACKING'), 'ATTACK');
  assert.equal(trainingDrillGroup('TECHNICAL'), 'ATTACK');
  assert.equal(trainingDrillGroup('DEFENDING'), 'DEFENSE');
  assert.equal(trainingDrillGroup('GOALKEEPING'), 'DEFENSE');
  for (const category of ['PHYSICAL', 'MENTAL', 'TACTICAL']) assert.equal(trainingDrillGroup(category), 'PHYSICAL_MENTAL');
});
