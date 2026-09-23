import { domains, limitations } from './catalog.ts';
import { reviewStatus } from './review.ts';
import type { Project, Result } from './model.ts';
const escape = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function reportHtml(project: Project, result: Result) {
  const rows = Object.entries(result.metrics).map(([k,v]) => `<tr><td>${escape(k)}</td><td>${v===null?'尚未建立模型':escape(v.toFixed(4))}</td></tr>`).join('');
  const checks = result.checks.map(c=>`<tr><td>${escape(c.title)}</td><td>${escape(c.status)}</td><td>${escape(c.detail)}</td></tr>`).join('');
  const evidence = domains.map(d=>`<h3>${escape(d.name)}</h3><table>${d.items.map(([id,title])=>`<tr><td>${escape(title)}</td><td>${escape(reviewStatus(project,id))}</td><td>${escape(project.evidence[id]?.note??'尚未提供證據')}<br>${escape(project.evidence[id]?.method??'')} ${escape(project.evidence[id]?.updatedAt??'')}</td></tr>`).join('')}</table>`).join('');
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>${escape(project.name)} — 設計報告</title><style>body{font:15px/1.7 system-ui,sans-serif;color:#172339;max-width:960px;margin:36px auto;padding:0 24px}h1,h2{letter-spacing:-.02em}table{border-collapse:collapse;width:100%;margin:16px 0;table-layout:fixed}td,th{border:1px solid #d7dfe8;padding:8px;overflow-wrap:anywhere;text-align:left}td:first-child{width:32%}small{color:#57677c}.note{background:#eff4fa;padding:16px}pre{white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0}tr{break-inside:avoid}h2,h3{break-after:avoid}}</style><h1>${escape(project.name)}</h1><p>Power Design 360 · 引擎 ${escape(result.version)} · ${escape(new Date().toISOString())}</p><p>${escape(project.description)}</p><p class="note">${escape(limitations)}<br>使用者填寫的證據未經第三方查核。本報告不是認證或簽核。</p><h2>解析檢核</h2><table>${checks}</table><h2>計算值（欄位名稱含單位）</h2><table>${rows}</table><p>efficiency 為 %；ratio、k、q、gainTarget、gainHold、boostDuty 無單位；rac 為 Ω。</p><h2>輸入規格</h2><pre>${escape(JSON.stringify(project.spec,null,2))}</pre><h2>工程審查與證據</h2>${evidence}<p><small>原始參數與證據請另外匯出專案 JSON 保存。</small></p></html>`;
}
export function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text],{type}));
  const a = document.createElement('a'); a.href=url; a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
