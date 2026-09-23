import {requirementsSchema,type Requirements} from './requirements.ts';
import {defaultSpec,specSchema,type Spec} from './model.ts';

export const SYNTHESIS_VERSION='seed-1.0';
// Public TDK core/bobbin tables, October 2022, pages 2 and 4. Amin is used for flux.
const cores=[
 {name:'ETD34/17/11',ae:97.1,amin:91.6,window:122,ve:7630,bobbin:'B66362B1014T001'},
 {name:'ETD39/20/13',ae:125,amin:123,window:178,ve:11500,bobbin:'B66364B1016T001'},
 {name:'ETD44/22/15',ae:173,amin:172,window:210,ve:17800,bobbin:'B66366B1018T001'},
];
const E12=[1,1.2,1.5,1.8,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2];
export function preferred(value:number,up=true){
 const exp=Math.floor(Math.log10(value));
 const values=[exp-1,exp,exp+1].flatMap(e=>E12.map(v=>v*10**e)).sort((a,b)=>a-b);
 return up?values.find(v=>v>=value*(1-1e-12))!:values.filter(v=>v<=value*(1+1e-12)).at(-1)!;
}
const voltageRating=(v:number)=>[10,16,25,35,50,63,80,100,160,200,250,350,400,450,500,630,800,1000].find(x=>x>=v)??1000;
const mu0=4e-7*Math.PI;

