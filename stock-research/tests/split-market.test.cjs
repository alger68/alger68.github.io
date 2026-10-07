const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('../market.js');
test('company shards preserve every extracted value and source, without the full-market payload',async()=>{
 const {splitSnapshot}=await import('../scripts/split-market.mjs');
 const raw=JSON.parse(fs.readFileSync(__dirname+'/../data/market.json'));
 const {status,companies}=splitSnapshot(raw);
 assert.equal(status.checkedAt,raw.checkedAt);
 assert.deepEqual(status.errors,raw.errors);
 assert.ok(Buffer.byteLength(JSON.stringify(status))<15000);
 let count=0;
 for(const [path,snapshot] of Object.entries(companies)){
  const target=snapshot.subject;
  assert.match(path,/^(TWSE|TPEX)\/[0-9A-Z]{4,8}\.json$/);
  assert.deepEqual(M.extract(snapshot,target),M.extract(raw,target));
  assert.ok(Buffer.byteLength(JSON.stringify(snapshot))<100000);
  for(const ds of Object.values(snapshot.datasets))assert.equal(ds.rows.length,1);
  count++;
 }
 assert.ok(count>1000);
 assert.ok(companies['TWSE/2395.json']);
 assert.ok(Object.values(status.datasets).every(ds=>!('rows' in ds)));
});
test('same ticker across exchanges is isolated; invalid paths and duplicate rows are handled',async()=>{
 const {splitSnapshot}=await import('../scripts/split-market.mjs');
 const raw={schemaVersion:1,checkedAt:'2026-10-07T00:00:00Z',errors:[],datasets:{
  twsePrice:{fetchedAt:'old',rows:[{Code:'2395',ClosingPrice:'100'},{Code:'2395',ClosingPrice:'200'},{Code:'../bad'}]},
  tpexPrice:{fetchedAt:'older',rows:[{SecuritiesCode:'2395',Close:'99'}]}
 }};
 const {companies}=splitSnapshot(raw);
 assert.equal(Object.keys(companies).length,2);
 assert.equal(companies['TWSE/2395.json'].datasets.twsePrice.rows[0].ClosingPrice,'100');
 assert.equal(companies['TPEX/2395.json'].datasets.tpexPrice.fetchedAt,'older');
});
