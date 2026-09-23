import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject,fingerprint,type Project} from '../lib/power/model.ts';
import {domains} from '../lib/power/catalog.ts';
import {readWorkspace,writeWorkspace} from '../lib/power/storage.ts';
test('large valid saved workspaces remain readable',()=>{
 const projects:Project[]=Array.from({length:15},()=>newProject());
 for(const p of projects)for(const d of domains)for(const [id]of d.items)p.evidence[id]={verdict:'pass',method:'review',note:'x'.repeat(4000),specKey:fingerprint(p.spec),updatedAt:new Date().toISOString()};
 const text=JSON.stringify({projects,activeId:projects[0].id});assert.ok(text.length>2_000_000);assert.equal(readWorkspace(text).projects.length,15);
});
test('a stale tab cannot overwrite a newer snapshot',()=>{
 let stored:string|null=null;const storage={getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value;}};
 const p=newProject();const first=writeWorkspace(storage,null,{projects:[p],activeId:p.id});
 const second=writeWorkspace(storage,first,{projects:[{...p,name:'Updated by tab A'}],activeId:p.id});
 assert.throws(()=>writeWorkspace(storage,first,{projects:[p],activeId:p.id}),/STORAGE_CONFLICT/);assert.equal(stored,second);
});
