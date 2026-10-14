const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const API=fs.readFileSync(path.join(ROOT,'js/api.js'),'utf8');
const DASH=fs.readFileSync(path.join(ROOT,'js/dashboard.js'),'utf8');
const HTML=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');

test('frontend API client exposes search history news watchlist mutations and market overview',()=>{
 for(const name of ['search:','history:','news:','watchlist:','addWatchlist:','deleteWatchlist:','market:']) assert.ok(API.includes(name),name);
});

test('dashboard controller renders all data-backed panels rather than placeholders',()=>{
 for(const call of ['StockAPI.search','StockAPI.history','StockAPI.news','StockAPI.watchlist','StockAPI.market']) assert.ok(DASH.includes(call),call);
 for(const id of ['price-chart','news-body','watchlist-body','market-body','market-status','fundamental-body']) assert.ok(HTML.includes(`id="${id}"`),id);
});

test('watchlist has add remove and click-to-load interactions',()=>{
 assert.ok(HTML.includes('id="watch-add-btn"'));
 assert.ok(DASH.includes('StockAPI.addWatchlist'));
 assert.ok(DASH.includes('StockAPI.deleteWatchlist'));
 assert.ok(DASH.includes("closest('.watch-load')"));
 assert.ok(DASH.includes("closest('.watch-remove')"));
});

test('market panel surfaces Taishin Nova provider status',()=>{
 assert.ok(DASH.includes("ps.provider==='taishin_nova'"));
 assert.ok(DASH.includes('等待登入/行情連線'));
});
