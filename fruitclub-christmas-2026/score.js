"use strict";

const teamsDefault = ["第一隊", "第二隊", "第三隊"];
const rounds = [
  {name:"聖誕大家來找碴", short:"大家找碴", ordinal:"第一關", unit:"處", max:6, hint:"90 秒找出兩張圖的差異。請輸入各隊圈對的處數，每隊最多 6 處。"},
  {name:"聖誕力拔山河", short:"力拔山河", ordinal:"第二關", unit:"勝", max:4, hint:"三隊依序兩兩對戰，成人與兒童分開進行。記錄六場比賽的勝隊，每隊最多 4 勝。"},
  {name:"名人大聯想", short:"名人大聯想", ordinal:"第三關", unit:"分", max:10, hint:"第一張圖猜中得 2 分，第二張才猜中得 1 分。輸入各隊五題合計，最高 10 分。"},
  {name:"馴鹿高速迷走", short:"馴鹿迷走", ordinal:"第四關", unit:"步", max:Number.MAX_SAFE_INTEGER, hint:"六棒原地快走，每棒 30 秒。請輸入各隊六棒合計的有效步數。"}
];
const key = "fruit-club-christmas-2026-scores-v1";
const teamIds = [0,1,2];
const emptyState = () => ({
  teams:[...teamsDefault], raw:rounds.map(()=>["","",""]), order:{}, active:0
});

function rawNumber(value, round) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text) || text.length > 16) return null;
  const n = Number(text);
  return Number.isSafeInteger(n) && n <= round.max ? n : null;
}
function compute(raw) {
  const details = rounds.map((r,j)=>{
    const vals = raw[j].map(v=>rawNumber(v,r));
    const complete = vals.every(v=>v!==null);
    const invalidSum = j===1 && complete && vals.reduce((a,b)=>a+b,0)!==6;
    const ready = complete && !invalidSum;
    const points = ready ? vals.map(v=>3-vals.filter(w=>w>v).length) : [null,null,null];
    return {vals,ready,points,invalidSum};
  });
  const count = details.filter(d=>d.ready).length;
  const total = teamIds.map(i=>details.reduce((acc,d)=>acc+(d.points[i]??0),0));
  return {details,count,total};
}
function groupRanks(total, order, final) {
  const highestFirst = [...new Set(total)].sort((a,b)=>b-a);
  let next = 1;
  return highestFirst.map(points=>{
    const ids = teamIds.filter(i=>total[i]===points);
    const groupKey = ids.join("-");
    const ranked = [];
    if(final && next===1 && ids.length>1 && Array.isArray(order[groupKey])){
      const champion=order[groupKey][0];
      if(ids.includes(champion))ranked.push(champion);
    }
    const rest = ids.filter(id=>!ranked.includes(id));
    const unresolved = rest.length>1;
    const rows = [...ranked,...rest].map((id,j)=>({
      id, points, place:next+(j<ranked.length?j:ranked.length), tied:unresolved&&rest.includes(id)
    }));
    const start=next;
    next+=ids.length;
    return {ids,start,points,ranked,rest,unresolved,rows,groupKey};
  });
}

