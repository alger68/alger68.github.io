(function(root){'use strict';
const DEFAULT=['price','revenue','financials','announcements','presentation','news','verification','analysis','valuation'];
function create(steps=DEFAULT){return {steps:Object.fromEntries(steps.map(id=>[id,{id,status:'pending',changed:false,error:null}])),order:[...steps]};}
function patch(state,id,next){if(!state.steps[id])return state;return {...state,steps:{...state.steps,[id]:{...state.steps[id],...next}}};}
const start=(s,id)=>patch(s,id,{status:'running',error:null});
function finish(s,id,result={}){return patch(s,id,{status:result.stale?'warning':'success',changed:!!result.changed,stale:!!result.stale,error:result.stale?'stale data':null});}
function fail(s,id,error,severity='failed'){return patch(s,id,{status:severity==='warning'?'warning':'failed',error:String(error||'unknown error')});}
const skip=(s,id,reason='not available')=>patch(s,id,{status:'skipped',error:reason});
function summary(s){const xs=s.order.map(id=>s.steps[id]);const terminal=xs.filter(x=>['success','warning','failed','skipped'].includes(x.status));const done=terminal.length;const warningCount=xs.filter(x=>x.status==='warning').length,failedCount=xs.filter(x=>x.status==='failed').length,successCount=xs.filter(x=>x.status==='success').length;return {percent:xs.length?Math.round(done/xs.length*100):100,status:failedCount?'failed':warningCount?'warning':done===xs.length?'success':'running',successCount,warningCount,failedCount,changedCount:xs.filter(x=>x.changed).length};}
const R={DEFAULT,create,start,finish,fail,skip,summary};if(typeof module!=='undefined')module.exports=R;else root.RefreshPipeline=R;})(globalThis);
