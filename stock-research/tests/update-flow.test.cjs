const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
test('browser status script runs, then retries a stale card after a busy check',async()=>{
 let tick,updates=0;const elements={};
 for(const id of ['auto-update-status','auto-update-message','check-market-now','market-last-check'])elements[id]={textContent:'',dataset:{},addEventListener(){},querySelector(){return {}},previousElementSibling:{tagName:'P'}};
 const r={market:{checkedAt:'old'}};
 const context={document:{getElementById:id=>elements[id],hidden:false},MarketLoader:{status:async()=>({schemaVersion:1,checkedAt:'new',datasets:{twsePrice:{fetchedAt:'2026-10-07T13:00:00Z'}}})},current:()=>r,mode:'mine',busy:true,onlineUpdate:async(id,force)=>{assert.equal(force,true);updates++;r.market.checkedAt='new'},setInterval:fn=>{tick=fn},Date};
 context.window=context;
 vm.runInNewContext(fs.readFileSync(__dirname+'/../update-status.js','utf8'),context);
 await new Promise(setImmediate);
 assert.ok(!elements['market-last-check'].textContent.includes('失敗'));
 assert.equal(updates,0);context.busy=false;tick();await new Promise(setImmediate);
 assert.equal(updates,1);
 tick();await new Promise(setImmediate);assert.equal(updates,1);
});
test('company refresh uses small snapshot and preserves user thesis/evidence',async()=>{
 const M=require('../market.js');
 const raw=JSON.parse(fs.readFileSync(__dirname+'/../data/market.json'));
 const {splitSnapshot}=await import('../scripts/split-market.mjs');
 const snapshot=splitSnapshot(raw).companies['TWSE/2395.json'];
 const r={id:'test',ticker:'2395',exchange:'TWSE',asset:'個股',thesis:'我的論點',evidence:[{text:'我的筆記'}],history:[],reportVersion:0};
 const context={window:{StockMarket:M,MarketLoader:{company:async()=>snapshot},ResearchAudit:{apply(){}},COMPANY_DIRECTORY:{entries:[]}},local:[r],busy:false,progress:0,progressText:'',render(){},changeRecord(){},toast(){},when:()=>'',fmt:String};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../online-ui.js','utf8'),context);
 await context.onlineUpdate('test',true);
 assert.equal(r.marketError,'');assert.equal(r.thesis,'我的論點');assert.equal(r.evidence[0].text,'我的筆記');
 assert.deepEqual(r.market,M.extract(raw,r));assert.equal(context.busy,false);
});