/** Charge/RMS of an ideal half-sine secondary pulse; independent of a controller IC. */
export function outputBank(io:number,vo:number,fsKhz:number,dls:number,rippleV:number,stepA:number,responseUs:number,droopV:number){
 const secPeakA=io*Math.PI/(2*dls),secRmsA=secPeakA*Math.sqrt(dls/2);
 const alpha=Math.asin(io/secPeakA),chargeC=io/(fsKhz*1000)*(Math.cos(alpha)-dls+2*dls*alpha/Math.PI);
 const switchingUf=chargeC/(rippleV*.5)*1e6,transientUf=stepA*responseUs/droopV/.8;
 const minUf=Math.max(switchingUf,transientUf),nominalUf=preferred(minUf/.8);
 return {secPeakA,secRmsA,chargeC,rippleA:Math.sqrt(Math.max(0,secRmsA**2-io**2)),minUf,nominalUf,voltageV:voltageRating(vo*1.25),esrMaxMohm:Math.min(rippleV*.5/secPeakA,droopV*.2/stepA)*1000,switchingUf,transientUf};
}
export type Candidate={
 id:string;core:string;bobbin:string;np:number;ns:number;ratio:number;lpUh:number;lmUh:number;lrUh:number;
 cr1Nf:number;cr2Nf:number;crVoltageV:number;cr1RippleA:number;cr2RippleA:number;
 fsKhz:number;fsMinKhz:number;fsMaxKhz:number;tonUs:number;dutyHold:number;srIdealV:number;srRatingV:number;
 bPeakT:number;fill:number;alNh:number;gapMm:number;primaryRmsA:number;secondaryRmsA:number;secondaryPeakA:number;
 primaryCopperMm2:number;secondaryCopperMm2:number;strandMm:number;primaryStrands:number;secondaryStrands:number;
 pfcLuh:number;pfcPeakA:number;pfcRmsA:number;pfcCore:string;pfcTurns:number;pfcGapMm:number;pfcAlNh:number;pfcCopperMm2:number;pfcFsKhz:number;
 bulkUf:number;bulkVoltageV:number;bulkMinUf:number;holdActualMs:number;
 outputCapUf:number;outputCapMinUf:number;outputCapV:number;outputEsrMaxMohm:number;outputRippleRatingA:number;
 magneticVolumeCm3:number;score:number;spec:Spec;
};
export type Synthesis={version:string;requirements:Requirements;policy:{bPeakT:number;fillMax:number;currentDensity:number;leakageFraction:number;negativeFraction:number;capLoss:number;efficiencyBudget:number;busV:number;busStartV:number;busMaxV:number;busStopV:number;dutyMax:number;targetFrequencyKhz:number};candidates:Candidate[];blockers:string[];assumptions:string[];thermal:{lossBudgetW:number;maxThetaCPerW:number};explored:number};
export function synthesize(input:Requirements):Synthesis {
 const r=requirementsSchema.parse(input);
 const busV=Math.max(400,Math.ceil(Math.SQRT2*r.vacMax*1.07/10)*10),busMaxV=busV*1.05,busStartV=busV*(.98-.025),busStopV=busV*.8;
 const stageEta=Math.sqrt(r.targetEfficiency/100),pout=r.outputV*r.outputA,pbus=pout/stageEta,pin=pout/(r.targetEfficiency/100);
 const bPeakT=r.ambientC>=60?.15:.18,currentDensity=r.ambientC>=60?2.5:3,fillMax=.28,leakageFraction=.03,negativeFraction=.15;
 const dutyMax=Math.min(.65,.9/(1+2*Math.sqrt(leakageFraction)));
 const targetFrequencyKhz=r.priority==='compact'?240:r.priority==='low-frequency'?100:160;
 const policy={bPeakT,fillMax,currentDensity,leakageFraction,negativeFraction,capLoss:.2,efficiencyBudget:r.targetEfficiency,busV,busStartV,busMaxV,busStopV,dutyMax,targetFrequencyKhz};
 const lossBudgetW=pin-pout,thermal={lossBudgetW,maxThetaCPerW:(r.caseLimitC-r.ambientC)/lossBudgetW};
 const result:Synthesis={version:SYNTHESIS_VERSION,requirements:r,policy,candidates:[],blockers:[],thermal,explored:0,assumptions:[
  '公開的一階非對稱半橋／半波諧振模型，用於 HWLLC 設計起點；尚非 RRW11011 閉迴路模型。',
  '效率是損耗預算，由目標平均分配給前後級；沒有宣告效率、溫升或 ZVS 已達標。',
  '磁芯候選庫為 TDK ETD34／39／44；頻率搜尋 100、130、160、200、240 kHz，整數匝數與填充率自動篩選。',
  '負磁化電流係數 15%、初始漏感比例 3%、電容負容差 20%；漏感與氣隙需要磁件打樣校準。',
  'Cr1 分配約 10% 交流總電容量、Cr2 約 90%，為軟體起始策略，須核對實際控制器感測接法。',
  'PFC 以兩相均流臨界導通模型選值；未套用其他 IC 的腳位設定，RRW11011 主副相策略需確認。',
  '繞組電流、填充、諧振／輸出電容額定涵蓋額定負載下的保持終點；輸出電容另計半正弦漣波與指定負載階躍。尚未指定實際料號或驗證壽命。',
  '初估工作點為本次額定輸出；低負載、啟動、短路及其他 PD 電壓檔位的模式切換仍需驗證。',
 ]};
 if(r.outputInterface==='usb-pd'&&(r.outputV>48||r.outputA>5||pout>240)){result.blockers.push('單埠 USB PD EPR 上限 48 V／5 A／240 W；請調整輸出需求，或改為專用 DC／整機預算。');return result;}
 const bulkRippleV=busV*.05;
 const bulkHold=2*pbus*r.holdMs/1000/(busStartV**2-busStopV**2)*1e6;
 const bulkRipple=pbus/(2*Math.PI*r.lineHz*busV*bulkRippleV)*1e6;
 const bulkMinUf=Math.max(bulkHold,bulkRipple),bulkUf=preferred(bulkMinUf/.8),bulkVoltageV=voltageRating(busMaxV/.9);
 const holdActualMs=bulkUf*.8*1e-6*(busStartV**2-busStopV**2)/(2*pbus)*1000;
 const srRatingV=150,allowedSrV=Math.min(srRatingV*.8,135*.85);
 const nMin=busMaxV/allowedSrV,nMax=dutyMax*busStopV/r.outputV;
 if(nMin>=nMax){result.blockers.push('目前母線、保持終止電壓與 SR 感測降額無共同匝比範圍；需要調整功率級／感測架構，不能直接套用此候選庫。');return result;}
 const candidates:Candidate[]=[];
 for(const fsKhz of [100,130,160,200,240]){
  const pfcTargetKhz=Math.max(45,Math.min(80,fsKhz/3));
  const pfcLTargets=[r.vacMin,r.vacMax].map(v=>v*v*(1-Math.SQRT2*v/(busV*.98))/(pin*pfcTargetKhz*1000)*1e6);
  const pfcLuh=preferred(Math.min(...pfcLTargets),false);
  const pfcPeakA=Math.SQRT2*pin/r.vacMin,pfcRmsA=pfcPeakA/Math.sqrt(6),pfcCopperMm2=pfcRmsA/currentDensity;
  const pfcFsKhz=Math.min(...[r.vacMin,r.vacMax].map(v=>v*v*(1-Math.SQRT2*v/(busV*.98))/(pin*pfcLuh*1e-6)/1000));
  const pfcCore=cores.map(c=>({...c,turns:Math.ceil(pfcLuh*1e-6*pfcPeakA/(bPeakT*c.amin*1e-6))})).find(c=>c.turns*pfcCopperMm2/c.window<=fillMax);
  if(!pfcCore)continue;
  for(const core of cores)for(let ns=2;ns<=48;ns++)for(let np=Math.ceil(nMin*ns);np<=Math.min(200,Math.floor(nMax*ns));np++){
   result.explored++;
   const ratio=np/ns,dhs=ratio*r.outputV/busV,dls=1-dhs,tonUs=dls/fsKhz*1000;
   const imagPos=2*(1+negativeFraction)*r.outputA/ratio,imagNeg=-2*negativeFraction*r.outputA/ratio,delta=imagPos-imagNeg;
   const lpUh=tonUs*ratio*r.outputV/delta,lrTarget=lpUh*leakageFraction;
   const cTargetNf=(tonUs*1e-6)**2/(Math.PI**2*lrTarget*1e-6)*1e9;
   const cr1Nf=preferred(cTargetNf*.1),cr2Nf=preferred(cTargetNf*.9);
   const lrUh=(tonUs*1e-6)**2/(Math.PI**2*(cr1Nf+cr2Nf)*1e-9)*1e6,lmUh=lpUh-lrUh;
   const fsMinKhz=(1-ratio*r.outputV/busStopV)/tonUs*1000,fsMaxKhz=(1-ratio*r.outputV/busMaxV)/tonUs*1000;
   if(fsMaxKhz>300||fsMinKhz<30||lmUh<=0)continue;
   const bPeakTActual=lpUh*imagPos/(np*core.amin),bank=outputBank(r.outputA,r.outputV,fsMinKhz,1-ratio*r.outputV/busStopV,r.rippleMv/1000,r.outputA*r.stepPercent/100,r.responseUs,r.outputV*r.transientPercent/100);
   const magMeanSquare=(imagPos**2+imagPos*imagNeg+imagNeg**2)/3;
   const primaryRmsA=Math.sqrt(magMeanSquare+(bank.secRmsA/ratio)**2-2*(r.outputA/ratio)**2);
   const strandMm=.1,strandArea=Math.PI*(strandMm/2)**2;
   const primaryStrands=Math.ceil(primaryRmsA/currentDensity/strandArea),secondaryStrands=Math.ceil(bank.secRmsA/currentDensity/strandArea);
   const primaryCopperMm2=primaryStrands*strandArea,secondaryCopperMm2=secondaryStrands*strandArea;
   const fill=(np*primaryCopperMm2+ns*secondaryCopperMm2)/core.window;
   if(bPeakTActual>bPeakT||fill>fillMax)continue;
   const magneticVolumeCm3=(core.ve+2*pfcCore.ve)/1000;
   const score=r.priority==='compact'?magneticVolumeCm3+fsKhz/10000:r.priority==='low-frequency'?fsKhz+magneticVolumeCm3/100:Math.abs(Math.log(fsKhz/160))*15+magneticVolumeCm3*.2+fill;
   const bestIndex=candidates.findIndex(c=>c.fsKhz===fsKhz);
   const best=candidates[bestIndex];
   if(best&&(best.score<score||(best.score===score&&best.fill<=fill)))continue;
   const specParsed=specSchema.safeParse({...defaultSpec,topology:'hwllc',rectifier:'tea2209',outputInterface:r.outputInterface,hwCapConnection:'split-bus',hwLrUh:lrUh,hwLmUh:lmUh,hwCr1Nf:cr1Nf,hwCr2Nf:cr2Nf,hwPrimaryTurns:np,hwSecondaryTurns:ns,hwLowSideOnUs:tonUs,
    vacMin:r.vacMin,vacMax:r.vacMax,outputV:r.outputV,outputA:r.outputA,busV:busStartV,busMinV:busStopV,pfcEfficiency:stageEta*100,dcEfficiency:stageEta*100,targetEfficiency:r.targetEfficiency,holdMs:r.holdMs,bulkUf,capTolerance:20,fsMinKhz,fsMaxKhz,ambientC:r.ambientC,caseLimitC:r.caseLimitC});
   if(!specParsed.success)continue;
   const spec=specParsed.data;
   const candidate:Candidate={id:`${core.name}-${fsKhz}-${np}-${ns}`,core:core.name,bobbin:core.bobbin,np,ns,ratio,lpUh,lmUh,lrUh,cr1Nf,cr2Nf,crVoltageV:voltageRating(busMaxV*1.25),cr1RippleA:primaryRmsA*cr1Nf/(cr1Nf+cr2Nf)*1.25,cr2RippleA:primaryRmsA*cr2Nf/(cr1Nf+cr2Nf)*1.25,
    fsKhz,fsMinKhz,fsMaxKhz,tonUs,dutyHold:ratio*r.outputV/busStopV,srIdealV:busMaxV/ratio,srRatingV,bPeakT:bPeakTActual,fill,alNh:lmUh*1000/np**2,gapMm:mu0*np**2*core.ae/lmUh*1000,primaryRmsA,secondaryRmsA:bank.secRmsA,secondaryPeakA:bank.secPeakA,primaryCopperMm2,secondaryCopperMm2,strandMm,primaryStrands,secondaryStrands,
    pfcLuh,pfcPeakA,pfcRmsA,pfcCore:pfcCore.name,pfcTurns:pfcCore.turns,pfcGapMm:mu0*pfcCore.turns**2*pfcCore.ae/pfcLuh*1000,pfcAlNh:pfcLuh*1000/pfcCore.turns**2,pfcCopperMm2,pfcFsKhz,
    bulkUf,bulkVoltageV,bulkMinUf,holdActualMs,outputCapUf:bank.nominalUf,outputCapMinUf:bank.minUf,outputCapV:bank.voltageV,outputEsrMaxMohm:bank.esrMaxMohm,outputRippleRatingA:bank.rippleA*1.25,magneticVolumeCm3,score,spec};
   if(bestIndex<0)candidates.push(candidate);else candidates[bestIndex]=candidate;
  }
 }
 // Distinct frequency choices make the trade-off visible; no measured-loss claim.
 candidates.sort((a,b)=>a.score-b.score||a.fill-b.fill||a.np-b.np);
 const seen=new Set<number>();result.candidates=candidates.filter(c=>{if(seen.has(c.fsKhz))return false;seen.add(c.fsKhz);return true;}).slice(0,3);
 if(!result.candidates.length)result.blockers.push('目前 3 種磁芯、5 個頻率與繞組填充限制內找不到候選；需要擴充磁芯庫或調整功率／邊界。系統不會把不合條件的方案當作推薦。');
 return result;
}
export function candidateSummary(r:Synthesis,c:Candidate):string {
 const f=(n:number,d=2)=>n.toFixed(d);
 return [
  `設計起點 ${r.version}；${r.requirements.outputV} V × ${r.requirements.outputA} A；未完成硬體驗證。`,
  `母線：額定 ${f(r.policy.busV)} V，估算最大 ${f(r.policy.busMaxV)} V，保持起點 ${f(r.policy.busStartV)} V → ${f(r.policy.busStopV)} V。`,
  `PFC：兩相，各 ${f(c.pfcLuh)} µH；${c.pfcCore}，${c.pfcTurns} 匝；每相 Ipk ${f(c.pfcPeakA)} A / Irms ${f(c.pfcRmsA)} A；銅面積 ≥${f(c.pfcCopperMm2)} mm²；AL ${f(c.pfcAlNh)} nH/turn²，等效氣隙 ${f(c.pfcGapMm)} mm。`,
  `母線電容：總容量 ${f(c.bulkUf,0)} µF / ${c.bulkVoltageV} V；負容差後可供 ${f(c.holdActualMs)} ms。漣波電流與壽命另驗。`,
  `變壓器：${c.core} / N87 為候選材料；骨架 ${c.bobbin}；Np:Ns = ${c.np}:${c.ns}；Lp ${f(c.lpUh)} µH、Lm ${f(c.lmUh)} µH、Lr ${f(c.lrUh)} µH。`,
  `磁件：Bpk 初估 ${f(c.bPeakT,3)} T；銅填充 ${f(c.fill*100,1)}%；AL ${f(c.alNh)} nH/turn²；等效氣隙 ${f(c.gapMm)} mm（忽略磁芯磁阻／邊緣效應，不是加工圖）。`,
  `繞線起點：初級 ${c.primaryStrands} × Ø${c.strandMm} mm；次級 ${c.secondaryStrands} × Ø${c.strandMm} mm。需核對漆膜、絕緣、爬電距離與 AC 損耗。`,
  `頻率：額定 ${c.fsKhz} kHz；固定 LS 脈寬假設下 ${f(c.fsMinKhz)}–${f(c.fsMaxKhz)} kHz；Ton,LS ${f(c.tonUs,3)} µs。`,
  `諧振電容：Cr1 ${f(c.cr1Nf)} nF，Cr2 ${f(c.cr2Nf)} nF；各 ${c.crVoltageV} V 起點；RMS 額定需求分別 ≥${f(c.cr1RippleA)} / ${f(c.cr2RippleA)} A。`,
  `輸出電容組：總 ${f(c.outputCapUf,0)} µF / ${c.outputCapV} V；合成 ESR ≤${f(c.outputEsrMaxMohm)} mΩ；漣波電流額定 ≥${f(c.outputRippleRatingA)} A。容量已留 20% 負容差，尚未選實際料號。`,
  `SR：MOSFET 耐壓候選 ${c.srRatingV} V；母線最大值下理想應力 ${f(c.srIdealV)} V，不含振鈴。IC VD 腳另依 135 V 建議上限驗證。`,
  `熱設計需求：損耗預算 ${f(r.thermal.lossBudgetW)} W；整機有效熱阻需 ≤${f(r.thermal.maxThetaCPerW)} °C/W。未宣告達到溫升目標。`,
  ...r.assumptions,
  '公開模型來源：Infineon XDPS2201 Design Guide V1.0 (2021-03-01) pp.7–8,18–23；https://www.infineon.com/assets/row/public/documents/24/42/infineon-design-guide-hybrid-flyback-converter-design-xdps2201-applicationnotes-en.pdf',
  'PFC：TI UCC28063 Rev.C (2024-07) pp.15–16,29；https://www.ti.com/lit/ds/symlink/ucc28063.pdf',
  '磁芯／骨架：TDK (2022-10) pp.2,4；https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_34_17_11.pdf ; https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf ; https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_44_22_15.pdf',
 ].join('\n');
}
