(function(root){
  'use strict';
  const ids=['MM','GOOAYE','MANNY','MARKS','MANUS','MINERVINI','BUFFETT'];
  const num=v=>v===null||v===undefined||String(v).trim()===''?null:Number.isFinite(Number(v))?Number(v):null;
  const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').replaceAll('臺','台').toLowerCase();
  const E={
    num,normalize,
    price(eps,pe){const e=num(eps),p=num(pe);return e>0&&p>0&&Number.isFinite(e*p)?e*p:null;},
    rr(entry,stop,target,basis){const e=num(entry),s=num(stop),t=num(target);return basis===true&&s>0&&e>s&&t>e?(t-e)/(e-s):null;},
    classify(r){
      if(r.removed)return '已移除';if(r.paused)return '已暫停';
      const g=r.gates||{};
      if(g.identity!==true)return '待確認';
      if(r.risk===true||g.thesis===false)return '風險升高';
      if(g.core!==true||g.thesis===null||g.thesis===undefined)return '資料不足';
      if(g.valuation===null||g.valuation===undefined||g.trigger===null||g.trigger===undefined)return '資料不足';
      if(g.valuation===false||g.trigger===false)return '等待條件';
      return g.thesis===true&&g.valuation===true&&g.trigger===true?'條件符合':'資料不足';
    },
    methodsFor(asset,horizon){if(asset==='ETF')return ['MM','MARKS','MANUS'];return horizon==='long'?['MM','MARKS','MANUS','BUFFETT']:horizon==='trend'?['MM','MARKS','MANUS','MINERVINI']:['MM','GOOAYE','MANNY','MARKS','MANUS'];},
    changeConfig(r,c){if(!['auto','manual'].includes(c.mode)||!Array.isArray(c.selected)||c.selected.some(x=>!ids.includes(x))||(c.mode==='manual'&&!c.selected.length))throw new Error('請至少選一種方法');return {...r,config:{mode:c.mode,selected:[...new Set(c.selected)]},revision:(r.revision||1)+1,confirmedKey:null};},
    search(entries,q){const n=normalize(q);if(!n)return [];return entries.filter(e=>[e.name,e.ticker,e.fullName,e.english].some(v=>normalize(v).includes(n))).sort((a,b)=>Number(normalize(b.ticker)===n||normalize(b.name)===n)-Number(normalize(a.ticker)===n||normalize(a.name)===n)).slice(0,12);}
  };
  if(typeof module!=='undefined')module.exports=E;else root.ResearchEngine=E;
})(globalThis);
