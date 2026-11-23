"use strict";
const iconPaths={
 trophy:'<path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4m-4 3v4m-4 1h8"/>',
 menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',dice:'<rect x="3" y="3" width="18" height="18" rx="4"/><g fill="currentColor" stroke="none"><circle cx="8" cy="8" r="1.3"/><circle cx="16" cy="8" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="8" cy="16" r="1.3"/><circle cx="16" cy="16" r="1.3"/></g>',
 calendar:'<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3.5v4m9-4v4M4 10h16m-12 4h3"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6.5v5.8l4 2"/>',
 pin:'<path d="M19 10c0 5-7 10.7-7 10.7S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2.5"/>',
 people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-14a3 3 0 0 1 0 6m2 2a5 5 0 0 1 3 5"/>',
 play:'<path d="m7 4 12 8-12 8z"/>',book:'<path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2zM12 7v14"/>',
 slides:'<path d="M3 4h18M5 4v12h14V4m-7 12v5m-4 0 4-4 4 4"/>',mic:'<rect x="9" y="2.8" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0m-7 7v4m-4 0h8"/>',
 table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
 photo:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.3"/><path d="m4 17 5-4 3 2 4-5 4 6"/>'
};
document.querySelectorAll('[data-ico]').forEach(el=>{const icon=iconPaths[el.dataset.ico];if(icon){el.setAttribute('aria-hidden','true');el.innerHTML='<svg viewBox="0 0 24 24">'+icon+'</svg>';}});
const toggle=document.querySelector('.menubtn'),menu=document.querySelector('#mobilemenu');
function setMenu(open){menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'關閉選單':'開啟選單');}
toggle.addEventListener('click',()=>setMenu(menu.hidden));
menu.addEventListener('click',()=>setMenu(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){setMenu(false);toggle.focus();}});
window.matchMedia('(max-width:660px)').addEventListener('change',()=>setMenu(false));
