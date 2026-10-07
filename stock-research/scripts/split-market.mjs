import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Preserve original rows and timestamps; no calculations or research judgments here.
export function splitSnapshot(snapshot){
 if(snapshot.schemaVersion!==1||!snapshot.datasets)throw Error('Invalid snapshot');
 const base={schemaVersion:1,checkedAt:snapshot.checkedAt,errors:snapshot.errors||[]};
 const status={...base,datasets:{}},companies={};
 const codeKeys=['Code','公司代號','SecuritiesCompanyCode','SecuritiesCode','股票代號'];
 for(const [key,ds] of Object.entries(snapshot.datasets)){
  const {rows=[],...meta}=ds;status.datasets[key]={...meta,rowCount:rows.length};
  const exchange=key.startsWith('twse')?'TWSE':key.startsWith('tpex')?'TPEX':null;
  if(!exchange)continue;
  for(const row of rows){
   const ticker=String(row[codeKeys.find(k=>row[k]!==undefined)]??'');
   if(!/^[0-9A-Z]{4,8}$/.test(ticker))continue;
   const path=`${exchange}/${ticker}.json`;
   const company=companies[path]??=({...base,subject:{exchange,ticker},datasets:{}});
   // Same first-match semantics as market.js; never combine exchanges.
   company.datasets[key]??={...meta,rows:[row]};
  }
 }
 return {status,companies};
}
export async function writeShards(snapshot,directory=new URL('../data/',import.meta.url)){
 const {status,companies}=splitSnapshot(snapshot);
 const root=new URL('companies/',directory);
 await fs.rm(root,{recursive:true,force:true});
 for(const exchange of ['TWSE','TPEX'])await fs.mkdir(new URL(exchange+'/',root),{recursive:true});
 for(const [path,data] of Object.entries(companies))await fs.writeFile(new URL(path,root),JSON.stringify(data));
 await fs.writeFile(new URL('market-status.json',directory),JSON.stringify(status));
 console.log('Small snapshots:',Object.keys(companies).length,'companies; status',Buffer.byteLength(JSON.stringify(status)),'bytes');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 await writeShards(JSON.parse(await fs.readFile(new URL('../data/market.json',import.meta.url),'utf8')));
}
