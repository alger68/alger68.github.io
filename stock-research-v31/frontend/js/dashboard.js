(function(){
 const $=s=>document.querySelector(s);const fmt=(v,d=2)=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('zh-TW',{maximumFractionDigits:d});
 function setText(id,v){const e=$(id);if(e)e.textContent=v;}
 function render(m){
  setText('#stock-id',m.identity?`${m.identity.ticker} · ${m.identity.exchange}`:'—');setText('#price-main',m.quote.price===null?'—':`${fmt(m.quote.price)} 元`);setText('#price-badge',m.quote.badge||'—');
  const warn=$('#stale-warning');if(warn){warn.hidden=m.quote.tone!=='warning';warn.querySelector('strong').textContent=m.quote.message||'';warn.querySelector('small').textContent=`最新行情：${m.quote.date||'—'} ｜ 系統檢查：${m.quote.checkedAt||'—'}`;}
  setText('#q-pe',fmt(m.quick.pe));setText('#q-yoy',m.quick.revenueYoY===null?'—':`${fmt(m.quick.revenueYoY)}%`);setText('#q-eps',m.quick.eps===null?'—':`${fmt(m.quick.eps)} 元`);setText('#q-confidence',m.quick.confidence===null?'—':`${Math.round(m.quick.confidence*100)}%`);
  setText('#technical-status',m.technicals.available?'資料可用':'資料不足');
  const ind=$('#indicator-grid');if(ind){const t=m.technicals||{};ind.innerHTML=[['RSI14',t.rsi14],['MACD',t.macd?.macd],['KD-K',t.kd?.k],['Bollinger Mid',t.bollinger?.middle]].map(([a,b])=>`<div><span>${a}</span><b>${fmt(b)}</b></div>`).join('');}
  const dec=m.decision?.decision||m.decision||{};setText('#decision-state',dec.state||'INSUFFICIENT_DATA');const sc=m.decision?.score?.total;setText('#decision-score',sc===null||sc===undefined?'—':`${fmt(sc,1)} / 100`);
  const fin=$('#financial-body');if(fin){const f=m.financials;fin.innerHTML=f?`<div><span>營收</span><b>${fmt(f.revenue)}</b></div><div><span>毛利率</span><b>${fmt(f.gross_margin)}%</b></div><div><span>營益率</span><b>${fmt(f.operating_margin)}%</b></div><div><span>FCF</span><b>${fmt(f.fcf)}</b></div>`:'<p class="muted">尚未取得已驗證財報。</p>';}
 }
 async function load(){const t=$('#stock-search').value.trim()||window.StockState.ticker;const e=$('#exchange').value;window.StockState={...window.StockState,ticker:t,exchange:e,loading:true,error:null};document.body.classList.add('loading');try{const [s,tech,fin,dec]=await Promise.all([StockAPI.summary(t,e),StockAPI.technicals(t,e).catch(()=>null),StockAPI.financials(t,e).catch(()=>null),StockAPI.decision(t,e).catch(()=>null)]);render(StockDashboardModel.build(s,tech,fin,dec));}catch(err){window.StockState.error=err.message;setText('#global-error',err.message);}finally{window.StockState.loading=false;document.body.classList.remove('loading');}}
 $('#stock-form')?.addEventListener('submit',e=>{e.preventDefault();load();});$('#refresh-btn')?.addEventListener('click',async()=>{await StockAPI.refresh(window.StockState.ticker,window.StockState.exchange).catch(()=>{});load();});
 render(StockDashboardModel.build({identity:{ticker:'—',exchange:'—'},price:null,source_confidence:0,warnings:[]},null));
 window.StockDashboard={load,render};
})();
