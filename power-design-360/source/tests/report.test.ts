import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject,fingerprint} from '../lib/power/model.ts';
import {calculate} from '../lib/power/engine.ts';
import {reportHtml} from '../lib/power/report.ts';
test('report escapes user text and marks superseded evidence as stale',()=>{
 const p=newProject('<script>alert(1)</script>');p.description='<img src=x onerror=alert(2)>';
 p.evidence.mission={verdict:'pass',note:'<svg onload=alert(3)>',method:'review',specKey:fingerprint(p.spec),updatedAt:new Date().toISOString()};p.spec.bulkUf=470;
 const html=reportHtml(p,calculate(p.spec));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img '));assert.ok(!html.includes('<svg '));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('stale'));
});
