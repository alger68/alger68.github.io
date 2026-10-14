(function(root){
'use strict';
const OFFICIAL=['Company IR','MOPS','TWSE','TPEx','TPEX'];
const PRIORITY={'Company IR':100,MOPS:95,TWSE:90,TPEx:90,TPEX:90,Fugle:70,Taishin:70,Yahoo:30};
const VALID_SCOPES=new Set(['single_day','single_month','single_quarter','ytd','ttm','annual']);
const num=v=>v===null||v===undefined||String(v).trim()===''?null:Number.isFinite(Number(v))?Number(v):null;
const scope=v=>VALID_SCOPES.has(v)?v:null;
function datum(input={}){
  const sc=scope(input.scope), metric=String(input.metric||'');
  const period=input.period||null;
  const requiresScope=['eps','revenue','gross_margin','operating_margin','fcf'].includes(metric);
  const verified=input.verified===false?false:!(requiresScope&&!sc);
  return {metric,value:num(input.value),unit:input.unit||null,period,scope:sc,sourceName:input.sourceName||'Unknown',sourceUrl:input.sourceUrl||null,publishedAt:input.publishedAt||null,fetchedAt:input.fetchedAt||null,verified,confidence:input.confidence??(verified?1:0.4),verificationNote:input.verificationNote||null};
}
function rank(d){return PRIORITY[d.sourceName]||10;}
function verify(candidates=[]){
  const ds=candidates.map(datum).filter(x=>x.value!==null);
  if(!ds.length)return datum({verified:false,verificationNote:'no usable candidates'});
  ds.sort((a,b)=>rank(b)-rank(a));
  const best={...ds[0]};
  const comparable=ds.filter(x=>x.metric===best.metric&&x.period===best.period&&x.scope===best.scope);
  const matching=comparable.filter(x=>Math.abs(x.value-best.value)<=Math.max(1e-9,Math.abs(best.value)*1e-6));
  const official=comparable.filter(x=>OFFICIAL.includes(x.sourceName));
  best.verified=best.verified && (matching.length>=2 || OFFICIAL.includes(best.sourceName));
  best.confidence=best.verified?(matching.length>=2?1:0.9):0.4;
  best.verificationNote=matching.length>=2?'cross-source match':official.length?'official source preferred':'unverified';
  return best;
}
function key(d){return d?.period||d?.publishedAt||d?.fetchedAt||'';}
function prefer(current,incoming){if(!current)return incoming||null;if(!incoming)return current;return key(incoming)>key(current)?incoming:current;}
function fromRaw(metric,value,period,scopeValue,source,extra={}){return datum({metric,value,period,scope:scopeValue,sourceName:source?.label||source?.sourceName||'Unknown',sourceUrl:source?.url||null,fetchedAt:source?.fetchedAt||null,...extra});}
function bundle(extracted,target={}){
 const out={asset:target.asset||'個股',ticker:target.ticker||null,metrics:{},issues:[...(extracted?.issues||[])]};
 if(extracted?.quote)out.metrics.price=fromRaw('price',extracted.quote.close,extracted.quote.date,'single_day',extracted.quote.source,{unit:'TWD'});
 if(extracted?.revenue){out.metrics.revenue=fromRaw('revenue',extracted.revenue.amountYi,extracted.revenue.period,'single_month',extracted.revenue.source,{unit:'TWD 100M',publishedAt:extracted.revenue.publishedDate});out.metrics.revenueYoY=fromRaw('revenue_yoy',extracted.revenue.yoy,extracted.revenue.period,'single_month',extracted.revenue.source,{unit:'%'});}
 if(extracted?.valuation){out.metrics.pe=fromRaw('pe',extracted.valuation.pe,extracted.valuation.date,'single_day',extracted.valuation.source);out.metrics.pb=fromRaw('pb',extracted.valuation.pb,extracted.valuation.date,'single_day',extracted.valuation.source);out.metrics.yield=fromRaw('yield',extracted.valuation.yield,extracted.valuation.date,'single_day',extracted.valuation.source,{unit:'%'});}
 if(extracted?.income){const known=/單季/.test(extracted.income.basis||'')&&!/待核對/.test(extracted.income.basis||'');out.metrics.eps=fromRaw('eps',extracted.income.eps,extracted.income.period,known?'single_quarter':null,extracted.income.source,{unit:'TWD/share',publishedAt:extracted.income.publishedDate,verified:known,verificationNote:known?'explicit single-quarter basis':'quarter/YTD basis unresolved'});}
 return out;
}
const C={OFFICIAL,PRIORITY,scope,datum,verify,prefer,bundle};
if(typeof module!=='undefined')module.exports=C;else root.Canonical=C;
})(globalThis);
