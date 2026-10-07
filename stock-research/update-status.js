'use strict';
(()=>{
 const panel=document.getElementById('auto-update-status');
 const message=document.getElementById('auto-update-message');
 const button=document.getElementById('check-market-now');
 let running=false,lastSnapshot=null;
 async function check(manual=false){
  if(running)return;running=true;button.disabled=true;
  message.textContent='正在檢查網站最新官方資料…';
  try{
   const response=await fetch('data/market.json?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const payload=await response.json();
   if(payload.schemaVersion!==1||!payload.datasets)throw new Error('資料格式不符');
   const sources=Object.values(payload.datasets);
   const times=sources.map(x=>Date.parse(x.fetchedAt)).filter(Number.isFinite);
   if(!times.length)throw new Error('尚無成功擷取紀錄');
   const newest=Math.max(...times),age=Date.now()-newest;
   const time=new Date(newest).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});
   const errors=payload.errors?.length||0;
   message.textContent=`最近成功擷取：${time}（台灣） · ${sources.length} 組來源${errors?` · 本次 ${errors} 組來源未更新，保留舊資料`:''}${age>36*3600000?' · 資料已超過 36 小時，請檢查排程':''}。各項實際資料日期請看研究卡。`;
   panel.dataset.state=errors||age>36*3600000?'warning':'ready';
   const changed=lastSnapshot!==null&&lastSnapshot!==payload.checkedAt;
   lastSnapshot=payload.checkedAt;
   marketSnapshot=payload;
   const r=current();
   if((manual||changed)&&mode==='mine'&&r&&!busy)await onlineUpdate(r.id);
  }catch(e){panel.dataset.state='warning';message.textContent='目前無法確認最新資料（'+e.message+'）。既有研究保留；可稍後再按檢查。';}
  finally{running=false;button.disabled=false;}
 }
 button.addEventListener('click',()=>check(true));
 check();
 setInterval(()=>{if(!document.hidden)check();},5*60*1000);
})();
