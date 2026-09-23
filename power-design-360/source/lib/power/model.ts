import { z } from 'zod';

export const ENGINE_VERSION = '0.2.0';
const number = (min: number, max: number) => z.number({invalid_type_error:'請輸入有效數值'}).finite('請輸入有限數值').min(min,`不得小於 ${min}`).max(max,`不得大於 ${max}`);
const unknownNumber = (min: number, max: number) => number(min,max).nullable().default(null);
export const specSchema = z.object({
  topology: z.enum(['llc-center-tapped','hwllc']).default('llc-center-tapped'),
  rectifier: z.enum(['diode','tea2209']).default('diode'),
  outputInterface: z.enum(['dc','usb-pd']).default('dc'),
  bridgeCompPol: z.enum(['unknown','gnd','vcc']).default('unknown'),
  bridgeRdsOnMohm: unknownNumber(0.01,10000),
  hwLrUh: unknownNumber(0.01,10000), hwLmUh: unknownNumber(0.01,100000),
  hwCr1Nf: unknownNumber(0.01,100000), hwCr2Nf: unknownNumber(0.01,100000),
  hwPrimaryTurns: number(1,1000).int().nullable().default(null),
  hwSecondaryTurns: number(1,1000).int().nullable().default(null),
  driverVccMinV: unknownNumber(0,30), driverVccMaxV: unknownNumber(0,30),
  bootstrapMinV: unknownNumber(0,30), bootstrapMaxV: unknownNumber(0,30),
  driverVsPeakV: unknownNumber(0,1500), srVdPeakV: unknownNumber(0,500),
  vacMin: number(30, 300), vacMax: number(30, 300),
  outputV: number(1, 400), outputA: number(0.01, 100),
  busV: number(100, 1000), busMinV: number(40, 999),
  pfcEfficiency: number(70, 99.99), dcEfficiency: number(70, 99.99),
  targetEfficiency: number(50, 99.99), powerFactor: number(0.5, 1),
  holdMs: number(0.1, 1000), bulkUf: number(1, 100000), capTolerance: number(0, 50),
  lrUh: number(0.1, 10000), crNf: number(0.1, 100000), lmUh: number(0.1, 100000),
  primaryTurns: number(1, 1000).int(), secondaryTurns: number(1, 1000).int(),
  fsMinKhz: number(1, 2000), fsMaxKhz: number(1, 2000),
  ambientC: number(-40, 125), caseLimitC: number(0, 150), thermalResistance: number(0.01, 100).nullable(),
}).strict().superRefine((v, ctx) => {
  for (const [invalid, path, message] of [
    [v.vacMax < v.vacMin, 'vacMax', '最高輸入電壓須大於或等於最低值'],
    [v.busMinV >= v.busV, 'busMinV', '保持時間的終止母線電壓須低於額定母線'],
    [v.fsMaxKhz <= v.fsMinKhz, 'fsMaxKhz', '最高頻率須大於最低頻率'],
    [v.driverVccMinV!==null && v.driverVccMaxV!==null && v.driverVccMinV>v.driverVccMaxV, 'driverVccMaxV', '供電最大值須大於或等於最小值'],
    [v.bootstrapMinV!==null && v.bootstrapMaxV!==null && v.bootstrapMinV>v.bootstrapMaxV, 'bootstrapMaxV', '自舉供電最大值須大於或等於最小值'],
  ] as const) if (invalid) ctx.addIssue({code: 'custom', path: [path], message});
});
export type Spec = z.infer<typeof specSchema>;
export const defaultSpec: Spec = specSchema.parse({
  vacMin: 90, vacMax: 264, outputV: 48, outputA: 10, busV: 400, busMinV: 320,
  pfcEfficiency: 98, dcEfficiency: 98, targetEfficiency: 96, powerFactor: .99,
  holdMs: 20, bulkUf: 330, capTolerance: 20, lrUh: 30, crNf: 82, lmUh: 180,
  primaryTurns: 16, secondaryTurns: 4, fsMinKhz: 70, fsMaxKhz: 200,
  ambientC: 40, caseLimitC: 70, thermalResistance: null,
});
export const fingerprint = (s: Spec) => JSON.stringify(specSchema.parse(s));
export const evidenceSchema = z.object({
  verdict: z.enum(['pass', 'fail', 'na']), note: z.string().min(8).max(4000),
  method: z.enum(['measurement', 'simulation', 'review']), specKey: z.string().max(5000),
  updatedAt: z.string().datetime(),
}).strict();
export type Evidence = z.infer<typeof evidenceSchema>;
export const projectSchema = z.object({
  format: z.enum(['power-design-360/v1','power-design-360/v2']), id: z.string().min(1).max(100),
  name: z.string().min(1).max(80), description: z.string().max(1000),
  spec: specSchema, evidence: z.record(z.string().max(100), evidenceSchema),
  updatedAt: z.string().datetime(),
}).strict().transform(p=>({...p,format:'power-design-360/v2' as const}));
export type Project = z.infer<typeof projectSchema>;
export function projectId(): string {
  // getRandomValues also works on HTTP previews; randomUUID requires a secure context.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
export function newProject(name?: string, topology: Spec['topology'] = 'llc-center-tapped'): Project {
  const hw=topology==='hwllc';
  return {format: 'power-design-360/v2', id: projectId(), name: name??(hw?'240 W 主動橋 + HWLLC 示範':'480 W PFC + LLC 示範'), description: '通用教學範例；所有效率與邊界條件均需依實機驗證。', spec: {...defaultSpec,...(hw?{topology,rectifier:'tea2209' as const,outputInterface:'usb-pd' as const,outputA:5}:{})}, evidence: {}, updatedAt: new Date().toISOString()};
}
export type Check = {id: string; title: string; status: 'pass' | 'fail' | 'pending'; detail: string};
export type Result = {
  version: string; fingerprint: string;
  metrics: {outputW: number; inputW: number; busW: number; efficiency: number; inputLowA: number; inputHighA: number; pfcLossW: number; dcLossW: number; totalLossW: number; boostDuty: number | null; requiredCapUf: number; effectiveCapUf: number; holdMs: number; frKhz: number|null; fpKhz: number|null; k: number|null; q: number|null; ratio: number|null; rac: number|null; gainTarget: number|null; gainHold: number|null; caseC: number | null; bridgeConductionW: number|null};
  curves: {frequency: number; low: number; half: number; full: number}[];
  checks: Check[];
};
