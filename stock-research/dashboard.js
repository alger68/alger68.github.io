(function(root){'use strict';
const val=x=>x&&typeof x==='object'&&'value'in x?x.value:(Number.isFinite(Number(x))?Number(x):null);
function empty(symbol=null){return {identity:{ticker:symbol},cards:{price:null,pe:null,pb:null,yield:null,eps:null,revenueYoY:null},meta:{},score:null,valuation:null,decision:null,refresh:null};}
function build(input={}){const identity={...(input.identity||{})},c=input.canonical||{},isETF=identity.asset==='ETF';const p=c.price&&typeof c.price==='object'?c.price:null;return {identity,cards:{price:val(c.price),pe:val(c.pe),pb:val(c.pb),yield:val(c.yield),eps:val(c.eps),revenueYoY:val(c.revenueYoY)},meta:{pricePeriod:p?.period||null,priceFetchedAt:p?.fetchedAt||null},score:isETF?null:(input.score||null),valuation:isETF?null:(input.valuation||null),decision:isETF?null:(input.decision||null),refresh:input.refresh||null,canonical:c};}
const symbolChanged=(a,b)=>String(a||'')!==String(b||'');
const cards=m=>Object.entries(m.cards).map(([key,value])=>({key,value}));
function sourceConfidence(bundle={}){const metrics=bundle.metrics||bundle||{},xs=Object.values(metrics).filter(x=>x&&typeof x==='object'&&'verified'in x),verified=xs.filter(x=>x.verified).length,official=xs.filter(x=>['Company IR','MOPS','TWSE','TPEx','TPEX'].includes(x.sourceName)).length;return {percent:xs.length?Math.round(verified/xs.length*100):0,officialCount:official,verifiedCount:verified,unresolvedCount:xs.length-verified};}
const D={empty,build,symbolChanged,cards,sourceConfidence};if(typeof module!=='undefined')module.exports=D;else root.DashboardModel=D;})(globalThis);
