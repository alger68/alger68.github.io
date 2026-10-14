const test=require('node:test');const assert=require('node:assert/strict');
const D=require('../js/dashboard-model.js');

test('stale quote creates yesterday-close warning model',()=>{
 const m=D.build({identity:{exchange:'TWSE',ticker:'2395'},price:{price:718,quote_date:'2026-10-13',checked_at:'2026-10-14T17:29:00+08:00',freshness:'stale',lag_trading_days:1,label:'昨日收盤',warning:'今日行情尚未由主要來源發布'},source_confidence:.75,warnings:[]},{available:false,warnings:['insufficient_history']});
 assert.equal(m.quote.badge,'昨日收盤');
 assert.equal(m.quote.tone,'warning');
 assert.match(m.quote.message,/落後 1 個交易日/);
 assert.equal(m.technicals.available,false);
});

test('missing fields render as null rather than zero',()=>{
 const m=D.build({identity:{exchange:'TWSE',ticker:'2395'},price:null,source_confidence:0,warnings:[]},null);
 assert.equal(m.quote.price,null);
 assert.equal(m.quick.eps,null);
});
