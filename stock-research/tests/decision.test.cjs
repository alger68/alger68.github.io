const test=require('node:test');const assert=require('node:assert/strict');const D=require('../decision.js');
test('missing canonical basis yields insufficient data',()=>assert.equal(D.state({asset:'個股',score:{total:null,confidence:0}}),'INSUFFICIENT_DATA'));
test('good company but expensive valuation yields watch',()=>assert.equal(D.state({asset:'個股',score:{total:86,confidence:1,categories:{quality:18,growth:18,financial:18,valuation:8,momentum:9,risk:10}},valuation:{base:{upsidePct:-12}}}),'WATCH'));
test('all gates passing can accumulate',()=>assert.equal(D.state({asset:'個股',score:{total:88,confidence:1,categories:{quality:18,growth:18,financial:18,valuation:17,momentum:8,risk:9}},valuation:{base:{upsidePct:15}}}),'ACCUMULATE'));
test('ETF never receives company decision',()=>assert.equal(D.state({asset:'ETF',score:{total:90,confidence:1}}),'INSUFFICIENT_DATA'));
