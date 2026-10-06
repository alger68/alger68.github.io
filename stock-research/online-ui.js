'use strict';
let marketSnapshot=null,marketRequest=null;
const M=window.StockMarket;
function factsCount(f){return ['quote','revenue','valuation','income'].filter(k=>f?.[k]).length;}
function marketOverview(r){
 const f=r.market;if(!f)return `<div class="market-empty"><strong>先上網取得這家公司的資料</strong><p>按「上網更新」取得官方盤後價格、營收與可用財報摘要。新增公司或開啟舊研究卡會自動讀取。</p>${r.marketError?`<p class="error">${esc(r.marketError)}</p>`:''}</div>`;
 const q=f.quote,v=f.valuation,rev=f.revenue,inc=f.income;
 const card=(label,value,unit,note)=>`<div class="market-card"><span>${label}</span><strong>${value}<small>${unit}</small></strong><p>${note}</p></div>`;
 const cards=[card('官方收盤價',q?fmt(q.close):'—',' 元',q?`${esc(q.date)} · 非盤中即時`:'該來源沒有有效行情'),card('月營收',rev?fmt(rev.amountYi):'—',' 億元',rev?`${esc(rev.period)} · 年增 ${fmt(rev.yoy)}%`:'此類標的或期別未取得'),card('歷史本益比',v&&v.pe>0?fmt(v.pe):'—',' 倍',v?`${esc(v.date)} · 非前瞻估值`:'不適用或來源未提供'),card('財報所列 EPS',inc?fmt(inc.eps):'—',' 元',inc?`${esc(inc.period)} · 口徑見下方`:'一般業財報未取得')].join('');
 return `<section class="market-block"><div class="section-title"><h3>已取得的官方資料</h3>${tag(`${factsCount(f)} 類資料`,'good')}</div><div class="market-grid">${cards}</div>${inc?`<p class="fine market-basis">財報：${esc(inc.basis)}；毛利率 ${fmt(inc.grossMargin)}%、營業利益率 ${fmt(inc.opMargin)}%（同表科目比率）。</p>`:''}<p class="fine market-basis">${q?'價格資料日 '+esc(q.date)+'。':''} 資料期別與上網時間分開；完整研究條件仍需驗證。</p>${r.marketError?`<p class="error">${esc(r.marketError)}</p>`:''}<details><summary>查看來源與擷取時間</summary><div class="source-list">${['quote','revenue','valuation','income'].filter(k=>f[k]).map(k=>{const a=f[k];return `<p><a href="${esc(a.source.url)}" target="_blank" rel="noopener noreferrer">${esc(a.source.label)}</a><br><span class="fine">期別 ${esc(a.date||a.period)} · 擷取 ${esc(new Date(a.source.fetchedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}))}${a.publishedDate?' · 出表日 '+esc(a.publishedDate):''}</span></p>`}).join('')}</div></details></section>`;
}
function onlineMethods(r){const f=r.market;if(!f)return '';const selected=methods(r);const facts=f.revenue?`${f.revenue.period} 營收 ${fmt(f.revenue.amountYi)} 億元，年增 ${fmt(f.revenue.yoy)}%。`:'月營收尚未取得。';return `<div class="info"><b>已取得的資料如何用在分析？</b>${selected.includes('MM')?`<p>MM 框架：${facts}尚需驗證產業需求、價格與公司受惠傳導。</p>`:''}${selected.includes('MARKS')?`<p>Marks 框架：${f.valuation?`歷史 PE ${fmt(f.valuation.pe)} 倍、PB ${fmt(f.valuation.pb)} 倍。`:'估值資料尚未取得。'}單靠倍數不能判便宜或昂貴，風險立場仍待評估。</p>`:''}${selected.includes('MANUS')?`<p>MANUS：已整理 ${factsCount(f)} 類官方資料；核心論點、獨立反證與前瞻估值仍須補齊。</p>`:''}<p class="fine">以上是系統整理，不是作者個股建議；股癌／曼報原文未取得時保持留白。</p></div>`;}
async function onlineUpdate(id,force=false){
 const r=local.find(x=>x.id===id);if(!r||r.demo||r.removed||r.paused||busy)return;
 busy=true;progress=10;progressText='正在上網讀取最近成功取得的官方資料…';render();
 try{
  if(!marketSnapshot||force){
   if(!marketRequest)marketRequest=(async()=>{const response=await fetch('data/market.json?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('網站資料讀取失敗 HTTP '+response.status);const payload=await response.json();if(payload.schemaVersion!==1||!payload.datasets)throw new Error('官方資料格式不符');return payload;})();
   try{marketSnapshot=await marketRequest;}finally{marketRequest=null;}
  }
  progress=65;progressText='已下載，正在核對市場、代號、資料日期及金額單位…';render();
  const found=M.extract(marketSnapshot,r);if(!factsCount(found))throw new Error(r.exchange==='TPEX'?'本次上櫃來源未取得此股有效資料，保留前版並稍後重試。':'官方快照尚無此標的資料，保留前版；請查看來源或稍後重試。');
  if(r.removed||r.paused)return;
  r.market=M.merge(r.market,found);r.marketError='';r.marketReadAt=new Date().toISOString();
  r.confirmedKey=null;r.reportVersion+=1;r.reportRevision=r.revision;r.organizedAt=when();
  if(r.thesis==='尚未建立可查證的投資論點。'||r.thesis.startsWith('已取得官方資料：'))r.thesis=`已取得官方資料：${r.market.quote?`${r.market.quote.date} 收盤 ${fmt(r.market.quote.close)} 元。`:''}${r.market.revenue?`${r.market.revenue.period} 月營收年增 ${fmt(r.market.revenue.yoy)}%。`:''}完整投資論點、估值與觸發條件仍待驗證。`;
  r.history.unshift({title:`上網更新 R${r.reportVersion}`,detail:`${when()} · 取得 ${factsCount(found)} 類官方資料；來源日期逐欄保留，不把讀取時間當成行情日。`});
  progress=100;changeRecord(r);toast('已取得官方資料，畫面已更新；不會自動寫入 Notion。');
 }catch(e){r.marketError=e.message;r.history.unshift({title:'上網更新未完成',detail:when()+' · '+e.message+'；既有資料保留。'});changeRecord(r);toast(e.message);}
 finally{busy=false;render();}
}
function autoOnline(){const r=current();if(mode==='mine'&&r&&!r.paused&&!r.removed&&!busy){const age=r.marketReadAt?Date.now()-Date.parse(r.marketReadAt):Infinity;if(!r.market||age>30*60*1000)onlineUpdate(r.id);}}
