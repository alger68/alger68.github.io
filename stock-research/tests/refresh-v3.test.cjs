const test=require('node:test');const assert=require('node:assert/strict');const R=require('../refresh.js');
test('pipeline percentage advances deterministically',()=>{let s=R.create(['price','revenue']);s=R.finish(s,'price',{changed:true});assert.equal(R.summary(s).percent,50)});
test('noncritical failure yields warning and keeps success',()=>{let s=R.create(['price','news']);s=R.finish(s,'price',{changed:true});s=R.fail(s,'news','timeout','warning');const x=R.summary(s);assert.equal(x.status,'warning');assert.equal(x.successCount,1);assert.equal(x.warningCount,1)});
test('stale result is a warning',()=>{let s=R.create(['price']);s=R.finish(s,'price',{stale:true});assert.equal(R.summary(s).status,'warning')});
