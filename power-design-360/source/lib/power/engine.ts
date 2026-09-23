import { specSchema, fingerprint, ENGINE_VERSION, type Spec, type Result, type Check } from './model.ts';

/** Fundamental harmonic approximation. k=Lm/Lr; Q=sqrt(Lr/Cr)/Rac. */
export function fhaGain(f: number, k: number, q: number): number {
  if (![f, k, q].every(Number.isFinite) || f <= 0 || k <= 0 || q < 0) throw new RangeError('Invalid FHA domain');
  return 1 / Math.hypot(1 + (1 - 1 / (f * f)) / k, q * (f - 1 / f));
}
export function calculate(input: Spec): Result {
  const s = specSchema.parse(input);
  const hw = s.topology === 'hwllc';
  const outputW = s.outputV * s.outputA;
  const busW = outputW / (s.dcEfficiency / 100);
  const inputW = busW / (s.pfcEfficiency / 100);
  const efficiency = s.pfcEfficiency * s.dcEfficiency / 100;
  const inputLowA = inputW / (s.vacMin * s.powerFactor);
  // Front-end efficiency is AC-in to DC-bus and already INCLUDES bridge losses.
  const bridgeConductionW = s.rectifier==='tea2209' && s.bridgeRdsOnMohm!==null ? 2*s.bridgeRdsOnMohm/1000*inputLowA**2 : null;
  const pfcLossW = inputW - busW, dcLossW = busW - outputW, totalLossW = inputW - outputW;
  const requiredCapUf = 2 * busW * s.holdMs / 1000 / (s.busV ** 2 - s.busMinV ** 2) * 1e6;
  const effectiveCapUf = s.bulkUf * (1 - s.capTolerance / 100);
  const holdMs = effectiveCapUf * 1e-6 * (s.busV ** 2 - s.busMinV ** 2) / (2 * busW) * 1000;
  let frKhz:number|null=null, fpKhz:number|null=null, k:number|null=null, ratio:number|null=null, rac:number|null=null, q:number|null=null, gainTarget:number|null=null, gainHold:number|null=null;
  let curves:Result['curves']=[];
  let hwCapSumNf:number|null=null, hwCapRatio:number|null=null, hwTankFrKhz:number|null=null, hwTankHalfUs:number|null=null, hwOnHalfRatio:number|null=null;
  if(hw && s.hwCapConnection==='split-bus' && s.hwLrUh!==null && s.hwCr1Nf!==null && s.hwCr2Nf!==null) {
    // Stiff bus: both rails are AC ground. Incremental C at the midpoint is C1+C2.
    // Isolated LC timing diagnostic only; Lm, rectifier states and parasitics are excluded.
    hwCapSumNf=s.hwCr1Nf+s.hwCr2Nf;
    hwCapRatio=s.hwCr1Nf/s.hwCr2Nf;
    hwTankHalfUs=Math.PI*Math.sqrt(s.hwLrUh*1e-6*hwCapSumNf*1e-9)*1e6;
    hwTankFrKhz=500/hwTankHalfUs;
    hwOnHalfRatio=s.hwLowSideOnUs===null?null:s.hwLowSideOnUs/hwTankHalfUs;
  }
  if(!hw) {
  const lr = s.lrUh * 1e-6, cr = s.crNf * 1e-9, lm = s.lmUh * 1e-6;
  frKhz = 1 / (2 * Math.PI * Math.sqrt(lr * cr)) / 1000;
  fpKhz = 1 / (2 * Math.PI * Math.sqrt((lr + lm) * cr)) / 1000;
  k = lm / lr; ratio = s.primaryTurns / s.secondaryTurns;
  // Center-tapped full-wave secondary: Ns is ONE half winding; ideal rectifier.
  rac = 8 / Math.PI ** 2 * ratio ** 2 * s.outputV / s.outputA;
  q = Math.sqrt(lr / cr) / rac;
  gainTarget = 2 * ratio * s.outputV / s.busV;
  gainHold = 2 * ratio * s.outputV / s.busMinV;
  const fr=frKhz, tankK=k, tankQ=q;
  curves = Array.from({length: 151}, (_, i) => {
    const frequency = s.fsMinKhz + (s.fsMaxKhz - s.fsMinKhz) * i / 150;
    return {frequency, low: fhaGain(frequency / fr, tankK, tankQ * .1), half: fhaGain(frequency / fr, tankK, tankQ * .5), full: fhaGain(frequency / fr, tankK, tankQ)};
  });
  }
  const caseC = s.thermalResistance === null ? null : s.ambientC + totalLossW * s.thermalResistance;
  const check = (id: string, title: string, pass: boolean | null, detail: string): Check => ({id, title, status: pass === null ? 'pending' : pass ? 'pass' : 'fail', detail});
  const checks: Check[] = [
    check('boost-headroom', 'Boost 母線高於最高輸入峰值', s.busV > Math.SQRT2 * s.vacMax, `輸入峰值 ${(Math.SQRT2 * s.vacMax).toFixed(1)} V；母線 ${s.busV} V。尚未包含控制餘裕與漣波。`),
    check('efficiency', '效率預算達到專案目標', efficiency + 1e-9 >= s.targetEfficiency, `假設級間效率相乘 ${efficiency.toFixed(2)}%；目標 ${s.targetEfficiency}%。此為預算，不是量測。`),
    check('hold-up', '電容能量滿足保持時間預算', holdMs >= s.holdMs, `在指定 ${s.busV} → ${s.busMinV} V 工況，含 −${s.capTolerance}% 容差的能量可供 ${holdMs.toFixed(2)} ms；需求 ${s.holdMs} ms。未驗證低母線調節，未計 ESR、老化與額外控制損耗。`),
    check('resonance-range', hw?'HWLLC 增益與 ZVS 模型':'諧振點位於控制頻率範圍', frKhz===null?null:frKhz >= s.fsMinKhz && frKhz <= s.fsMaxKhz, frKhz===null?(hwTankFrKhz===null?'待接法、LC 參數及控制時序；不產生一般 LLC FHA 曲線。':`LC 固有頻率估算 ${hwTankFrKhz.toFixed(2)} kHz；僅為理想支路時間尺度，不能判定增益、頻率可行性或 ZVS。`):`fr = ${frKhz.toFixed(2)} kHz；控制範圍 ${s.fsMinKhz}–${s.fsMaxKhz} kHz。範圍涵蓋不代表 ZVS 成立。`),
    check('case-temperature', '機殼集總熱模型符合溫度目標', caseC === null ? null : caseC <= s.caseLimitC, caseC === null ? '尚未填入經驗證的整機有效熱阻；需依結構、風速與安裝方式取得。' : `估計 ${caseC.toFixed(1)} °C；目標 ≤${s.caseLimitC} °C。假設全部損耗經此熱路徑；不代表接面溫度。`),
  ];
  if(s.rectifier==='tea2209')checks.push(check('bridge-budget','主動橋導通損耗未超過前級預算',bridgeConductionW===null?null:bridgeConductionW<=pfcLossW,bridgeConductionW===null?'請填入四顆相同 MOSFET 在實際閘壓／熱態下的 RDS(on)。':`低線導通估計 ${bridgeConductionW.toFixed(2)} W，為整流＋PFC 預算 ${pfcLossW.toFixed(2)} W 的一部分；未含 IC、閘極與體二極體損耗，不再加計總損耗。`));
  if(hw) {
    const supply = (a:number|null,b:number|null) => (a!==null&&(a<10||a>18))||(b!==null&&(b<10||b>18))?false:a===null||b===null?null:true;
    checks.push(
      check('controller-frequency','SR／驅動器頻率上限',s.fsMaxKhz<=300,`RRW43110 支援至 300 kHz；RRW40120 至 500 kHz（各 Rev.0.03／0.04，第 1 頁）。仍須確認 RRW11011 選項與實際各模式頻率。`),
      check('driver-vcc','RRW40120 VCC 範圍',supply(s.driverVccMinV,s.driverVccMaxV),'建議工作範圍 10–18 V（Rev.0.04，第 6 頁）；需輸入有效切換期間穩態與動態的最小／最大值。'),
      check('driver-bootstrap','RRW40120 自舉供電範圍',supply(s.bootstrapMinV,s.bootstrapMaxV),'VB − VS 建議 10–18 V（Rev.0.04，第 6 頁）；需包含最長高側導通與 burst 條件。'),
      check('driver-vs','RRW40120 VS 正峰值',s.driverVsPeakV===null?null:s.driverVsPeakV<=600,'VS 建議工作上限 600 V（Rev.0.04，第 6 頁）；須在 IC 腳量測含振鈴的正峰值，另審查負壓與 dv/dt。'),
      check('sr-vd','RRW43110 VD 正峰值',s.srVdPeakV===null?null:s.srVdPeakV<=135,'VD 建議上限 135 V，絕對最大值 145 V（Rev.0.03，第 6 頁）。這是 IC 腳限制；外部 MOSFET 耐壓須另外核對。'),
    );
  }
  if(s.outputInterface==='usb-pd')checks.push(check('pd-envelope','單埠 USB PD EPR 額定上限',s.outputV<=48&&s.outputA<=5&&outputW<=240,`目前 ${s.outputV} V × ${s.outputA} A = ${outputW} W；單埠上限 48 V／5 A／240 W（USB-IF）。仍需確認 PDO／APDO、EPR 線材與協定；不代表合規。`));
  return {version: ENGINE_VERSION, fingerprint: fingerprint(s), metrics: {outputW, inputW, busW, efficiency, inputLowA, inputHighA: inputW / (s.vacMax * s.powerFactor), pfcLossW, dcLossW, totalLossW, boostDuty: s.busV > Math.SQRT2 * s.vacMin ? 1 - Math.SQRT2 * s.vacMin / s.busV : null, requiredCapUf, effectiveCapUf, holdMs, frKhz, fpKhz, k, q, ratio, rac, gainTarget, gainHold, caseC, bridgeConductionW, hwCapSumNf,hwCapRatio,hwTankFrKhz,hwTankHalfUs,hwOnHalfRatio}, curves, checks};
}
