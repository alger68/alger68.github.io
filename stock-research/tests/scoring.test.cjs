const test=require('node:test');const assert=require('node:assert/strict');const S=require('../scoring.js');
test('weights total 100',()=>assert.equal(Object.values(S.WEIGHTS).reduce((a,b)=>a+b,0),100));
test('complete positive fixture receives deterministic score',()=>{const r=S.scoreCompany({asset:'個股',metrics:{quality:0.9,growth:0.8,financial:0.9,valuation:0.6,momentum:0.8,risk:0.9}});assert.equal(r.total,81);assert.equal(r.grade,'A-');assert.equal(r.confidence,1)});
test('missing metrics reduce confidence instead of guessed points',()=>{const r=S.scoreCompany({asset:'個股',metrics:{quality:0.9}});assert.equal(r.total,18);assert.ok(r.confidence<0.3);assert.ok(r.missing.length>=5)});
test('ETF is unsupported for company scoring',()=>assert.equal(S.scoreCompany({asset:'ETF',metrics:{}}).unsupported,true));
