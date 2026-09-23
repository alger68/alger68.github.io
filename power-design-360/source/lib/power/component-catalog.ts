import type {Requirements} from './requirements.ts';
export const coreSource='https://www.tdk-electronics.tdk.com/download/531570/3cb8062a488c6f9dda068ae6ba31a953/pdf-selectorguide.pdf';
export const capSource='https://industrial.panasonic.com/cdbs/www-data/pdf/RDD0000/ast-ind-156944.pdf';
export type Dimensions={lengthMm:number;widthMm:number;heightMm:number};
export const cores=[
 {name:'ETD34/17/11',ae:97.1,amin:91.6,window:122,ve:7630,bobbin:'B66362B1014T001',dimensions:{lengthMm:43,widthMm:40,heightMm:35}},
 {name:'ETD39/20/13',ae:125,amin:123,window:178,ve:11500,bobbin:'B66364B1016T001',dimensions:{lengthMm:48,widthMm:45,heightMm:38}},
 {name:'ETD44/22/15',ae:173,amin:172,window:210,ve:17800,bobbin:'B66366B1018T001',dimensions:{lengthMm:53,widthMm:50,heightMm:41}},
];
export function fitsSpace(d:Dimensions,space:Requirements['space']){
 return !space||(d.heightMm<=space.heightMm&&((d.lengthMm<=space.lengthMm&&d.widthMm<=space.widthMm)||(d.widthMm<=space.lengthMm&&d.lengthMm<=space.widthMm)));
}
export type OutputCap={mpn:string;voltageV:number;capUf:number;esrMohm:number;rippleA:number;rippleTempC:number;esrTempC:number;dimensions:Dimensions;url:string};
// Panasonic ZU 01-Sep-25, pp.1–2. Standard P parts; ESR at 20 C / 100 kHz.
// Use the lower ripple rating at 135 C; no unverified cold/hot ESR or lifetime claim.
export const outputCaps:OutputCap[]=[
 ['EEHZU1E471P',25,470,10,3.5,12.8],['EEHZU1E561P',25,560,8,4,16.8],
 ['EEHZU1V331P',35,330,11,3.3,12.8],['EEHZU1V471P',35,470,9,3.8,16.8],
 ['EEHZU1H151P',50,150,12,3.2,12.8],['EEHZU1H221P',50,220,10,3.6,16.8],
 ['EEHZU1J101P',63,100,12,3.2,12.8],['EEHZU1J151P',63,150,10,3.6,16.8],
].map(([mpn,voltageV,capUf,esrMohm,rippleA,heightMm])=>({mpn:String(mpn),voltageV:Number(voltageV),capUf:Number(capUf),esrMohm:Number(esrMohm),rippleA:Number(rippleA),rippleTempC:135,esrTempC:20,dimensions:{lengthMm:11.2,widthMm:10.5,heightMm:Number(heightMm)},url:`https://industrial.panasonic.com/ww/products/pt/hybrid-aluminum/models/${mpn}`}));
export function rippleFactor(capUf:number,fsKhz:number){
 // Exact ZU frequency-correction bins, datasheet p.2. No extrapolation below 100 Hz.
 const limits=[.1,.2,.3,.5,1,2,3,5,10,15,20,30,40,50,100,500];
 const factors=capUf<150?[.15,.20,.25,.30,.40,.45,.55,.60,.70,.75,.80,.80,.85,.90,1,1]:[.15,.25,.25,.30,.45,.50,.60,.65,.75,.80,.85,.85,.85,.90,1,1];
 if(fsKhz<.1)return 0;
 let i=0;while(i+1<limits.length&&fsKhz>=limits[i+1])i++;
 return factors[i];
}
export type CapBank={part:OutputCap;count:number;nominalUf:number;effectiveUf:number;designEsrMohm:number;usableRippleA:number;frequencyFactor:number;footprintMm2:number;volumeMm3:number;limiting:string[]};
export type PartSelection={options:CapBank[];reason:string;conditions:string[]};
export function selectOutputCaps(needs:{minUf:number;esrMaxMohm:number;rippleRatingA:number},r:Requirements,fsMinKhz:number,occupiedMm2=0):PartSelection{
 const options:CapBank[]=[];
 for(const part of outputCaps){
  if(part.voltageV<r.outputV*1.25||!fitsSpace(part.dimensions,r.space))continue;
  const factor=rippleFactor(part.capUf,fsMinKhz);
  if(!factor)continue;
  const counts={容量:Math.ceil(needs.minUf/(part.capUf*.8)-1e-12),ESR:Math.ceil(2*part.esrMohm/needs.esrMaxMohm-1e-12),漣波:Math.ceil(needs.rippleRatingA/(part.rippleA*factor*.8)-1e-12)};
  const count=Math.max(1,...Object.values(counts));
  if(count>24)continue;
  const footprintMm2=count*part.dimensions.lengthMm*part.dimensions.widthMm;
  if(r.space&&footprintMm2+occupiedMm2>r.space.lengthMm*r.space.widthMm)continue;
  options.push({part,count,nominalUf:count*part.capUf,effectiveUf:count*part.capUf*.8,designEsrMohm:2*part.esrMohm/count,usableRippleA:count*part.rippleA*factor*.8,frequencyFactor:factor,footprintMm2,volumeMm3:footprintMm2*part.dimensions.heightMm,limiting:Object.entries(counts).filter(([,n])=>n===count).map(([s])=>s)});
 }
 options.sort((a,b)=>r.priority==='compact'?a.volumeMm3-b.volumeMm3||a.count-b.count:a.count-b.count||a.volumeMm3-b.volumeMm3);
 return {options:options.slice(0,3),reason:options.length?'':'此 8 顆 Panasonic ZU 候選庫在耐壓、容量、ESR、漣波、最多 24 顆並聯或可用空間限制內無符合組合；保留元件規格需求，需擴充料庫。',conditions:[
  '電容負容差 20%；ESR 使用原廠 20°C／100 kHz 上限的 2 倍作為篩選裕量，不代表全溫範圍保證。',
  '漣波額定採 135°C 數據，套用最低掃描頻率修正，再乘 0.8 並聯分流裕量；低頻 burst 漣波尚未驗證。',
  '4000 小時為原廠額定溫度耐久試驗，未換算成產品壽命；元件局部溫度、冷啟動、壽命末期容量與佈局仍需驗證。',
  '尺寸含器件公差，尚未加入焊墊、排氣與安規間距；排序未使用價格或庫存。',
 ]};
}
