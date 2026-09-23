import { specSchema, fingerprint, ENGINE_VERSION, type Spec, type Result, type Check } from './model.ts';

/** Fundamental harmonic approximation. k=Lm/Lr; Q=sqrt(Lr/Cr)/Rac. */
export function fhaGain(f: number, k: number, q: number): number {
  if (![f, k, q].every(Number.isFinite) || f <= 0 || k <= 0 || q < 0) throw new RangeError('Invalid FHA domain');
  return 1 / Math.hypot(1 + (1 - 1 / (f * f)) / k, q * (f - 1 / f));
}
export function calculate(input: Spec): Result {
  const s = specSchema.parse(input);
  const outputW = s.outputV * s.outputA;
  const busW = outputW / (s.dcEfficiency / 100);
  const inputW = busW / (s.pfcEfficiency / 100);
  const efficiency = s.pfcEfficiency * s.dcEfficiency / 100;
  const pfcLossW = inputW - busW, dcLossW = busW - outputW, totalLossW = inputW - outputW;
  const requiredCapUf = 2 * busW * s.holdMs / 1000 / (s.busV ** 2 - s.busMinV ** 2) * 1e6;
  const effectiveCapUf = s.bulkUf * (1 - s.capTolerance / 100);
  const holdMs = effectiveCapUf * 1e-6 * (s.busV ** 2 - s.busMinV ** 2) / (2 * busW) * 1000;
  const lr = s.lrUh * 1e-6, cr = s.crNf * 1e-9, lm = s.lmUh * 1e-6;
  const frKhz = 1 / (2 * Math.PI * Math.sqrt(lr * cr)) / 1000;
  const fpKhz = 1 / (2 * Math.PI * Math.sqrt((lr + lm) * cr)) / 1000;
  const k = lm / lr, ratio = s.primaryTurns / s.secondaryTurns;
  // Center-tapped full-wave secondary: Ns is ONE half winding; ideal rectifier.
  const rac = 8 / Math.PI ** 2 * ratio ** 2 * s.outputV / s.outputA;
  const q = Math.sqrt(lr / cr) / rac;
  const gainTarget = 2 * ratio * s.outputV / s.busV;
  const gainHold = 2 * ratio * s.outputV / s.busMinV;
  const caseC = s.thermalResistance === null ? null : s.ambientC + totalLossW * s.thermalResistance;
  const curves = Array.from({length: 151}, (_, i) => {
    const frequency = s.fsMinKhz + (s.fsMaxKhz - s.fsMinKhz) * i / 150;
    return {frequency, low: fhaGain(frequency / frKhz, k, q * .1), half: fhaGain(frequency / frKhz, k, q * .5), full: fhaGain(frequency / frKhz, k, q)};
  });
  const check = (id: string, title: string, pass: boolean | null, detail: string): Check => ({id, title, status: pass === null ? 'pending' : pass ? 'pass' : 'fail', detail});
  const checks: Check[] = [
    check('boost-headroom', 'Boost 母線高於最高輸入峰值', s.busV > Math.SQRT2 * s.vacMax, `輸入峰值 ${(Math.SQRT2 * s.vacMax).toFixed(1)} V；母線 ${s.busV} V。尚未包含控制餘裕與漣波。`),
    check('efficiency', '效率預算達到專案目標', efficiency >= s.targetEfficiency, `假設級間效率相乘 ${efficiency.toFixed(2)}%；目標 ${s.targetEfficiency}%。此為預算，不是量測。`),
    check('hold-up', '有效電容量滿足保持時間', holdMs >= s.holdMs, `含 −${s.capTolerance}% 容差可維持 ${holdMs.toFixed(2)} ms；需求 ${s.holdMs} ms。未計 ESR、老化與控制損耗。`),
    check('resonance-range', '諧振點位於控制頻率範圍', frKhz >= s.fsMinKhz && frKhz <= s.fsMaxKhz, `fr = ${frKhz.toFixed(2)} kHz；控制範圍 ${s.fsMinKhz}–${s.fsMaxKhz} kHz。範圍涵蓋不代表 ZVS 成立。`),
    check('case-temperature', '機殼集總熱模型符合溫度目標', caseC === null ? null : caseC <= s.caseLimitC, caseC === null ? '尚未填入經驗證的整機有效熱阻；需依結構、風速與安裝方式取得。' : `估計 ${caseC.toFixed(1)} °C；目標 ≤${s.caseLimitC} °C。假設全部損耗經此熱路徑；不代表接面溫度。`),
  ];
  return {version: ENGINE_VERSION, fingerprint: fingerprint(s), metrics: {outputW, inputW, busW, efficiency, inputLowA: inputW / (s.vacMin * s.powerFactor), inputHighA: inputW / (s.vacMax * s.powerFactor), pfcLossW, dcLossW, totalLossW, boostDuty: s.busV > Math.SQRT2 * s.vacMin ? 1 - Math.SQRT2 * s.vacMin / s.busV : null, requiredCapUf, effectiveCapUf, holdMs, frKhz, fpKhz, k, q, ratio, rac, gainTarget, gainHold, caseC}, curves, checks};
}
