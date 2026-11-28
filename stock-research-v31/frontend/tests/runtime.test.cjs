const test=require('node:test');const assert=require('node:assert/strict');
const R=require('../js/runtime.js');

test('local mode uses same-origin while public mode uses configured API',()=>{
 assert.equal(R.resolveApiBase({hostname:'127.0.0.1'},'https://api.example.com'),'');
 assert.equal(R.resolveApiBase({hostname:'localhost'},'https://api.example.com'),'');
 assert.equal(R.resolveApiBase({hostname:'alger68.github.io'},'https://stockmaster.onrender.com/'),'https://stockmaster.onrender.com');
});

test('fallback runs only when primary fails',async()=>{
 let used=false;
 const ok=await R.withFallback(async()=>({ok:true}),async()=>{used=true;return {fallback:true}});
 assert.equal(used,false);assert.equal(ok.ok,true);
 const fb=await R.withFallback(async()=>{throw new Error('offline')},async()=>({fallback:true}));
 assert.equal(fb.fallback,true);assert.equal(fb._fallbackReason,'offline');
});
