import fs from 'node:fs/promises';
const target=new URL('../data/market.json',import.meta.url);
let previous={datasets:{}};try{previous=JSON.parse(await fs.readFile(target,'utf8'))}catch{}
const sources={
 twsePrice:['https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL','TWSE 每日成交'],
 twseRevenue:['https://openapi.twse.com.tw/v1/opendata/t187ap05_L','上市公司月營收'],
 twseValuation:['https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL','TWSE 本益比與淨值比'],
 twseIncome:['https://openapi.twse.com.tw/v1/opendata/t187ap06_L_ci','上市一般業綜合損益表'],
};
const now=new Date().toISOString();
async function get(url){const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'StockResearchWorkbench/2.1 public market-data collector'},signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();if(!Array.isArray(d)||!d.length)throw new Error('Empty or invalid response');return d;}
try{
 const r=await fetch('https://www.tpex.org.tw/openapi/swagger.json',{signal:AbortSignal.timeout(15000)});
 if(r.ok){const d=await r.json();const paths=Object.keys(d.paths||{});for(const [key,needle,label] of [['tpexPrice','tpex_mainboard_daily_close_quotes','TPEx 每日成交'],['tpexRevenue','mopsfin_t187ap05_O','上櫃公司月營收'],['tpexIncome','mopsfin_t187ap06_O_ci','上櫃一般業綜合損益表'],['tpexValuation','tpex_mainboard_peratio_analysis','TPEx 本益比與淨值比']]){const p=paths.find(x=>x.split('/').at(-1)===needle);if(p)sources[key]=['https://www.tpex.org.tw'+(d.basePath||'/openapi/v1')+p,label];}console.log('TPEx discovered',Object.keys(sources).filter(k=>k.startsWith('tpex')));}
}catch(e){console.log('TPEx discovery unavailable:',e.message);}
const out={schemaVersion:1,checkedAt:now,datasets:{...previous.datasets},errors:[]};let successes=0;
for(const [key,[url,label]] of Object.entries(sources)){
 try{const rows=await get(url);out.datasets[key]={url,label,fetchedAt:now,rows};successes++;const example=rows.find(r=>Object.values(r).includes('2609'))||rows[0];console.log(key,rows.length,JSON.stringify(example));}
 catch(e){out.errors.push({key,url,message:e.message,checkedAt:now});console.log(key,'FAILED',e.message);}
}
await fs.mkdir(new URL('../data/',import.meta.url),{recursive:true});await fs.writeFile(target,JSON.stringify(out));
console.log('Successful sources',successes,'out of',Object.keys(sources).length);
if(!successes)process.exitCode=1;
