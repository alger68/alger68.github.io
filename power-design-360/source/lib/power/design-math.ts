const E12=[1,1.2,1.5,1.8,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2];
export function preferred(value:number,up=true){
 const exp=Math.floor(Math.log10(value));
 const values=[exp-1,exp,exp+1].flatMap(e=>E12.map(v=>v*10**e)).sort((a,b)=>a-b);
 return up?values.find(v=>v>=value*(1-1e-12))!:values.filter(v=>v<=value*(1+1e-12)).at(-1)!;
}
export const voltageRating=(v:number)=>[10,16,25,35,50,63,80,100,160,200,250,350,400,450,500,630,800,1000].find(x=>x>=v)??1000;
/** Charge/RMS of an ideal half-sine secondary pulse, not controller behavior. */
export function outputBank(io:number,vo:number,fsKhz:number,dls:number,rippleV:number,stepA:number,responseUs:number,droopV:number){
 const secPeakA=io*Math.PI/(2*dls),secRmsA=secPeakA*Math.sqrt(dls/2);
 const alpha=Math.asin(io/secPeakA),chargeC=io/(fsKhz*1000)*(Math.cos(alpha)-dls+2*dls*alpha/Math.PI);
 const switchingUf=chargeC/(rippleV*.5)*1e6,transientUf=stepA*responseUs/droopV/.8;
 const minUf=Math.max(switchingUf,transientUf),nominalUf=preferred(minUf/.8);
 return {secPeakA,secRmsA,chargeC,rippleA:Math.sqrt(Math.max(0,secRmsA**2-io**2)),minUf,nominalUf,voltageV:voltageRating(vo*1.25),esrMaxMohm:Math.min(rippleV*.5/secPeakA,droopV*.2/stepA)*1000,switchingUf,transientUf};
}
