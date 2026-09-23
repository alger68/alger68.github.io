import { Input } from '@/components/ui/input';
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from '@/components/ui/select';
import type { Spec } from '@/lib/power/model';
import { Cable, CircuitBoard, Thermometer, Waves } from 'lucide-react';
type NumericKey = {[K in keyof Spec]: Spec[K] extends number|null ? K : never}[keyof Spec];
type Field = {key:NumericKey;label:string;unit:string;hint?:string;optional?:boolean};
type Group = {title:string;sub:string;icon:typeof Cable;fields:Field[]};
export type SpecChange = <K extends keyof Spec>(key:K,value:Spec[K])=>void;
function Choice({id,label,value,onValue,items}:{id:string;label:string;value:string;onValue:(v:string)=>void;items:[string,string][]}) {
 return <div className="field"><label htmlFor={id}>{label}</label><Select value={value} onValueChange={onValue}><SelectTrigger id={id} className="w-full"><SelectValue/></SelectTrigger><SelectContent>{items.map(([v,t])=><SelectItem key={v} value={v}>{t}</SelectItem>)}</SelectContent></Select></div>;
}
export function SpecEditor({spec,onChange,issues}:{spec:Spec;onChange:SpecChange;issues:Record<string,string>}) {
 const hw=spec.topology==='hwllc', active=spec.rectifier==='tea2209';
 const groups:Group[]=[
 {title:'輸入與輸出',sub:'每次計算對應一個輸入／輸出工作點',icon:Cable,fields:[
  {key:'vacMin',label:'最低輸入電壓',unit:'VAC'},{key:'vacMax',label:'最高輸入電壓',unit:'VAC'},
  {key:'outputV',label:'輸出電壓',unit:'V'},{key:'outputA',label:'輸出電流',unit:'A'},
  {key:'pfcEfficiency',label:'整流＋PFC 預估效率',unit:'%',hint:'從 AC 輸入到母線；已含主動橋損耗。'},
  {key:'dcEfficiency',label:'DC/DC 預估效率',unit:'%'},{key:'targetEfficiency',label:'整機效率目標',unit:'%'},
  {key:'powerFactor',label:'假設功率因數',unit:'PF',hint:'用於估計輸入 RMS 電流，並非諧波分析。'}]},
 {title:'母線與保持時間',sub:hw?'自適應母線：請填本次工況的起始電壓':'能量平衡，含電容負容差',icon:CircuitBoard,fields:[
  {key:'busV',label:'本工況母線電壓',unit:'V'},{key:'busMinV',label:'保持終止母線電壓',unit:'V'},
  {key:'holdMs',label:'保持時間需求',unit:'ms'},{key:'bulkUf',label:'母線標稱電容量',unit:'µF'},
  {key:'capTolerance',label:'電容量負容差',unit:'%',hint:'能量足夠仍需驗證低母線下的輸出調節與 VCC。'}]},
 {title:hw?'HWLLC 諧振槽記錄':'LLC 諧振槽',sub:hw?'待電路圖確認接法；目前只記錄，不推導增益':'半橋 · 中心抽頭全波整流 · FHA',icon:Waves,fields:[
  ...(hw?[
    {key:'hwLrUh',label:'HWLLC Lr',unit:'µH',optional:true},{key:'hwLmUh',label:'HWLLC Lm',unit:'µH',optional:true},
    {key:'hwCr1Nf',label:'HWLLC Cr1',unit:'nF',optional:true},{key:'hwCr2Nf',label:'HWLLC Cr2',unit:'nF',optional:true},
    {key:'hwPrimaryTurns',label:'HWLLC Np',unit:'turns',optional:true},
    {key:'hwSecondaryTurns',label:'HWLLC Ns',unit:'turns',optional:true,hint:'實際次級繞組；不沿用中心抽頭半繞組定義。'},
  ] as Field[]:[
    {key:'lrUh',label:'諧振電感 Lr',unit:'µH'},{key:'crNf',label:'諧振電容 Cr',unit:'nF'},
    {key:'lmUh',label:'磁化電感 Lm',unit:'µH'},{key:'primaryTurns',label:'一次側匝數 Np',unit:'turns'},
    {key:'secondaryTurns',label:'次級半繞組 Ns',unit:'turns',hint:'Ns 指中心抽頭次級的一半。'}
  ] as Field[]),
  {key:'fsMinKhz',label:'最低開關頻率',unit:'kHz'},{key:'fsMaxKhz',label:'最高開關頻率',unit:'kHz',hint:hw?'填入切換週期頻率，非 burst 群組頻率；須核對 IC 選項。':undefined}]},
 {title:'環境與熱預算',sub:'整機集總模型，非半導體接面溫度',icon:Thermometer,fields:[
  {key:'ambientC',label:'環境溫度',unit:'°C'},{key:'caseLimitC',label:'機殼溫度上限',unit:'°C'},
  {key:'thermalResistance',label:'整機有效熱阻',unit:'°C/W',optional:true,hint:'需依結構與安裝方式驗證；未知留白。'}]},
 ];
 if(active)groups.push({title:'TEA2209T 主動橋',sub:'四顆相同 MOSFET；每次導通經過兩顆',icon:Cable,fields:[
  {key:'bridgeRdsOnMohm',label:'單顆熱態 RDS(on)',unit:'mΩ',optional:true,hint:'使用實際閘壓與接面溫度下的值；僅估導通損耗，不含 IC、閘極及體二極體。'}]});
 if(hw)groups.push({title:'驅動器與 SR 工作包絡',sub:'有效切換期間的最差值；未知留白，不納入停機時的 0 V',icon:CircuitBoard,fields:[
  {key:'driverVccMinV',label:'RRW40120 最低 VCC',unit:'V',optional:true},
  {key:'driverVccMaxV',label:'RRW40120 最高 VCC',unit:'V',optional:true},
  {key:'bootstrapMinV',label:'最低 VB − VS',unit:'V',optional:true},
  {key:'bootstrapMaxV',label:'最高 VB − VS',unit:'V',optional:true},
  {key:'driverVsPeakV',label:'RRW40120 VS 正峰值',unit:'V',optional:true,hint:'在 IC 腳量測，含振鈴；負壓與 dv/dt 另列手動檢核。'},
  {key:'srVdPeakV',label:'RRW43110 VD 正峰值',unit:'V',optional:true,hint:'IC 建議上限 135 V；不是外部 SR MOSFET 的耐壓。'}]});
 return <><section className="panel topology-editor"><div className="panel-heading"><div className="icon-tile"><CircuitBoard size={20}/></div><div><h2>架構與介面</h2><p>AC 主動全橋是整流級；HWLLC 使用高頻半橋功率級。</p></div></div><div className="topology-fields">
  <Choice id="topology" label="DC/DC 拓樸" value={spec.topology} onValue={v=>onChange('topology',v as Spec['topology'])} items={[["hwllc","HWLLC · RRW11011 平台"],["llc-center-tapped","一般 LLC · 中心抽頭全波"]]}/>
  <Choice id="rectifier" label="AC 整流級" value={spec.rectifier} onValue={v=>onChange('rectifier',v as Spec['rectifier'])} items={[["tea2209","主動全橋 · TEA2209T"],["diode","二極體橋式整流"]]}/>
  <Choice id="outputInterface" label="輸出介面" value={spec.outputInterface} onValue={v=>onChange('outputInterface',v as Spec['outputInterface'])} items={[["usb-pd","單埠 USB PD EPR"],["dc","專用 DC／整機功率預算"]]}/>
  {active&&<Choice id="bridgeCompPol" label="TEA2209T COMP_POL 接法" value={spec.bridgeCompPol} onValue={v=>onChange('bridgeCompPol',v as Spec['bridgeCompPol'])} items={[["unknown","待確認"],["gnd","接 GND · COMP 低電位停用"],["vcc","接 VCC · COMP 高電位停用"]]}/>}
 </div><p className="panel-footnote">切換拓樸保留各自的諧振槽欄位，兩者互不換算。預設值是示範，請依實機修改。</p></section>
 <div className="spec-grid">{groups.map(g=><section className="panel" key={g.title}><div className="panel-heading"><div className="icon-tile"><g.icon size={20}/></div><div><h2>{g.title}</h2><p>{g.sub}</p></div></div><div className="field-grid">{g.fields.map(f=><div className="field" key={f.key}><label htmlFor={f.key}>{f.label}</label><div className="input-unit"><Input id={f.key} type="number" step="any" value={Number.isNaN(spec[f.key])?'':spec[f.key]??''} placeholder={f.optional?'待提供':''} onChange={e=>onChange(f.key,e.target.value===''?(f.optional?null:NaN):Number(e.target.value))} aria-invalid={!!issues[f.key]} aria-describedby={issues[f.key]?`${f.key}-error`:undefined}/><span>{f.unit}</span></div>{issues[f.key]?<p id={`${f.key}-error`} className="field-error">{issues[f.key]}</p>:f.hint&&<p className="field-hint">{f.hint}</p>}</div>)}</div></section>)}</div></>;
}
