import test from 'node:test';
import assert from 'node:assert/strict';
import {synthesize} from '../lib/power/synthesis.ts';
import {defaultRequirements as req,requirementsSchema,pdOutputPreset} from '../lib/power/requirements.ts';
import {rippleFactor,selectOutputCaps} from '../lib/power/component-catalog.ts';
import {candidateSummary} from '../lib/power/synthesis.ts';
import {newProject,projectSchema,fingerprint} from '../lib/power/model.ts';

test('legacy requirements default to one output without guessed physical limits',()=>{
 const {additionalOutputs,space,coolingBudgetW,...legacy}=req;
 const p=requirementsSchema.parse(legacy);
 assert.deepEqual(p.additionalOutputs,[]);assert.equal(p.space,null);assert.equal(p.coolingBudgetW,null);
});
test('PD preset uses each voltage power budget and sizes for higher low-voltage current',()=>{
 const base={...req,outputA:2},additionalOutputs=pdOutputPreset(base);
 assert.deepEqual(additionalOutputs.slice(0,3).map(p=>p.currentA),[3,3,3]);
 assert.equal(additionalOutputs.find(p=>p.voltageV===20)!.currentA,4.8);
 for(const p of additionalOutputs)assert.ok(p.voltageV*p.currentA<=96+1e-9);
 const r=synthesize({...base,additionalOutputs});assert.ok(r.candidates.length>0);
 const c=r.candidates[0];
 assert.ok(c.envelope.cases.some(p=>p.outputV===20&&p.outputA===4.8));
 assert.ok(c.outputCapMinUf>=2500-1e-9);
 assert.ok(c.secondaryRmsA>=c.envelope.cases.find(p=>p.outputV===20&&p.outputA===4.8)!.secondaryRmsA);
});
test('additional output ratings drive shared hardware and expose control-mode gaps',()=>{
 const r=synthesize({...req,outputInterface:'dc',additionalOutputs:[{voltageV:12,currentA:15}]});
 assert.ok(r.candidates.length>0);
 for(const c of r.candidates){
  assert.ok(c.envelope.cases.some(x=>x.outputV===12&&x.outputA===15));
  assert.ok(c.envelope.modeLimited>0);
  for(const x of c.envelope.cases){
   assert.ok(c.primaryRmsA>=x.primaryRmsA-1e-9);assert.ok(c.secondaryRmsA>=x.secondaryRmsA-1e-9);
   assert.ok(c.bPeakT>=x.bPeakT-1e-9);assert.ok(c.outputCapMinUf>=x.outputMinUf-1e-9);
  }
 }
});
test('continuous-pulse envelope obeys independent charge, flux and RMS identities',()=>{
 const r=synthesize(req),c=r.candidates[0];
 assert.equal(c.envelope.cases.length,15);
 const row=c.envelope.cases.find(x=>x.busV===r.policy.busV&&x.loadPercent===100)!;
 const expectedDelta=c.ratio*48*c.tonUs/c.lpUh;
 assert.ok(Math.abs(row.imagPosA-row.imagNegA-expectedDelta)<1e-10);
 assert.ok(Math.abs(c.ratio*(row.imagPosA+row.imagNegA)/2-5)<1e-10);
 const count=60000;let primarySq=0,capQ=0,qMin=0,qMax=0;
 const D=c.ratio*48/row.busV,T=1/(row.fsKhz*1000);
 for(let k=0;k<count;k++){
  const t=(k+.5)/count;
  const u=t<D?t/D:(t-D)/(1-D);
  const im=t<D?row.imagNegA+u*expectedDelta:row.imagPosA-u*expectedDelta;
  const is=t<D?0:Math.PI*5/(2*(1-D))*Math.sin(Math.PI*u);
  primarySq+=(im-is/c.ratio)**2/count;
  capQ+=(is-5)*T/count;qMin=Math.min(qMin,capQ);qMax=Math.max(qMax,capQ);
 }
 assert.ok(Math.abs(Math.sqrt(primarySq)-row.primaryRmsA)<1e-6);
 assert.ok(Math.abs((qMax-qMin)-row.chargeC)<1e-11);
});
test('known component space and heat-removal budget are real constraints',()=>{
 const short=synthesize({...req,space:{lengthMm:190,widthMm:85,heightMm:32}});
 assert.equal(short.candidates.length,0);assert.match(short.blockers.join(' '),/35|高度/);
 const narrow=synthesize({...req,space:{lengthMm:20,widthMm:20,heightMm:60}});
 assert.equal(narrow.candidates.length,0);
 const thermal=synthesize({...req,coolingBudgetW:5});
 assert.equal(thermal.candidates.length,0);assert.ok(thermal.thermal.minimumEfficiency!>97.9);
 assert.match(thermal.blockers.join(' '),/散熱/);
});
test('selected real output capacitor bank meets capacity ESR and frequency-adjusted ripple',()=>{
 const r=synthesize(req),c=r.candidates[0];
 assert.ok(c.outputParts.options.length>0);
 for(const b of c.outputParts.options){
  assert.match(b.part.mpn,/^EEHZU/);assert.ok(b.count<=24&&Number.isInteger(b.count));
  assert.ok(b.effectiveUf>=c.outputCapMinUf);assert.ok(b.designEsrMohm<=c.outputEsrMaxMohm);
  assert.ok(b.usableRippleA>=c.outputRippleRatingA);assert.ok(b.part.voltageV>=req.outputV*1.25);
  assert.equal(b.part.rippleTempC,135);assert.equal(b.part.esrTempC,20);
 }
});
test('requirements reject contradictory extra outputs instead of silently resizing the power budget',()=>{
 assert.equal(requirementsSchema.safeParse({...req,additionalOutputs:[{voltageV:12,currentA:5}]}).success,true);
 assert.equal(requirementsSchema.safeParse({...req,additionalOutputs:[{voltageV:60,currentA:1}]}).success,false);
 assert.equal(requirementsSchema.safeParse({...req,additionalOutputs:[{voltageV:24,currentA:20}]}).success,false);
 assert.equal(requirementsSchema.safeParse({...req,additionalOutputs:[{voltageV:12,currentA:5},{voltageV:12,currentA:3}]}).success,false);
});
test('catalog respects published frequency bins and returns no part when ratings cannot fit',()=>{
 assert.equal(rippleFactor(100,30),.8);assert.equal(rippleFactor(150,30),.85);
 assert.equal(rippleFactor(100,50),.9);assert.equal(rippleFactor(150,100),1);
 const highV=selectOutputCaps({minUf:400,esrMaxMohm:5,rippleRatingA:10},{...req,outputV:60,outputInterface:'dc'},100);
 assert.equal(highV.options.length,0);assert.ok(highV.reason.length>0);
 const tooMany=selectOutputCaps({minUf:100000,esrMaxMohm:5,rippleRatingA:10},req,100);
 assert.equal(tooMany.options.length,0);
});
test('portable summary includes operating conditions and real part selection',()=>{
 const r=synthesize(req),c=r.candidates[0],p=newProject('Envelope','hwllc');p.spec=c.spec;
 p.design={modelVersion:r.version,requirements:r.requirements,candidateId:c.id,specKey:fingerprint(c.spec),summary:candidateSummary(r,c)};
 const imported=projectSchema.parse(JSON.parse(JSON.stringify(p)));
 assert.match(imported.design!.summary,/EEHZU/);assert.match(imported.design!.summary,/10%/);
 assert.match(imported.design!.summary,/135°C/);
});
test('maximum seven output ratings remain portable with the complete case summary',()=>{
 const r=synthesize({...req,additionalOutputs:[{voltageV:5,currentA:3},{voltageV:9,currentA:3},{voltageV:15,currentA:3},{voltageV:20,currentA:5},{voltageV:28,currentA:5},{voltageV:36,currentA:5}]});
 assert.ok(r.candidates.length>0);
 const c=r.candidates[0],p=newProject('All output ratings','hwllc');p.spec=c.spec;
 assert.equal(c.envelope.cases.length,105);
 p.design={modelVersion:r.version,requirements:r.requirements,candidateId:c.id,specKey:fingerprint(c.spec),summary:candidateSummary(r,c)};
 assert.ok(p.design.summary.length<=20000);
 assert.equal(projectSchema.parse(JSON.parse(JSON.stringify(p))).design!.requirements.additionalOutputs.length,6);
 assert.match(p.design.summary,/5 V/);
});
