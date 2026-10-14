(function(root){
 const configured=root.STOCKMASTER_RENDER_API||'';
 const base=()=>StockRuntime.resolveApiBase(root.location,configured);
 const snapshotBase=()=>root.STOCKMASTER_SNAPSHOT_BASE||'/stock-research/data/companies';
 async function json(path,opts={}){const headers={Accept:'application/json',...(opts.headers||{})};const r=await fetch(base()+path,{...opts,headers});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);return r.json();}
 const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:null};
 async function snapshotSummary(t,e='TWSE'){
  const exchange=String(e).toUpperCase(),ticker=String(t).toUpperCase();
  const r=await fetch(`${snapshotBase()}/${encodeURIComponent(exchange)}/${encodeURIComponent(ticker)}.json`,{cache:'no-store',headers:{Accept:'application/json'}});
  if(!r.ok)throw new Error(`snapshot ${r.status}`);
  const s=await r.json(),d=s.datasets||{},q=d.twsePrice?.rows?.[0]||d.tpexPrice?.rows?.[0]||null,rev=d.twseRevenue?.rows?.[0]||d.tpexRevenue?.rows?.[0]||null,val=d.twseValuation?.rows?.[0]||d.tpexValuation?.rows?.[0]||null,inc=d.twseIncome?.rows?.[0]||d.tpexIncome?.rows?.[0]||null;
  return {identity:{exchange,ticker},price:q?{price:num(q.ClosingPrice??q.Close),quote_date:q.Date||null,checked_at:s.checkedAt||null,freshness:'snapshot',lag_trading_days:null,label:'公開快照',source:d.twsePrice?'TWSE':'TPEx'}:null,revenue:rev?{period:rev['資料年月']||null,yoy:num(rev['營業收入-去年同月增減(%)']),source:d.twseRevenue?'TWSE':'TPEx'}:null,valuation:val?{pe:num(val.PEratio??val.PriceEarningRatio),yield:num(val.DividendYield??val.YieldRatio),source:d.twseValuation?'TWSE':'TPEx'}:null,eps:inc?{value:num(inc['基本每股盈餘（元）']),period:null,verified:false,confidence:.25,verification_note:'snapshot_scope_unverified'}:{value:null,period:null,verified:false,confidence:0},source_confidence:.5,warnings:['FastAPI unavailable; using published read-only snapshot'],checked_at:s.checkedAt||null,read_only:true};
 }
 root.StockAPI={
  search:q=>json(`/api/stocks/search?q=${encodeURIComponent(q)}`),
  summary:(t,e='TWSE')=>StockRuntime.withFallback(()=>json(`/api/stocks/${encodeURIComponent(t)}/summary?exchange=${encodeURIComponent(e)}`),()=>snapshotSummary(t,e)),
  technicals:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/technicals?exchange=${encodeURIComponent(e)}`),
  financials:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/financials?exchange=${encodeURIComponent(e)}`),
  decision:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/decision?exchange=${encodeURIComponent(e)}`),
  valuation:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/valuation?exchange=${encodeURIComponent(e)}`),
  history:(t,e='TWSE',r='1y')=>json(`/api/stocks/${encodeURIComponent(t)}/history?exchange=${encodeURIComponent(e)}&range=${encodeURIComponent(r)}`),
  news:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/news?exchange=${encodeURIComponent(e)}`),
  watchlist:()=>json('/api/watchlist'),
  addWatchlist:item=>json('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)}),
  deleteWatchlist:(t,e='TWSE')=>json(`/api/watchlist/${encodeURIComponent(t)}?exchange=${encodeURIComponent(e)}`,{method:'DELETE'}),
  market:()=>json('/api/market/overview'),
  refresh:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/refresh?exchange=${encodeURIComponent(e)}`,{method:'POST'})
 };
})(window);
