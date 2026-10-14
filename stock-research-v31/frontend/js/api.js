(function(root){
 const base=()=>root.STOCKMASTER_API_BASE||'';
 async function json(path,opts){const r=await fetch(base()+path,{headers:{Accept:'application/json'},...opts});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);return r.json();}
 root.StockAPI={summary:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/summary?exchange=${encodeURIComponent(e)}`),technicals:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/technicals?exchange=${encodeURIComponent(e)}`),financials:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/financials?exchange=${encodeURIComponent(e)}`),decision:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/decision?exchange=${encodeURIComponent(e)}`),valuation:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/valuation?exchange=${encodeURIComponent(e)}`),refresh:(t,e='TWSE')=>json(`/api/stocks/${encodeURIComponent(t)}/refresh?exchange=${encodeURIComponent(e)}`,{method:'POST'})};
})(window);
