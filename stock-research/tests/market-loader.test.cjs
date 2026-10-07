const {test}=require('node:test');const assert=require('node:assert/strict');
const {createLoader}=require('../market-loader.js');
const sample={schemaVersion:1,datasets:{},subject:{exchange:'TWSE',ticker:'2395'}};
test('coalesces simultaneous requests, uses per-company URL and retries after failure',async()=>{
 let count=0;const urls=[];
 const loader=createLoader(async url=>{count++;urls.push(url);await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>sample}},()=>100);
 const target={exchange:'TWSE',ticker:'2395'};
 await Promise.all([loader.company(target,true),loader.company(target,true)]);
 await loader.company(target);assert.equal(count,1);
 await loader.company(target,true);assert.equal(count,2);
 assert.ok(urls.every(u=>u.startsWith('data/companies/TWSE/2395.json?')));
 let fail=true;
 const recovering=createLoader(async()=>{if(fail)throw Object.assign(new Error(),{name:'TimeoutError'});return {ok:true,json:async()=>sample}});
 await assert.rejects(recovering.company(target),/逾時/);fail=false;
 assert.deepEqual(await recovering.company(target),sample);
});
test('status is separate; 404, server errors and wrong company are visible',async()=>{
 let url;const loader=createLoader(async u=>{url=u;return {ok:true,json:async()=>({schemaVersion:1,datasets:{}})}});
 await loader.status(true);assert.ok(url.startsWith('data/market-status.json?'));
 await assert.rejects(loader.company({exchange:'TWSE',ticker:'2395'}),/代號/);
 const missing=createLoader(async()=>({ok:false,status:404}));
 await assert.rejects(missing.company({exchange:'TWSE',ticker:'2395'}),/尚未發布/);
 const tls=createLoader(async()=>({ok:false,status:502,json:async()=>({message:'Python 憑證驗證失敗'})}));
 await assert.rejects(tls.status(),/憑證/);
 await assert.rejects(loader.company({exchange:'TWSE',ticker:'../bad'}),/代號/);
});
