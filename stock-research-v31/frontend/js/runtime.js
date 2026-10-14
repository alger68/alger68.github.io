(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StockRuntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function resolveApiBase(loc,configured){const h=(loc?.hostname||'').toLowerCase();return (h==='localhost'||h==='127.0.0.1')?'':String(configured||'').replace(/\/$/,'');}
 async function withFallback(primary,fallback){try{return await primary()}catch(e){const value=await fallback(e);if(value&&typeof value==='object')value._fallbackReason=e?.message||String(e);return value;}}
 return {resolveApiBase,withFallback};
});
