(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StockDashboardModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const n=v=>Number.isFinite(Number(v))?Number(v):null;
 function build(summary={},technicals=null,financials=null,decision=null){
  const p=summary.price||{};const stale=p.freshness==='stale';const snapshot=p.freshness==='snapshot';
  const quote={price:n(p.price),date:p.quote_date||null,checkedAt:p.checked_at||summary.checked_at||null,badge:p.label||null,tone:(stale||snapshot)?'warning':'normal',message:stale?`行情資料落後 ${p.lag_trading_days||1} 個交易日；${p.warning||'今日行情尚未由主要來源發布'}`:snapshot?'目前使用公開快照 fallback；請核對行情日期與來源。':null,source:p.source||null};
  return {identity:summary.identity||null,quote,quick:{pe:n(summary.valuation?.pe),yield:n(summary.valuation?.yield),revenueYoY:n(summary.revenue?.yoy),eps:n(summary.eps?.value),confidence:n(summary.source_confidence)},technicals:technicals||{available:false,warnings:['not_loaded']},financials:financials||null,decision:decision||null,warnings:summary.warnings||[]};
 }
 return {build};
});
