import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../lib/power/engine.ts';
import {newProject, specSchema} from '../lib/power/model.ts';
import {reportHtml} from '../lib/power/report.ts';

const sample = () => ({...newProject('LC diagnostic','hwllc').spec, hwCapConnection:'split-bus' as const,hwLrUh:1,hwCr1Nf:25,hwCr2Nf:75,hwLowSideOnUs:1});
test('confirmed split-bus uses capacitor sum and LC half-period, without claiming gain',()=>{
 const r=calculate(sample());
 assert.equal(r.metrics.hwCapSumNf,100);
 assert.ok(Math.abs(r.metrics.hwTankFrKhz!-503.2921210448703)<1e-9);
 assert.ok(Math.abs(r.metrics.hwTankHalfUs!-0.9934588265796101)<1e-9);
 assert.ok(Math.abs(r.metrics.hwCapRatio!-1/3)<1e-12);
 assert.ok(Math.abs(r.metrics.hwOnHalfRatio!-1.0065842420897408)<1e-9);
 assert.equal(r.metrics.frKhz,null);assert.equal(r.metrics.gainTarget,null);assert.deepEqual(r.curves,[]);
 assert.equal(r.checks.find(c=>c.id==='resonance-range')?.status,'pending');
});
test('unconfirmed, missing, and conventional topology never emit HW LC values',()=>{
 for(const s of [{...sample(),hwCapConnection:'unknown' as const},{...sample(),hwLrUh:null},{...sample(),hwCr2Nf:null},{...sample(),topology:'llc-center-tapped' as const}]){
  const m=calculate(s).metrics;
  for(const k of ['hwCapSumNf','hwTankFrKhz','hwTankHalfUs','hwCapRatio','hwOnHalfRatio'] as const)assert.equal(m[k],null);
 }
 const m=calculate({...sample(),hwLowSideOnUs:null}).metrics;
 assert.equal(m.hwOnHalfRatio,null);assert.equal(m.hwCapSumNf,100);
});
test('older projects default to unknown wiring; zero pulse time is rejected',()=>{
 const old={...sample()} as Record<string,unknown>;delete old.hwCapConnection;delete old.hwLowSideOnUs;
 const p=specSchema.parse(old);assert.equal(p.hwCapConnection,'unknown');assert.equal(p.hwLowSideOnUs,null);
 assert.equal(specSchema.safeParse({...sample(),hwLowSideOnUs:0}).success,false);
 assert.equal(specSchema.safeParse({...sample(),hwCapConnection:'series'}).success,false);
});
test('report describes LC-only scope and distinguishes missing HW inputs',()=>{
 const p=newProject('Test','hwllc');
 const pending=reportHtml(p,calculate(p.spec));assert.match(pending,/未確認接法或缺少 LC 參數/);
 p.spec=sample();const html=reportHtml(p,calculate(p.spec));assert.match(html,/hwTankHalfUs/);assert.match(html,/0.9935/);
});
