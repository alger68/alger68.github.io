(function(root){'use strict';
const n=v=>Number.isFinite(Number(v))?Number(v):null;
function pePrice(eps,pe){const e=n(eps),p=n(pe);return e>0&&p>0?Math.round(e*p*100)/100:null;}
function scenario({eps,pe,label,sourceType,forecastPeriod}){return {label,eps:n(eps),pe:n(pe),price:pePrice(eps,pe),sourceType,forecastPeriod};}
function withUpside(s,current){if(!s)return null;const c=n(current);return {...s,upsidePct:s.price!==null&&c>0?Math.round(((s.price-c)/c*100)*100)/100:null};}
function range({bear,base,bull,currentPrice}){return {currentPrice:n(currentPrice),bear:withUpside(bear,currentPrice),base:withUpside(base,currentPrice),bull:withUpside(bull,currentPrice)};}
function historicalBand({eps,peLow,peMedian,peHigh}){return {low:pePrice(eps,peLow),median:pePrice(eps,peMedian),high:pePrice(eps,peHigh),eps:n(eps),peLow:n(peLow),peMedian:n(peMedian),peHigh:n(peHigh)};}
const V={pePrice,scenario,range,historicalBand};if(typeof module!=='undefined')module.exports=V;else root.Valuation=V;})(globalThis);
