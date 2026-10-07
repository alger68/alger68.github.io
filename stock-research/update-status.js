(function(root){
'use strict';
function describe(payload,now=Date.now(),previousFetched=null){
 if(payload.schemaVersion!==1||!payload.datasets)throw Error('資料格式不符');
 const sources=Object.values(payload.datasets),times=sources.map(x=>Date.parse(x.fetchedAt)).filter(Number.isFinite);
 if(!times.length)throw Error('尚無成功擷取紀錄');
 const newest=Math.max(...times),oldest=Math.min(...times),offset=8*3600000;
 const tw=new Date(now+offset),today=Date.UTC(tw.getUTCFullYear(),tw.getUTCMonth(),tw.getUTCDate())-offset;
 const slots=[];for(let days=0;days<3;days++){
  const day=today-days*86400000,weekday=new Date(day+offset).getUTCDay();
  slots.push(day+(7*60+20)*60000);if(weekday>=1&&weekday<=5)slots.push(day+(14*60+20)*60000);
 }
 const due=Math.max(...slots.filter(x=>x<=now-3600000));
 return {fetchedAt:new Date(newest).toISOString(),oldestFetchedAt:new Date(oldest).toISOString(),checkedAt:new Date(now).toISOString(),unchanged:previousFetched!==null&&Date.parse(previousFetched)===newest,overdue:newest<due,sourceCount:sources.length,errorCount:payload.errors?.length||0};
}
if(typeof module!=='undefined'){module.exports={describe};return;}
const panel=document.getElementById('auto-update-status'),message=document.getElementById('auto-update-message'),button=document.getElementById('check-market-now');
if(!panel||!message||!button)return;
const headline=panel.querySelector('strong');if(headline)headline.textContent='公開資料快照 · 更新狀態';
const schedule=message.previousElementSibling;if(schedule?.tagName==='P')schedule.textContent='預定台灣時間每天 07:20、平日 14:20 擷取並發布；實際完成以資料時間為準。';
let checked=document.getElementById('market-last-check');if(!checked){checked=document.createElement('p');checked.id='market-last-check';message.insertAdjacentElement('afterend',checked);}
const fmt=x=>new Date(x).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});
let running=false,lastSnapshot=null,lastFetched=null;
async function check(manual=false){
 if(running)return;running=true;button.disabled=true;checked.textContent='正在檢查網站已發布的快照…';
 try{
  const response=await fetch('data/market.json?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const payload=await response.json(),s=describe(payload,Date.now(),lastFetched);
  message.textContent='資料最近擷取：'+fmt(s.fetchedAt)+'（台灣） · '+s.sourceCount+' 組來源'+(s.oldestFetchedAt!==s.fetchedAt?'；最舊來源 '+fmt(s.oldestFetchedAt):'')+'。此為公開快照，財報與 Nova 成交各有自己的時間。';
  checked.textContent='本頁檢查時間：'+fmt(s.checkedAt)+'（台灣）'+(s.unchanged?' · 尚無較新的來源擷取紀錄。':' · 已讀取目前發布版本。')+(s.errorCount?' 本次 '+s.errorCount+' 組來源更新失敗，保留原日期。':'')+(s.overdue?' 已超過預定時段一小時仍未見新擷取；需查核排程，重新整理不會產生新資料。':'');
  panel.dataset.state=s.errorCount||s.overdue?'warning':'ready';
  const changed=lastSnapshot!==null&&lastSnapshot!==payload.checkedAt;
  lastSnapshot=payload.checkedAt;lastFetched=s.fetchedAt;marketSnapshot=payload;
  const r=current();if((manual||changed)&&mode==='mine'&&r&&!busy)await onlineUpdate(r.id);
 }catch(e){panel.dataset.state='warning';checked.textContent='本頁檢查失敗：'+fmt(Date.now())+'（台灣） · '+e.message+'。保留先前資料及原日期。';}
 finally{running=false;button.disabled=false;}
}
button.addEventListener('click',()=>check(true));check();
setInterval(()=>{if(!document.hidden)check();},5*60*1000);
})(globalThis);
