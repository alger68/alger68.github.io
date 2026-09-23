import { Input } from '@/components/ui/input';
import type { Spec } from '@/lib/power/model';
import { Cable, CircuitBoard, Thermometer, Waves } from 'lucide-react';
type Field = {key:keyof Spec;label:string;unit:string;hint?:string};
const groups: {title:string;sub:string;icon:typeof Cable;fields:Field[]}[] = [
 {title:'輸入與輸出',sub:'單相 AC → Boost PFC → 半橋 LLC',icon:Cable,fields:[
  {key:'vacMin',label:'最低輸入電壓',unit:'VAC'},{key:'vacMax',label:'最高輸入電壓',unit:'VAC'},
  {key:'outputV',label:'輸出電壓',unit:'V'},{key:'outputA',label:'輸出電流',unit:'A'},
  {key:'pfcEfficiency',label:'PFC 預估效率',unit:'%'},{key:'dcEfficiency',label:'LLC 預估效率',unit:'%'},
  {key:'targetEfficiency',label:'整機效率目標',unit:'%'},{key:'powerFactor',label:'假設功率因數',unit:'PF',hint:'用於估計輸入 RMS 電流，並非諧波分析。'}]},
 {title:'母線與保持時間',sub:'依能量平衡計算，含負容差',icon:CircuitBoard,fields:[
  {key:'busV',label:'額定母線電壓',unit:'V'},{key:'busMinV',label:'保持終止母線電壓',unit:'V'},
  {key:'holdMs',label:'保持時間需求',unit:'ms'},{key:'bulkUf',label:'母線標稱電容量',unit:'µF'},
  {key:'capTolerance',label:'電容量負容差',unit:'%',hint:'有效值 = 標稱電容量 × (1 − 負容差)。'}]},
 {title:'LLC 諧振槽',sub:'半橋 · 中心抽頭全波整流 · FHA',icon:Waves,fields:[
  {key:'lrUh',label:'諧振電感 Lr',unit:'µH'},{key:'crNf',label:'諧振電容 Cr',unit:'nF'},
  {key:'lmUh',label:'磁化電感 Lm',unit:'µH'},{key:'primaryTurns',label:'一次側匝數 Np',unit:'turns'},
  {key:'secondaryTurns',label:'次級半繞組 Ns',unit:'turns',hint:'Ns 指中心抽頭次級的一半，不是全繞組。'},
  {key:'fsMinKhz',label:'最低開關頻率',unit:'kHz'},{key:'fsMaxKhz',label:'最高開關頻率',unit:'kHz'}]},
 {title:'環境與熱預算',sub:'整機集總模型，非半導體接面溫度',icon:Thermometer,fields:[
  {key:'ambientC',label:'環境溫度',unit:'°C'},{key:'caseLimitC',label:'機殼溫度上限',unit:'°C'},
  {key:'thermalResistance',label:'整機有效熱阻（選填）',unit:'°C/W',hint:'需由對應結構與安裝方式驗證；未知請留白。'}]},
];
export function SpecEditor({spec,onChange,issues}:{spec:Spec;onChange:(key:keyof Spec,value:number|null)=>void;issues:Record<string,string>}) {
 return <div className="spec-grid">{groups.map(g=><section className="panel" key={g.title}><div className="panel-heading"><div className="icon-tile"><g.icon size={20}/></div><div><h2>{g.title}</h2><p>{g.sub}</p></div></div><div className="field-grid">{g.fields.map(f=><div className="field" key={f.key}><label htmlFor={f.key}>{f.label}</label><div className="input-unit"><Input id={f.key} type="number" step="any" value={spec[f.key]??''} placeholder={f.key==='thermalResistance'?'尚未建立':''} onChange={e=>onChange(f.key,e.target.value===''&&f.key==='thermalResistance'?null:Number(e.target.value))} aria-invalid={!!issues[f.key]} aria-describedby={issues[f.key]?`${f.key}-error`:undefined}/><span>{f.unit}</span></div>{issues[f.key]?<p id={`${f.key}-error`} className="field-error">請檢查數值範圍與上下限關係。</p>:f.hint&&<p className="field-hint">{f.hint}</p>}</div>)}</div></section>)}</div>;
}
