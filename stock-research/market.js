(function(root){
'use strict';
const num=x=>x===null||x===undefined||String(x).trim()===''||['--','-','N/A'].includes(String(x))?null:Number.isFinite(Number(String(x).replaceAll(',','')))?Number(String(x).replaceAll(',','')):null;
function date(x){const s=String(x||'').replaceAll('/','').replaceAll('-','');if(!/^\d{7,8}$/.test(s))return null;const y=s.length===7?Number(s.slice(0,3))+1911:Number(s.slice(0,4));const t=`${y}-${s.slice(-4,-2)}-${s.slice(-2)}`;return Number.isFinite(Date.parse(t))&&new Date(t).toISOString().slice(0,10)===t?t:null;}
function period(x){const s=String(x||'');if(!/^\d{5,6}$/.test(s))return null;const y=Number(s.slice(0,-2))+(s.length===5?1911:0),m=Number(s.slice(-2));return m>=1&&m<=12?`${y}-${String(m).padStart(2,'0')}`:null;}
const first=(o,keys)=>{for(const k of keys)if(o?.[k]!==undefined)return o[k];return null;};
function extract(snapshot,target){
 const prefix=target.exchange==='TWSE'?'twse':target.exchange==='TPEX'?'tpex':null;
 const result={quote:null,revenue:null,valuation:null,income:null,checkedAt:snapshot.checkedAt||null,issues:[]};if(!prefix)return result;
 function row(type){const ds=snapshot.datasets?.[prefix+type];if(!Array.isArray(ds?.rows))return null;const r=ds.rows.find(x=>String(first(x,['Code','公司代號','SecuritiesCompanyCode','SecuritiesCode','股票代號']))===target.ticker);return r?{r,source:{url:ds.url,label:ds.label,fetchedAt:ds.fetchedAt}}:null;}
 const p=row('Price');if(p){const r=p.r,asOf=date(first(r,['Date','日期'])),close=num(first(r,['ClosingPrice','Close','收盤價']));if(asOf&&close>0)result.quote={date:asOf,close,open:num(first(r,['OpeningPrice','Open','開盤價'])),high:num(first(r,['HighestPrice','High','最高價'])),low:num(first(r,['LowestPrice','Low','最低價'])),volume:num(first(r,['TradeVolume','TradingShares','成交股數'])),change:num(first(r,['Change','漲跌價差'])),source:p.source};}
 if(target.asset!=='ETF'){
 const v=row('Valuation');if(v){const asOf=date(first(v.r,['Date','日期']));if(asOf)result.valuation={date:asOf,pe:num(first(v.r,['PEratio','PriceEarningRatio','本益比'])),pb:num(first(v.r,['PBratio','PriceBookRatio','股價淨值比'])),yield:num(first(v.r,['DividendYield','YieldRatio','殖利率(%)'])),source:v.source};}
 const rev=row('Revenue');if(rev){const r=rev.r,month=period(r['資料年月']),amount=num(r['營業收入-當月營收']);if(month&&amount!==null)result.revenue={period:month,amountYi:amount/100000,yoy:num(r['營業收入-去年同月增減(%)']),mom:num(r['營業收入-上月比較增減(%)']),ytdYoY:num(r['累計營業收入-前期比較增減(%)']),publishedDate:date(r['出表日期']),note:String(r['備註']||''),source:rev.source};}
 const income=row('Income');if(income){const r=income.r,yr=num(first(r,['年度','Year'])),q=num(first(r,['季別','Season']));if(yr>0&&q>=1&&q<=4){const year=yr<1911?yr+1911:yr,revenue=num(r['營業收入']),gross=num(r['營業毛利（毛損）']),op=num(r['營業利益（損失）']);result.income={period:`${year}-Q${q}`,basis:'來源季度欄位；單季／累計口徑待核對，不年化',eps:num(r['基本每股盈餘（元）']),revenueYi:revenue===null?null:revenue/100000,operatingYi:op===null?null:op/100000,grossMargin:revenue>0&&gross!==null?gross/revenue*100:null,opMargin:revenue>0&&op!==null?op/revenue*100:null,publishedDate:date(first(r,['出表日期','Date'])),source:income.source};}}
 }
 for(const e of snapshot.errors||[])if(e.key?.startsWith(prefix))result.issues.push(`${e.key}: ${e.message}`);
 return result;
}
function merge(prev,next){const out={...prev,...next};for(const key of ['quote','revenue','income','valuation']){const old=prev?.[key],n=next?.[key];if(!n||(old&&(old.date||old.period)>(n.date||n.period)))out[key]=old||null;}return out;}
const M={num,date,period,extract,merge};if(typeof module!=='undefined')module.exports=M;else root.StockMarket=M;
})(globalThis);
