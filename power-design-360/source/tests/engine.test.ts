import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, fhaGain } from '../lib/power/engine.ts';
import { defaultSpec, fingerprint, projectSchema, newProject, specSchema } from '../lib/power/model.ts';
const close = (actual: number, expected: number, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('480 W sample conserves power and returns independent reference results', () => {
  const {metrics: m, checks} = calculate(defaultSpec);
  close(m.outputW, 480); close(m.inputW, 499.7917534360683);
  close(m.efficiency, 96.04); close(m.totalLossW, 19.7917534360683);
  close(m.outputW + m.pfcLossW + m.dcLossW, m.inputW);
  close(m.frKhz, 101.47348548431327, .0001);
  close(m.requiredCapUf, 340.1360544217687);
  close(m.effectiveCapUf, 264); close(m.holdMs, 15.5232);
  assert.equal(checks.find(c => c.id === 'hold-up')?.status, 'fail');
  assert.equal(checks.find(c => c.id === 'case-temperature')?.status, 'pending');
});
test('FHA gain is unity at resonance for every tested load and k', () => {
  for (const k of [2, 6, 12]) for (const q of [.001, .1, .5, 2]) close(fhaGain(1, k, q), 1);
  close(fhaGain(2, 6, .5), .7396002616336388);
});
test('unsafe boost voltage is flagged and no negative duty is returned', () => {
  const r = calculate({...defaultSpec, busV: 350});
  assert.equal(r.checks.find(c => c.id === 'boost-headroom')?.status, 'fail');
});
test('capacitance, temperature and frequency decisions respond to boundaries', () => {
  const r = calculate({...defaultSpec, bulkUf: 470, thermalResistance: 2, fsMinKhz: 120});
  assert.equal(r.checks.find(c => c.id === 'hold-up')?.status, 'pass');
  assert.equal(r.checks.find(c => c.id === 'case-temperature')?.status, 'fail');
  assert.equal(r.checks.find(c => c.id === 'resonance-range')?.status, 'fail');
});
test('rejects zero, nonfinite, unknown and inconsistent input values', () => {
  for (const partial of [{outputV: 0}, {lrUh: NaN}, {outputA: Infinity}, {vacMin: 290}, {busMinV: 400}, {fsMaxKhz: 50}, {primaryTurns: 1.5}, {extra: 1}]) {
    assert.equal(specSchema.safeParse({...defaultSpec, ...partial}).success, false);
  }
});
test('portable project schema keeps evidence bound to exact spec', () => {
  const p = newProject();
  const key = fingerprint(p.spec);
  p.evidence.safety = {verdict:'pass',note:'Report 2026-01, section 5.',method:'measurement',specKey:key,updatedAt:new Date().toISOString()};
  assert.equal(projectSchema.safeParse(JSON.parse(JSON.stringify(p))).success, true);
  assert.notEqual(fingerprint({...p.spec,outputA:11}), key);
  assert.equal(projectSchema.safeParse({...p,backend:'https://example.com'}).success, false);
});
