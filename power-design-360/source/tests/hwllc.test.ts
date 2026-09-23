import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../lib/power/engine.ts';
import {defaultSpec,newProject,projectSchema,specSchema} from '../lib/power/model.ts';
import {readWorkspace} from '../lib/power/storage.ts';
import {calculateRequest} from '../lib/power/api.ts';

const hw = () => newProject('HWLLC sample','hwllc').spec;
const status = (s: ReturnType<typeof hw>, id: string) => calculate(s).checks.find(c=>c.id===id)?.status;
test('HWLLC never returns the conventional LLC gain or resonance, even with tank inputs',()=>{
 const s={...hw(),hwLrUh:3,hwLmUh:180,hwCr1Nf:3.3,hwCr2Nf:1000,hwPrimaryTurns:16,hwSecondaryTurns:4};
 const r=calculate(s);
 for(const k of ['frKhz','fpKhz','q','rac','gainTarget','gainHold','k','ratio'] as const)assert.equal(r.metrics[k],null);
 assert.deepEqual(r.curves,[]);assert.equal(r.metrics.outputW,240);
 assert.equal(status(s,'resonance-range'),'pending');
 assert.equal(status(s,'driver-vcc'),'pending');assert.equal(status(s,'sr-vd'),'pending');
});
test('old projects import as conventional LLC without reinterpreting the tank',()=>{
 const p=newProject();const old=JSON.parse(JSON.stringify(p));old.format='power-design-360/v1';
 for(const key of Object.keys(old.spec))if(!(key in legacyKeys))delete old.spec[key];
 const result=readWorkspace(JSON.stringify({projects:[old],activeId:old.id})).projects[0];
 assert.equal(result.format,'power-design-360/v2');assert.equal(result.spec.topology,'llc-center-tapped');
 assert.equal(result.spec.crNf,82);assert.equal(result.spec.hwCr1Nf,null);assert.equal(result.spec.rectifier,'diode');
 assert.ok(calculate(result.spec).curves.length>0);assert.ok(projectSchema.safeParse(result).success);
});
const legacyKeys=Object.fromEntries('vacMin vacMax outputV outputA busV busMinV pfcEfficiency dcEfficiency targetEfficiency powerFactor holdMs bulkUf capTolerance lrUh crNf lmUh primaryTurns secondaryTurns fsMinKhz fsMaxKhz ambientC caseLimitC thermalResistance'.split(' ').map(k=>[k,true]));
test('controller recommended limits are enforced and unknown values remain pending',()=>{
 const s={...hw(),driverVccMinV:10,driverVccMaxV:18,bootstrapMinV:10,bootstrapMaxV:18,driverVsPeakV:600,srVdPeakV:135,fsMaxKhz:300};
 for(const id of ['driver-vcc','driver-bootstrap','driver-vs','sr-vd','controller-frequency'])assert.equal(status(s,id),'pass');
 assert.equal(status({...s,srVdPeakV:140},'sr-vd'),'fail');
 assert.equal(status({...s,driverVccMinV:9.9},'driver-vcc'),'fail');
 assert.equal(status({...s,bootstrapMaxV:18.1},'driver-bootstrap'),'fail');
 assert.equal(status({...s,driverVsPeakV:601},'driver-vs'),'fail');
 assert.equal(status({...s,fsMaxKhz:301},'controller-frequency'),'fail');
 assert.equal(status({...s,driverVccMinV:null},'driver-vcc'),'pending');
 assert.equal(status({...s,driverVccMinV:null,driverVccMaxV:19},'driver-vcc'),'fail');
 assert.equal(specSchema.safeParse({...s,driverVccMinV:17,driverVccMaxV:16}).success,false);
});
test('single-port PD and dedicated DC power budgets have distinct limits',()=>{
 assert.equal(status(hw(),'pd-envelope'),'pass');
 assert.equal(status({...hw(),outputA:10},'pd-envelope'),'fail');
 assert.equal(calculate({...hw(),outputA:10,outputInterface:'dc'}).checks.some(c=>c.id==='pd-envelope'),false);
});
test('active bridge conduction is inside the existing front-end loss budget',()=>{
 const s={...hw(),outputA:10,outputInterface:'dc' as const,bridgeRdsOnMohm:100};const r=calculate(s);
 const expected=2*.1*(499.7917534360683/(90*.99))**2;
 assert.ok(Math.abs(r.metrics.bridgeConductionW!-expected)<1e-9);
 assert.ok(Math.abs(r.metrics.inputW-r.metrics.outputW-r.metrics.totalLossW)<1e-9);
 assert.equal(status({...s,bridgeRdsOnMohm:1000},'bridge-budget'),'fail');
 assert.equal(calculate({...s,rectifier:'diode'}).metrics.bridgeConductionW,null);
});
test('API returns safe HWLLC nulls and rejects invented topology',async()=>{
 const req=(s:unknown)=>new Request('https://example.test/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(s)});
 const r=await calculateRequest(req(hw()));assert.equal(r.status,200);
 assert.equal((await r.json() as {metrics:{gainTarget:number|null}}).metrics.gainTarget,null);
 assert.equal((await calculateRequest(req({...defaultSpec,topology:'full-bridge-magic'}))).status,422);
});
