const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const API=fs.readFileSync(path.join(ROOT,'js/api.js'),'utf8');
const DASH=fs.readFileSync(path.join(ROOT,'js/dashboard.js'),'utf8');
const HTML=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');

test('frontend API client exposes history news watchlist and market overview',()=>{
 for(const name of ['history:','news:','watchlist:','market:']) assert.ok(API.includes(name),name);
});

test('dashboard controller renders all data-backed panels rather than placeholders',()=>{
 for(const call of ['StockAPI.history','StockAPI.news','StockAPI.watchlist','StockAPI.market']) assert.ok(DASH.includes(call),call);
 for(const id of ['price-chart','news-body','watchlist-body','market-body','fundamental-body']) assert.ok(HTML.includes(`id="${id}"`),id);
});
