"use strict";

const minimumTeams = 2;
const maximumTeams = 8;
const defaultNames = ["第一隊", "第二隊", "第三隊", "第四隊", "第五隊", "第六隊", "第七隊", "第八隊"];
const rounds = [
  {name:"聖誕大家來找碴", short:"大家找碴", ordinal:"第一關", unit:"處", max:6, hint:"90 秒找出兩張圖的差異。記下各組圈對的處數，每組最多 6 處。"},
  {name:"聖誕力拔山河", short:"力拔山河", ordinal:"第二關", unit:"勝"},
  {name:"名人大聯想", short:"名人大聯想", ordinal:"第三關", unit:"分", max:10, hint:"各組同時作答。第一張圖猜中得 2 分，第二張才猜中得 1 分；同題多組答對，各自得分。請輸入每組五題合計，最高 10 分。"},
  {name:"馴鹿高速迷走", short:"馴鹿迷走", ordinal:"第四關", unit:"步", max:Number.MAX_SAFE_INTEGER, hint:"每組六棒原地快走，每棒 30 秒。輸入各組六棒合計的有效步數。"}
];
const key = "fruit-club-christmas-2026-scores-v2";
const legacyKey = "fruit-club-christmas-2026-scores-v1";
const emptyState = () => ({
  teams:defaultNames.slice(0,3), raw:rounds.map(()=>Array(3).fill("")), order:{}, active:0
});

function roundInfo(index, count){
  const round=rounds[index];
  if(index!==1)return round;
  const matches=count*(count-1), max=2*(count-1);
  return {...round, max, matches, hint:`各組兩兩對戰，成人與兒童各一輪，共 ${matches} 場。每場記一組獲勝，各組最多 ${max} 勝。`};
}

function rawNumber(value, round) {
  const text=String(value).trim();
  if(!/^\d+$/.test(text)||text.length>16)return null;
  const n=Number(text);
  return Number.isSafeInteger(n)&&n<=round.max?n:null;
}

function compute(raw){
  const countTeams=raw[0].length;
  const total=Array(countTeams).fill(0);
  const details=raw.map((row,index)=>{
    const round=roundInfo(index,countTeams);
    const vals=row.map(v=>rawNumber(v,round));
    const complete=vals.every(v=>v!==null);
    const invalidSum=index===1&&complete&&vals.reduce((acc,v)=>acc+v,0)!==round.matches;
    const ready=complete&&!invalidSum;
    const points=vals.map((v,id)=>{
      if(!ready)return null;
      const score=countTeams-vals.filter(other=>other>v).length;
      total[id]+=score;
      return score;
    });
    return {vals,ready,points,invalidSum};
  });
  return {details,count:details.filter(d=>d.ready).length,total};
}

function groupRanks(total,order,final){
  const highestFirst=[...new Set(total)].sort((a,b)=>b-a);
  let next=1;
  return highestFirst.map(points=>{
    const ids=total.map((_,id)=>id).filter(id=>total[id]===points);
    const groupKey=ids.join("-"), start=next;
    const previousWinner=order[groupKey]?.[0];
    const ranked=final&&start===1&&ids.length>1&&ids.includes(previousWinner)?[previousWinner]:[];
    const rest=ids.filter(id=>!ranked.includes(id));
    const unresolved=rest.length>1;
    const rows=[...ranked,...rest].map((id,j)=>({
      id, points, place:start+Math.min(j,ranked.length), tied:unresolved&&rest.includes(id)
    }));
    next+=ids.length;
    return {ids,start,points,ranked,rest,unresolved,rows,groupKey};
  });
}

function restore(stored){
  const state=emptyState();
  if(!stored||!Array.isArray(stored.teams))return state;
  const count=stored.teams.length;
  if(count<minimumTeams||count>maximumTeams)return state;
  const names=stored.teams.map((n,i)=>typeof n==="string"&&n.trim()?n.trim().slice(0,18):defaultNames[i]);
  state.teams=new Set(names).size===count?names:defaultNames.slice(0,count);
  state.raw=rounds.map((_,round)=>state.teams.map((_,id)=>{
    const v=stored.raw?.[round]?.[id];
    return typeof v==="string"?v.slice(0,24):"";
  }));
  if(stored.order&&typeof stored.order==="object"&&!Array.isArray(stored.order))state.order=stored.order;
  if(Number.isInteger(stored.active)&&stored.active>=0&&stored.active<rounds.length)state.active=stored.active;
  return state;
}

function loadBoard(storage){
  // The v1 record stays intact when the first v2 change is saved.
  for(const name of [key,legacyKey]){
    try{
      const value=storage.getItem(name);
      if(value!==null){
        const data=JSON.parse(value);
        if(Array.isArray(data?.teams)&&data.teams.length>=minimumTeams&&data.teams.length<=maximumTeams)return restore(data);
      }
    }catch{}
  }
  return emptyState();
}

