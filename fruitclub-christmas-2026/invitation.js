'use strict';
(() => {
  const directory = new URL('./', location.href);
  const sessionKey = 'fruitclub-invitation:' + directory.pathname;
  const lockEvent = sessionKey + ':lock';
  const form = document.getElementById('unlock-form');
  const field = document.getElementById('invite-code');
  const button = document.getElementById('unlock-button');
  const status = document.getElementById('invite-status');
  const toggle = document.getElementById('show-code');
  let packageRequest, unlocked = false;
  const createdURLs = new Set();
  let observer;
  const from64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const as64 = bytes => btoa(String.fromCharCode(...bytes));
  const readCache = () => { try { return JSON.parse(sessionStorage.getItem(sessionKey)); } catch { return null; } };
  function forgetCache() { try { sessionStorage.removeItem(sessionKey); } catch {} }
  function busy(active) {
    field.disabled = active; button.disabled = active; toggle.disabled = active;
    form.setAttribute('aria-busy', String(active));
    button.textContent = active ? '正在開啟…' : '✦ 開啟邀請';
  }
  function curtain() {
    if (!unlocked) return;
    unlocked = false;
    observer?.disconnect();
    document.body.replaceChildren();
    document.documentElement.style.backgroundColor = '#10382f';
    delete window.fruitResource;
    for (const url of createdURLs) URL.revokeObjectURL(url);
    createdURLs.clear();
  }
  function lock(announce) {
    forgetCache();
    if (announce) {
      try { localStorage.setItem(lockEvent, String(Date.now()) + ':' + Math.random()); } catch {}
    }
    curtain();
    location.reload();
  }
  addEventListener('storage', event => {
    if (event.key === lockEvent) {
      forgetCache();
      if (unlocked) lock(false);
    }
  });
  addEventListener('pagehide', event => {
    // Cached history entries must not display the previously decrypted DOM.
    if (event.persisted) curtain();
  });
  addEventListener('pageshow', event => {
    if (event.persisted) location.reload();
  });
  async function getPackage() {
    if (packageRequest) return packageRequest;
    packageRequest = (async () => {
      const response = await fetch(new URL('sealed.json', directory), {cache:'no-store'});
      if (!response.ok) throw new Error('fetch');
      const manifest = await response.json();
      if (manifest.version !== 1 || !Array.isArray(manifest.parts) || !manifest.parts.length ||
          manifest.parts.length > 2000 || !manifest.parts.every(path => /^sealed\/[a-f0-9]+-\d{3,}\.bin$/.test(path))) throw new Error('format');
      const chunks = await Promise.all(manifest.parts.map(async part => {
        const response = await fetch(new URL(part, directory));
        if (!response.ok) throw new Error('fetch');
        return new Uint8Array(await response.arrayBuffer());
      }));
      const bytes = new Uint8Array(chunks.reduce((sum,chunk)=>sum+chunk.length,0));
      let offset=0;
      for (const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
      if (bytes.length < 56 || new TextDecoder().decode(bytes.subarray(0,7)) !== 'FRUIT26' || bytes[7] !== 1) throw new Error('format');
      const iterations = new DataView(bytes.buffer).getUint32(8);
      if (iterations !== 600000) throw new Error('format');
      return {salt:bytes.subarray(12,28), iv:bytes.subarray(28,40), header:bytes.subarray(0,40), cipher:bytes.subarray(40), iterations};
    })().catch(error=>{packageRequest=undefined;throw error;});
    return packageRequest;
  }
  async function derive(code, pkg) {
    const normalized = code.toUpperCase().replace(/[\s-]/g,'');
    const material = await crypto.subtle.importKey('raw',new TextEncoder().encode(normalized),'PBKDF2',false,['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:pkg.salt,iterations:pkg.iterations},material,256));
  }
  function hydrate(files) {
    const path = location.pathname.split('/').pop() || 'index.html';
    const page = Object.hasOwn(files,path) && /\.html$/.test(path) ? path : 'index.html';
    if (!files[page]?.text) throw new Error('content');
    const cache = new Map();
    function filePath(value, base='') {
      if (!value || /^(?:#|\?|[a-z][a-z\d+.\-]*:|\/\/)/i.test(value)) return null;
      const url = new URL(value, new URL(base, directory));
      if (url.origin !== directory.origin || !url.pathname.startsWith(directory.pathname)) return null;
      const key = decodeURIComponent(url.pathname.slice(directory.pathname.length));
      return Object.hasOwn(files,key) ? key : null;
    }
    function resource(value, base='') {
      const key=filePath(value,base);
      if (!key || /\.html$/.test(key)) return value;
      if (cache.has(key)) return cache.get(key);
      const item=files[key];
      const body = typeof item.text==='string' ? item.text : from64(item.data);
      const url=URL.createObjectURL(new Blob([body],{type:item.mime}));
      cache.set(key,url);createdURLs.add(url);return url;
    }
    function cssURLs(css, path) {
      return css.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi,(whole,q,name)=>{
        const resolved=resource(name,path);
        return resolved===name?whole:'url("'+resolved+'")';
      });
    }
    function rewrite(element) {
      for (const attribute of ['src','href','poster']) {
        if (!element.hasAttribute?.(attribute)) continue;
        const raw=element.getAttribute(attribute),resolved=resource(raw);
        if (raw!==resolved) element.setAttribute(attribute,resolved);
      }
    }
    window.fruitResource=resource;
    // Template documents keep subresources inert while their URLs are translated.
    const template=document.createElement('template');
    const parser=new DOMParser();
    const source=files[page].text.replace(/\b(src|poster)=(["'])([^"']+)\2/gi,(all,attr,quote,value)=>{
      const key=filePath(value);
      if (!key || /\.js$/i.test(key)) return all;
      return attr+'='+quote+resource(value)+quote;
    });
    const doc=parser.parseFromString(source,'text/html');
    const scripts=Array.from(doc.querySelectorAll('script'));
    scripts.forEach(script=>script.remove());
    for(const link of doc.querySelectorAll('link[rel~="stylesheet"]')) {
      const cssPath=filePath(link.getAttribute('href'));
      if(!cssPath) throw new Error('style');
      const style=doc.createElement('style');
      style.textContent=cssURLs(files[cssPath].text,cssPath);
      link.replaceWith(style);
    }
    for(const element of doc.querySelectorAll('[src],[href],[poster]')) rewrite(element);
    for(const attr of [...document.documentElement.attributes]) document.documentElement.removeAttribute(attr.name);
    for(const attr of doc.documentElement.attributes) document.documentElement.setAttribute(attr.name,attr.value);
    const originalCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const keep= originalCSP ? [originalCSP] : [];
    document.head.replaceChildren(...keep,...Array.from(doc.head.childNodes,node=>document.importNode(node,true)));
    for(const attr of [...document.body.attributes]) document.body.removeAttribute(attr.name);
    for(const attr of doc.body.attributes) document.body.setAttribute(attr.name,attr.value);
    template.content.append(...Array.from(doc.body.childNodes,node=>document.importNode(node,true)));
    document.body.replaceChildren(template.content);
    observer=new MutationObserver(changes=>{
      for(const change of changes) {
        if(change.type==='attributes') { rewrite(change.target);continue; }
        for(const node of change.addedNodes) if(node.nodeType===1) {
          rewrite(node);node.querySelectorAll?.('[src],[href],[poster]').forEach(rewrite);
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href','poster']});
    const lockStyle=document.createElement('style');
    lockStyle.textContent='.invitation-lock{display:inline-flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;cursor:pointer;line-height:1.2;color:#194437;background:#fff7e8;border:1px solid #aeb9a4;border-radius:5px;font:650 13px/1.2 system-ui,sans-serif;min-height:35px;padding:6px 10px}.invitation-lock:hover{background:#eee7d6}.invitation-lock:focus-visible{outline:3px solid #d9a548;outline-offset:3px}.invitation-lock-float{position:fixed;z-index:4;right:12px;bottom:12px}.award-top .invitation-lock{margin:0}.top nav,.sc-nav nav{align-items:center;flex-wrap:wrap}@media(max-width:430px){.invitation-lock{padding:5px 7px;min-height:31px}.top nav,.sc-nav nav{gap:8px}}@media print{.invitation-lock{display:none!important}}';
    document.head.append(lockStyle);
    function addLock(parent,floating=false) {
      const control=document.createElement('button');
      control.type='button';control.className='invitation-lock'+(floating?' invitation-lock-float':'');
      control.textContent='鎖定';control.setAttribute('aria-label','鎖定邀請並離開');
      control.onclick=()=>lock(true);parent.append(control);
    }
    const holder=document.querySelector('.masthead .navbuttons,.top .topin nav,.sc-nav nav');
    addLock(holder||document.body,!holder);
    const award=document.querySelector('.award-top');if(award)addLock(award);
    unlocked = true;
    return scripts.reduce((prior,source)=>prior.then(()=>new Promise((resolve,reject)=>{
      const name=source.getAttribute('src');
      if(!filePath(name)) {reject(new Error('script'));return;}
      const script=document.createElement('script');script.src=resource(name);script.async=false;
      script.onload=resolve;script.onerror=()=>reject(new Error('script'));
      document.head.append(script);
    })),Promise.resolve()).then(()=>{
      if(location.hash && !['stage.html','score.html'].includes(page)) {
        let anchor;try{anchor=decodeURIComponent(location.hash.slice(1));}catch{}
        document.getElementById(anchor)?.scrollIntoView();
      }
    });
  }
  async function openInvitation(code, saved) {
    busy(true);status.textContent=saved?'正在開啟邀請…':'正在核對邀請密碼…';
    let pkg,raw,salt;
    try {
      if (!window.crypto?.subtle) throw new Error('insecure');
      pkg=await getPackage();salt=as64(pkg.salt);
      if(saved && saved.salt!==salt) {forgetCache();status.textContent='';return;}
      raw=saved?from64(saved.key):await derive(code,pkg);
      const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['decrypt']);
      let plain;
      try { plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:pkg.iv,additionalData:pkg.header,tagLength:128},key,pkg.cipher); }
      catch {
        forgetCache();
        field.setAttribute('aria-invalid','true');
        status.textContent=saved?'請重新輸入邀請密碼。':'邀請密碼不符合，請再試一次。';
        return;
      }
      const content=JSON.parse(new TextDecoder().decode(plain));
      if(content.version!==1||!content.files) throw new Error('content');
      // Only a derived key is retained, scoped to this origin, path and tab session.
      try {sessionStorage.setItem(sessionKey,JSON.stringify({salt,key:as64(raw)}));}catch{}
      field.value='';await hydrate(content.files);
    } catch(error) {
      if(unlocked) {forgetCache();curtain();location.reload();return;}
      if(saved)forgetCache();
      status.textContent=error.message==='insecure'?'請使用支援安全連線的瀏覽器開啟活動網址。':'邀請內容暫時無法載入，請檢查連線後重試。';
    } finally {
      if(raw instanceof Uint8Array)raw.fill(0);
      if(!unlocked) {busy(false);if(!saved)field.focus();}
    }
  }
  toggle.onclick=()=>{
    const show=field.type==='password';field.type=show?'text':'password';
    toggle.textContent=show?'隱藏':'顯示';toggle.setAttribute('aria-pressed',String(show));
    toggle.setAttribute('aria-label',show?'隱藏密碼':'顯示密碼');
  };
  field.addEventListener('input',()=>{field.removeAttribute('aria-invalid');status.textContent='';});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!button.disabled&&field.value.trim())openInvitation(field.value,null);
  });
  const saved=readCache();
  if(saved && typeof saved.key==='string' && typeof saved.salt==='string')openInvitation(null,saved);
})();
