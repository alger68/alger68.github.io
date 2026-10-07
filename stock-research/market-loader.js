(function(root){
'use strict';
function createLoader(fetcher=(...args)=>fetch(...args),now=()=>Date.now()){
 const pending=new Map(),cache=new Map();
 async function load(path,force=false){
  if(pending.has(path))return pending.get(path);
  const old=cache.get(path);if(!force&&old&&now()-old.at<60000)return old.data;
  const request=(async()=>{
   try{
    const response=await fetcher('data/'+path+'?t='+now()+(force?'&refresh=1':''),{cache:'no-store',signal:AbortSignal.timeout(45000)});
    if(!response.ok){
     if(response.status===404)throw Error('此公司資料或更新狀態尚未發布，請稍後再試。');
     let detail='';try{detail=(await response.json()).message||'';}catch{}
     throw Error(detail||'網站資料讀取失敗 HTTP '+response.status);
    }
    const data=await response.json();
    if(data.schemaVersion!==1||!data.datasets||typeof data.datasets!=='object')throw Error('官方資料格式不符，未覆寫既有研究。');
    const match=path.match(/^companies\/(TWSE|TPEX)\/([0-9A-Z]{4,8})\.json$/);
    if(match&&(data.subject?.exchange!==match[1]||data.subject?.ticker!==match[2]))throw Error('資料市場或公司代號不符，未套用。');
    cache.delete(path);cache.set(path,{at:now(),data});
    if(cache.size>256)cache.delete(cache.keys().next().value);
    return data;
   }catch(e){
    if(e.name==='TimeoutError'||e.name==='AbortError')throw Error('資料下載逾時，未收到完整資料；請稍後按「上網更新」重試。');
    if(e instanceof SyntaxError)throw Error('資料下載不完整或格式錯誤，保留既有研究，請重試。');
    if(e instanceof TypeError)throw Error('資料連線失敗；請確認網路及本機程式仍在執行。');
    throw e;
   }
  })();
  pending.set(path,request);
  try{return await request;}finally{pending.delete(path);}
 }
 return {status:(force=false)=>load('market-status.json',force),company:async(target,force=false)=>{
  if(!['TWSE','TPEX'].includes(target.exchange)||!/^[0-9A-Z]{4,8}$/.test(target.ticker))throw Error('市場或公司代號不符');
  return load(`companies/${target.exchange}/${target.ticker}.json`,force);
 }};
}
if(typeof module!=='undefined')module.exports={createLoader};else root.MarketLoader=createLoader();
})(globalThis);