function resizeBoard(board,names){
  const updated={...board, teams:[...names]};
  if(names.length!==board.teams.length){
    updated.raw=board.raw.map(row=>names.map((_,id)=>row[id]??""));
    updated.order={};
  }
  return updated;
}

function scoreApp(){
  const $=id=>document.getElementById(id);
  let storage;
  try{storage=window.localStorage;}catch{}
  let board=loadBoard(storage);
  let savedRecord;
  function currentRecord(){
    try{return storage.getItem(key);}catch{return undefined;}
  }
  savedRecord=currentRecord();
  const teamIds=()=>board.teams.map((_,id)=>id);
  const requestedRound=new URLSearchParams(window.location.search).get("round");
  const requestedIndex=["spot","pull","guess","relay"].indexOf(requestedRound);
  if(requestedIndex>=0)board.active=requestedIndex;
  const labels=[],inputs=[],units=[];
  const roundButtons=[];
  const dialog=$("team-dialog");
  let nameInputs=[],draftNames=[],draftCount=0;
  function save(){
    try{
      const record=JSON.stringify(board);
      storage.setItem(key,record);
      savedRecord=record;
      $("save-caption").textContent="成績儲存在這部裝置";
    }catch{$("save-caption").textContent="本次成績僅保留在此頁，離開前請記下分數。";}
  }
  // Another tab can save while a dialog is open or just before a keystroke.
  // Apply the latest values before editing and review any changed roster.
  function readPeer(){
    const record=currentRecord();
    if(record===savedRecord)return false;
    const active=board.active;
    board=loadBoard(storage);
    board.active=active;
    savedRecord=record;
    return true;
  }
  function acceptRecentScores(){
    const priorNames=board.teams.join("\n");
    if(!readPeer())return true;
    if(priorNames===board.teams.join("\n")&&!dialog.open){
      draw(true);
      return true;
    }
    if(dialog.open)dialog.close();
    draw(true);
    $("record-status").textContent="另一個分頁剛更新了計分板。請確認目前的組別與成績，再繼續登記。";
    return false;
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
      if(!acceptRecentScores())return;
      board.active=index;
      save();draw(true);
    });
    roundButtons.push(button);$("round-picks").append(button);
  });
  function buildTeamFields(){
    $("team-entry").replaceChildren();
    labels.length=inputs.length=units.length=0;
    teamIds().forEach(id=>{
      const row=make("div","input-row"),label=make("label","team-name"),input=make("input","digits"),unit=make("span","unit");
      input.id="raw-"+id;label.htmlFor=input.id;input.type="text";input.inputMode="numeric";input.autocomplete="off";input.maxLength=16;input.placeholder="—";
      input.setAttribute("aria-describedby","round-hint record-status");
      input.addEventListener("input",()=>{
        const normalized=input.value.replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0));
        if(normalized!==input.value)input.value=normalized;
        if(!acceptRecentScores())return;
        input.value=normalized;
        board.raw[board.active][id]=normalized;
        board.order={};
        save();draw(false);
      });
      labels.push(label);inputs.push(input);units.push(unit);
      row.append(label,input,unit);$("team-entry").append(row);
    });
  }
  function draw(replaceInputs){
    const count=board.teams.length;
    const active=board.active,round=roundInfo(active,count);
    if(inputs.length!==count)buildTeamFields();
    $("team-edit").textContent="管理組別（"+count+" 組）";
    $("points-rule").textContent="本場 "+count+" 組，單關第一名 "+count+" 分，之後每一名少 1 分。同分並列、下一名跳號。";
    const stats=compute(board.raw);
    const current=stats.details[active];
    $("round-number").textContent=round.ordinal;
    $("round-name").textContent=round.name;
    $("round-hint").textContent=round.hint;
    roundButtons.forEach((b,i)=>b.setAttribute("aria-pressed",String(i===active)));
    teamIds().forEach(id=>{
      labels[id].textContent=board.teams[id];
      if(replaceInputs)inputs[id].value=board.raw[active][id];
      inputs[id].setAttribute("aria-invalid",String(!!board.raw[active][id].trim()&&current.vals[id]===null));
      units[id].textContent=round.unit;
    });
    const bad=current.vals.some((v,id)=>v===null&&board.raw[active][id].trim());
    const upper=round.max===Number.MAX_SAFE_INTEGER?"":("，最多 "+round.max+" "+round.unit);
    $("record-status").textContent=bad?("請輸入 0 以上的整數"+upper+"。"):current.invalidSum?("共 "+round.matches+" 場，全部組別的勝場合計應為 "+round.matches+"，請核對。"):current.ready?"本關積分已換算完成。":("已登記 "+current.vals.filter(v=>v!==null).length+"／"+count+" 組，全部填完即換算積分。");
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
    if(group.ids.length>2)box.append(make("p","","選出冠軍後，其餘同分組別並列第二名。"));
    const row=make("div","tie-control tie-group"),label=make("label","","加賽勝隊"),select=make("select");
    select.id="tie-champion";label.htmlFor=select.id;
    const blank=make("option","","等待加賽結果");blank.value="";select.append(blank);
    group.ids.forEach(id=>{
      const option=make("option","",board.teams[id]);option.value=id;select.append(option);
    });
    select.value=group.ranked.length?String(group.ranked[0]):"";
    select.addEventListener("change",()=>{
      if(readPeer()){
        draw(true);$("record-status").textContent="其他分頁已更新成績，請確認加賽隊伍後再登記。";return;
      }
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
      const li=make("li"),place=!stats.count?"待計分":(item.tied?"並列第 ":"第 ")+item.place+" 名";
      li.append(make("span","place",place),make("span","who",board.teams[item.id]),make("span","points",stats.count?item.points+" 分":"—"));list.append(li);
    });
  }
  function refreshRoster(){
    nameInputs=[];
    const fields=$("name-fields");
    fields.replaceChildren();
    for(let id=0;id<draftCount;id++){
      const row=make("div","name-row"),label=make("label","","第 "+(id+1)+" 組"),input=make("input");
      label.htmlFor="nickname-"+id;input.id=label.htmlFor;
      input.value=draftNames[id];input.required=true;input.maxLength=18;input.autocomplete="off";
      input.addEventListener("input",()=>{draftNames[id]=input.value;$("name-error").textContent="";});
      row.append(label,input);fields.append(row);nameInputs.push(input);
    }
    $("team-count").textContent=draftCount+" 組";
    $("team-remove").disabled=draftCount<=minimumTeams;
    $("team-add").disabled=draftCount>=maximumTeams;
    const dropped=board.teams.filter((_,id)=>id>=draftCount&&board.raw.some(row=>row[id]!==""));
    $("remove-confirm").hidden=!dropped.length;
    $("confirm-remove").checked=false;
    $("confirm-text").textContent="確認移除「"+dropped.join("、")+"」及其已登記的成績。";
    const adjusted=draftCount!==board.teams.length&&board.raw.some(row=>row.some(v=>v!==""));
    $("roster-note").textContent=adjusted?"儲存後會按新組數重算各關積分。請補齊新增組別的成績，並核對拉力賽勝場。":"可調整為 2–8 組。減少組別時，會從最後一組開始移除。";
    $("name-error").textContent="";
  }
  $("team-edit").addEventListener("click",()=>{
    if(readPeer())draw(true);
    draftNames=[...board.teams];draftCount=draftNames.length;
    refreshRoster();dialog.showModal();
  });
  $("team-add").addEventListener("click",()=>{
    if(draftCount>=maximumTeams)return;
    if(!draftNames[draftCount]){
      const existing=new Set(draftNames.slice(0,draftCount).map(n=>n.trim()));
      draftNames[draftCount]=!existing.has(defaultNames[draftCount])?defaultNames[draftCount]:defaultNames.find(n=>!existing.has(n));
    }
    draftCount++;refreshRoster();nameInputs[draftCount-1].focus();
  });
  $("team-remove").addEventListener("click",()=>{
    if(draftCount<=minimumTeams)return;
    draftCount--;refreshRoster();
    if($("team-remove").disabled)$("team-add").focus();
  });
  $("name-cancel").addEventListener("click",()=>dialog.close());
  $("team-form").addEventListener("submit",event=>{
    event.preventDefault();
    if(!acceptRecentScores())return;
    const names=draftNames.slice(0,draftCount).map(n=>n.trim());
    if(names.some(n=>!n)||new Set(names).size!==names.length){$("name-error").textContent="請為每組填寫不同的名稱。";return;}
    if(!$("remove-confirm").hidden&&!$("confirm-remove").checked){
      $("name-error").textContent="請先勾選確認，或取消以保留原有成績。";$("confirm-remove").focus();return;
    }
    board=resizeBoard(board,names);
    save();dialog.close();draw(true);
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
  window.addEventListener("storage",e=>{
    if(e.key!==key&&e.key!==null)return;
    if(!readPeer())return;
    if(dialog.open)dialog.close();
    draw(true);
  });
  draw(true);switchView();
}
if(typeof module!=="undefined"&&module.exports){module.exports={rawNumber,compute,groupRanks,emptyState,rounds,roundInfo,restore,resizeBoard,loadBoard,key,legacyKey};}
if(typeof document!=="undefined"){scoreApp();}
