import type {Requirements} from './requirements.ts';
import {outputBank} from './design-math.ts';
export type EnvelopeHardware={ratio:number;np:number;lpUh:number;tonUs:number;amin:number};
export type OperatingCase={id:string;outputV:number;outputA:number;ratedA:number;loadPercent:number;busV:number;busLabel:string;duty:number;fsKhz:number;imagPosA:number;imagNegA:number;primaryRmsA:number;secondaryRmsA:number;secondaryPeakA:number;bPeakT:number;chargeC:number;outputMinUf:number;esrMaxMohm:number;rippleA:number;modeLimited:boolean};
export type DesignEnvelope={cases:OperatingCase[];modeLimited:number;fsMinKhz:number;fsMaxKhz:number;primaryRmsA:number;secondaryRmsA:number;secondaryPeakA:number;bPeakT:number;minUf:number;esrMaxMohm:number;rippleRatingA:number;dutyMax:number;uncovered:string[]};
export function evaluateEnvelope(r:Requirements,h:EnvelopeHardware,bus:{busV:number;busMaxV:number;busStopV:number}):DesignEnvelope{
 const outputs=[{voltageV:r.outputV,currentA:r.outputA},...r.additionalOutputs];
 const cases:OperatingCase[]=[];
 for(const p of outputs)for(const [busLabel,busV] of [['額定母線',bus.busV],['母線上限',bus.busMaxV],['保持終點',bus.busStopV]] as const)for(const loadPercent of [10,25,50,75,100]){
  const io=p.currentA*loadPercent/100,vo=p.voltageV,duty=h.ratio*vo/busV,fsKhz=(1-duty)/h.tonUs*1000;
  const delta=h.ratio*vo*h.tonUs/h.lpUh,imagPosA=io/h.ratio+delta/2,imagNegA=io/h.ratio-delta/2;
  const bank=outputBank(io,vo,fsKhz,1-duty,r.rippleMv/1000,p.currentA*r.stepPercent/100,r.responseUs,vo*r.transientPercent/100);
  const primaryRmsA=Math.sqrt(Math.max(0,(imagPosA**2+imagPosA*imagNegA+imagNegA**2)/3+(bank.secRmsA/h.ratio)**2-2*(io/h.ratio)**2));
  cases.push({id:`${vo}-${p.currentA}-${busLabel}-${loadPercent}`,outputV:vo,outputA:io,ratedA:p.currentA,loadPercent,busV,busLabel,duty,fsKhz,imagPosA,imagNegA,primaryRmsA,secondaryRmsA:bank.secRmsA,secondaryPeakA:bank.secPeakA,bPeakT:h.lpUh*Math.max(Math.abs(imagPosA),Math.abs(imagNegA))/(h.np*h.amin),chargeC:bank.chargeC,outputMinUf:bank.minUf,esrMaxMohm:bank.esrMaxMohm,rippleA:bank.rippleA,modeLimited:imagNegA>=-1e-12});
 }
 const max=(key:'primaryRmsA'|'secondaryRmsA'|'secondaryPeakA'|'bPeakT'|'outputMinUf'|'rippleA'|'duty'|'fsKhz')=>Math.max(...cases.map(c=>c[key]));
 return {cases,modeLimited:cases.filter(c=>c.modeLimited).length,fsMinKhz:Math.min(...cases.map(c=>c.fsKhz)),fsMaxKhz:max('fsKhz'),primaryRmsA:max('primaryRmsA'),secondaryRmsA:max('secondaryRmsA'),secondaryPeakA:max('secondaryPeakA'),bPeakT:max('bPeakT'),minUf:max('outputMinUf'),esrMaxMohm:Math.min(...cases.map(c=>c.esrMaxMohm)),rippleRatingA:max('rippleA')*1.25,dutyMax:max('duty'),uncovered:['零負載與 burst／跳週控制','啟動、短路與保護恢復','輸出檔位切換與閉迴路穩定性','寄生、Coss 與 ZVS 能量','實際損耗、溫升及 EMI']};
}
