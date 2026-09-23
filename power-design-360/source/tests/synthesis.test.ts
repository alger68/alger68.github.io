import test from 'node:test';
import assert from 'node:assert/strict';
import {synthesize,outputBank} from '../lib/power/synthesis.ts';
import {defaultRequirements as req} from '../lib/power/requirements.ts';
import {specSchema} from '../lib/power/model.ts';
import {synthesizeRequest} from '../lib/power/api.ts';
import {newProject,projectSchema,fingerprint} from '../lib/power/model.ts';
import {candidateSummary} from '../lib/power/synthesis.ts';
import {reportHtml} from '../lib/power/report.ts';
import {calculate} from '../lib/power/engine.ts';

test('requirements alone produce complete component seeds and a valid workbench spec',()=>{
 const r=synthesize(req);assert.equal(r.blockers.length,0);assert.ok(r.candidates.length>=3);
 for(const c of r.candidates){
  assert.ok(c.lpUh>c.lrUh&&c.lmUh>0);assert.ok(c.cr1Nf>0&&c.cr2Nf>0);
  assert.ok(Number.isInteger(c.np)&&Number.isInteger(c.ns));assert.ok(c.bPeakT<=r.policy.bPeakT);
  assert.ok(c.fill<=r.policy.fillMax);assert.ok(c.fsMaxKhz<=300);assert.ok(c.holdActualMs>=req.holdMs);
  assert.ok(c.outputCapUf*.8>=c.outputCapMinUf);assert.ok(c.pfcLuh>0&&c.pfcPeakA>0);
  assert.ok(specSchema.safeParse(c.spec).success);assert.equal(c.spec.driverVccMinV,null);
 }
});
test('tighter ripple and longer hold-up automatically increase capacitance',()=>{
 const a=synthesize(req).candidates[0];
 const b=synthesize({...req,rippleMv:20}).candidates[0];
 const c=synthesize({...req,holdMs:80}).candidates[0];
 assert.ok(b.outputCapUf>a.outputCapUf);assert.ok(c.bulkUf>a.bulkUf);
});
test('component current and ESR ratings cover the full-load hold-up endpoint',()=>{
 const r=synthesize(req);
 for(const c of r.candidates){
  const dls=1-c.dutyHold,peak=req.outputA*Math.PI/(2*dls),srRms=peak*Math.sqrt(dls/2);
  assert.ok(c.secondaryPeakA>=peak*(1-1e-12));
  assert.ok(c.outputRippleRatingA>=Math.sqrt(srRms**2-req.outputA**2)*1.25*(1-1e-12));
  assert.ok(c.outputEsrMaxMohm<=req.rippleMv*.5/peak*(1+1e-12));
 }
});
test('incompatible PD power returns an actionable blocker and no fabricated design',()=>{
 const r=synthesize({...req,outputA:10});assert.equal(r.candidates.length,0);assert.match(r.blockers.join(' '),/240/);
 assert.ok(synthesize({...req,outputA:10,outputInterface:'dc'}).candidates.length>0);
});
test('output capacitor charge and RMS follow a half-sine pulse, independently integrated',()=>{
 const r=outputBank(5,48,100,.5,.24,2.5,200,1.44);
 const count=100000,T=1e-5,dt=T/count;let q=0,min=0,max=0,sum=0;
 for(let i=0;i<count;i++){const t=(i+.5)*dt;const current=t<T*.5?5*Math.PI*Math.sin(Math.PI*t/(T*.5)):0;const ic=current-5;q+=ic*dt;min=Math.min(min,q);max=Math.max(max,q);sum+=ic*ic/count;}
 assert.ok(Math.abs(r.chargeC-(max-min))<1e-12);assert.ok(Math.abs(r.rippleA-Math.sqrt(sum))<1e-8);
});
test('synthesis API accepts requirements only and returns CORS-safe versioned candidates',async()=>{
 const request=(body:unknown)=>new Request('https://example.test/api/synthesize',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://alger68.github.io'},body:JSON.stringify(body)});
 const response=await synthesizeRequest(request(req));assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://alger68.github.io');
 const data=await response.json() as ReturnType<typeof synthesize>;assert.equal(data.version,'seed-2.0');assert.ok(data.candidates[0].lpUh>0);
 assert.equal((await synthesizeRequest(request({...req,outputA:0}))).status,422);
 assert.equal((await synthesizeRequest(request({...req,hwLrUh:20}))).status,422);
});
test('generated project preserves requirements and marks its summary stale after manual editing',()=>{
 const r=synthesize(req),c=r.candidates[0],p=newProject('Generated','hwllc');p.spec=c.spec;
 p.design={modelVersion:r.version,requirements:req,candidateId:c.id,specKey:fingerprint(c.spec),summary:candidateSummary(r,c)};
 const imported=projectSchema.parse(JSON.parse(JSON.stringify(p)));assert.equal(imported.design?.requirements.rippleMv,240);
 assert.match(reportHtml(imported,calculate(imported.spec)),/對應目前規格/);
 imported.spec.outputA=4;assert.match(reportHtml(imported,calculate(imported.spec)),/歷史方案/);
});
test('automatically allocated efficiency budgets do not fail from floating rounding',()=>{
 const r=synthesize({...req,targetEfficiency:95}),c=r.candidates[0];
 assert.equal(calculate(c.spec).checks.find(x=>x.id==='efficiency')?.status,'pass');
});