function loadBoard() {
  const state=emptyState();
  try{
    const stored = JSON.parse(localStorage.getItem(key));
    if (!stored || typeof stored!=="object") return state;
    const seen=new Set();
    if(Array.isArray(stored.teams)&&stored.teams.length===3){
      const names=stored.teams.map((n,i)=>typeof n==="string"&&n.trim()?n.trim().slice(0,18):teamsDefault[i]);
      for(const n of names)seen.add(n);
      if(seen.size===3)state.teams=names;
    }
    if(Array.isArray(stored.raw)&&stored.raw.length===4){
      state.raw=stored.raw.map(row=>Array.isArray(row)&&row.length===3?row.map(v=>typeof v==="string"?v.slice(0,24):""):["","",""]);
    }
    if(stored.order && typeof stored.order==="object"&&!Array.isArray(stored.order))state.order=stored.order;
    if(Number.isInteger(stored.active)&&stored.active>=0&&stored.active<4)state.active=stored.active;
  }catch{}
  return state;
}
function scoreApp(){
  const $=id=>document.getElementById(id);
  let board=loadBoard();
  const requestedRound=new URLSearchParams(window.location.search).get("round");
  const requestedIndex=["spot","pull","guess","relay"].indexOf(requestedRound);
  if(requestedIndex>=0)board.active=requestedIndex;
  const labels=[],inputs=[],units=[];
  const roundButtons=[];
  const dialog=$("team-dialog");
  const nameInputs=[];
  function save(){
    try{
      localStorage.setItem(key,JSON.stringify(board));
      $("save-caption").textContent="成績儲存在這部裝置";
    }catch{$("save-caption").textContent="本次成績僅保留在此頁，離開前請記下分數。";}
  }
  function make(tag,cls,text){
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  rounds.forEach((round,index)=>{
    const button=make("button");
    button.type="button";
    button.append(make("span","",round.ordinal),document.createTextNode(round.short));
    button.addEventListener("click",()=>{
      board.active=index;
      save();draw(true);
    });
    roundButtons.push(button);$("round-picks").append(button);
  });
  teamIds.forEach(id=>{
    const row=make("div","input-row"),label=make("label","team-name"),input=make("input","digits"),unit=make("span","unit");
    input.id="raw-"+id;label.htmlFor=input.id;input.type="text";input.inputMode="numeric";input.autocomplete="off";input.maxLength=16;input.placeholder="—";
    input.setAttribute("aria-describedby","round-hint record-status");
    input.addEventListener("input",()=>{
      const normalized=input.value.replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0));
      if(normalized!==input.value)input.value=normalized;
      board.raw[board.active][id]=normalized;
      board.order={};
      save(); draw(false);
    });
    labels.push(label);inputs.push(input);units.push(unit);row.append(label,input,unit);$("team-entry").append(row);
    const nr=make("div","name-row"),nl=make("label","",teamsDefault[id]),ni=make("input");
    nl.htmlFor="nickname-"+id;ni.id=nl.htmlFor;ni.required=true;ni.maxLength=18;ni.autocomplete="off";ni.type="text";
    nr.append(nl,ni);$("name-fields").append(nr);nameInputs.push(ni);
  });
  function draw(replaceInputs){
    const active=board.active,round=rounds[active];
    const stats=compute(board.raw);
    const current=stats.details[active];
    $("round-number").textContent=round.ordinal;
    $("round-name").textContent=round.name;
    $("round-hint").textContent=round.hint;
    roundButtons.forEach((b,i)=>b.setAttribute("aria-pressed",String(i===active)));
    teamIds.forEach(id=>{
      labels[id].textContent=board.teams[id];
      if(replaceInputs)inputs[id].value=board.raw[active][id];
      inputs[id].setAttribute("aria-invalid",String(!!board.raw[active][id].trim()&&current.vals[id]===null));
      units[id].textContent=round.unit;
    });
    const bad=current.vals.some((v,id)=>v===null&&board.raw[active][id].trim());
    const upper=round.max===Number.MAX_SAFE_INTEGER?"":("，最多 "+round.max+" "+round.unit);
    $("record-status").textContent=bad?("請輸入 0 以上的整數"+upper+"。"):current.invalidSum?"六場比賽共產生 6 勝，請核對三隊勝場。":current.ready?"本關積分已換算完成。":("已登記 "+current.vals.filter(v=>v!==null).length+"／3 隊，填完三隊即換算積分。");
    $("progress-label").textContent=stats.count+"／4 關已計分";
    const final=stats.count===4,groups=groupRanks(stats.total,board.order,final),all=groups.flatMap(g=>g.rows);
    const body=$("score-body");body.replaceChildren();
    all.forEach(item=>{
      const tr=make("tr");const h=make("th","",board.teams[item.id]);h.scope="row";tr.append(h);
      stats.details.forEach(d=>tr.append(make("td",d.ready?"":"empty",d.points[item.id]??"—")));
      tr.append(make("td","total-score",stats.count?stats.total[item.id]:"—"),make("td","rank-value",stats.count?((item.tied?"並列 ":"")+item.place):"—"));
      body.append(tr);
    });
    drawTies(groups,final);
    drawAward(stats,groups);
  }
  function drawTies(groups,final){
    const box=$("ties");
    const group=groups[0];
    const previousFocus=box.contains(document.activeElement)?document.activeElement.id:null;
    box.replaceChildren();box.hidden=!final||group.ids.length<2;
    if(box.hidden)return;
    box.append(make("h3","","冠軍加賽"));
    const explain=make("p","",group.ids.map(i=>board.teams[i]).join("、")+" 並列最高 "+group.points+" 分。請讓這些隊伍參加加賽，再選出勝隊。");
    const link=make("a","","主持人開啟加賽題");link.href="stage.html#tiebreak";explain.append(" ",link);box.append(explain);
    if(group.ids.length===3)box.append(make("p","","選出冠軍後，其餘兩隊並列第二名。"));
    const row=make("div","tie-control tie-group"),label=make("label","","加賽勝隊"),select=make("select");
    select.id="tie-champion";label.htmlFor=select.id;
    const blank=make("option","","等待加賽結果");blank.value="";select.append(blank);
    group.ids.forEach(id=>{
      const option=make("option","",board.teams[id]);option.value=id;select.append(option);
    });
    select.value=group.ranked.length?String(group.ranked[0]):"";
    select.addEventListener("change",()=>{
      board.order=select.value===""?{}:{[group.groupKey]:[Number(select.value)]};
      save();draw(false);
    });
    row.append(label,select);box.append(row);
    if(previousFocus)document.getElementById(previousFocus)?.focus({preventScroll:true});
  }
  function drawAward(stats,groups){
    const done=stats.count===4,top=groups[0],winner=done&&(!top.unresolved||top.ranked.length>0)?top.rows[0]:null;
    $("award-title").textContent=winner?"聖誕水果王":done?"冠軍加賽":"聖誕水果王";
    $("award-winner").textContent=winner?board.teams[winner.id]:done?"同分隊伍請就位":"等待頒獎";
    $("award-detail").textContent=winner?("恭喜以 "+winner.points+" 分"+(top.ids.length>1?"並在加賽中勝出，獲得冠軍！":"獲得冠軍！")):done?(top.ids.map(i=>board.teams[i]).join("、")+" 同為 "+top.points+" 分。請完成加賽並登記勝隊。"):("已完成 "+stats.count+"／4 關計分，四關結束後揭曉。");
    const list=$("award-list");list.replaceChildren();
    groups.flatMap(g=>g.rows).forEach(item=>{
      const li=make("li"),place=!stats.count?"待計分":(item.tied?"並列 ":"第 ")+item.place+(item.tied?"":" 名");
      li.append(make("span","place",place),make("span","who",board.teams[item.id]),make("span","points",stats.count?item.points+" 分":"—"));list.append(li);
    });
  }
  $("team-edit").addEventListener("click",()=>{
    nameInputs.forEach((inp,i)=>inp.value=board.teams[i]);$("name-error").textContent="";dialog.showModal();
  });
  $("name-cancel").addEventListener("click",()=>dialog.close());
  $("team-form").addEventListener("submit",event=>{
    event.preventDefault();
    const names=nameInputs.map(n=>n.value.trim());
    if(names.some(n=>!n)||new Set(names).size!==3){$("name-error").textContent="請填寫三個不同的隊名。";return;}
    board.teams=names;save();dialog.close();draw(false);
  });
  const award=$("award-view");
  const full=$("award-full");
  full.hidden=!award.requestFullscreen || !document.fullscreenEnabled;
  full.addEventListener("click",async()=>{
    try{
      if(document.fullscreenElement) await document.exitFullscreen();
      else await award.requestFullscreen();
    }catch{full.hidden=true;}
  });
  document.addEventListener("fullscreenchange",()=>{full.textContent=document.fullscreenElement?"結束全螢幕":"全螢幕";});
  async function switchView(){
    const show=["#awards","#award"].includes(window.location.hash);
    const wasOpen=!award.hidden;
    if(!show && document.fullscreenElement===award){try{await document.exitFullscreen();}catch{}}
    award.hidden=!show;document.body.classList.toggle("show-award",show);
    if(show){window.scrollTo(0,0);$("award-back").focus({preventScroll:true});}
    else if(wasOpen)$("award-launch").focus({preventScroll:true});
  }
  $("award-back").addEventListener("click",()=>{location.hash="main";});
  window.addEventListener("hashchange",switchView);
  window.addEventListener("storage",e=>{if(e.key===key){board=loadBoard();draw(true);}});
  draw(true);switchView();
}
if(typeof module!=="undefined"&&module.exports){module.exports={rawNumber,compute,groupRanks,emptyState,rounds};}
if(typeof document!=="undefined"){scoreApp();}
