'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Download,Layers,LoaderCircle,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {defaultRequirements,requirementsSchema,pdOutputPreset,type Requirements} from '@/lib/power/requirements';
import {candidateSummary,type Candidate,type Synthesis} from '@/lib/power/synthesis';
import {newProject,fingerprint,type Project} from '@/lib/power/model';
import {downloadText} from '@/lib/power/report';
import {DesignEvaluation} from './design-evaluation';

type NumericKey={[K in keyof Requirements]:Requirements[K] extends number?K:never}[keyof Requirements];
const f=(n:number,d=2)=>n.toLocaleString('en-US',{maximumFractionDigits:d});
const sources=[['非對稱半橋一階模型 · Infineon V1.0','https://www.infineon.com/assets/row/public/documents/24/42/infineon-design-guide-hybrid-flyback-converter-design-xdps2201-applicationnotes-en.pdf'],['兩相臨界導通 PFC · TI Rev.C','https://www.ti.com/lit/ds/symlink/ucc28063.pdf'],['磁芯／骨架 · TDK ETD39','https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf']];
export function Designer({apiBase,onApply}:{apiBase:string;onApply:(p:Project)=>boolean}){
 const [req,setReq]=useState<Requirements>({...defaultRequirements}),[step,setStep]=useState(0),[result,setResult]=useState<Synthesis|null>(null),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const abort=useRef<AbortController|null>(null),sequence=useRef(0);
 useEffect(()=>()=>{sequence.current++;abort.current?.abort();},[]);
 const parsed=requirementsSchema.safeParse(req),issues:Record<string,string>=parsed.success?{}:Object.fromEntries(parsed.error.issues.map(i=>[i.path[0],i.message]));
 const electricalKeys=new Set(['vacMin','vacMax','lineHz','outputV','outputA','outputInterface','additionalOutputs']);
 const electricalValid=!Object.keys(issues).some(k=>electricalKeys.has(k));
 const candidate=result?.candidates.find(c=>c.id===selected)??result?.candidates[0];
 function change<K extends keyof Requirements>(key:K,value:Requirements[K]){sequence.current++;abort.current?.abort();setBusy(false);setError('');setResult(null);setSelected('');setReq(s=>({...s,[key]:value}));}
 async function generate(){
  if(!parsed.success)return;
  const n=++sequence.current;abort.current?.abort();const controller=new AbortController();abort.current=controller;setBusy(true);setError('');
  const timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(`${apiBase}/api/synthesize`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parsed.data),signal:controller.signal});
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('設計服務暫時無法使用，請重試。');
   const data=await response.json() as Synthesis&{error?:string};if(!response.ok)throw new Error(data.error??'無法產生方案。');
   if(!Array.isArray(data.candidates)||JSON.stringify(data.requirements)!==JSON.stringify(parsed.data))throw new Error('方案與目前需求不一致，請重新產生。');
   if(n===sequence.current){setResult(data);setSelected(data.candidates[0]?.id??'');setStep(2);}
  }catch(e){if(n===sequence.current)setError(e instanceof Error&&e.name==='AbortError'?'設計服務逾時，請重試。':e instanceof Error?e.message:'無法產生方案。');}
  finally{clearTimeout(timer);if(n===sequence.current)setBusy(false);}
 }
 function project(c:Candidate):Project{
  const p=newProject(`HWLLC ${f(req.outputV*req.outputA,0)} W · ${c.fsKhz} kHz 自動起點`,'hwllc');
  p.spec=c.spec;p.description='由需求與跨工況包絡產生的元件起點，含輸出電容候選料號。模型與限制見自動設計紀錄；尚未完成 RRW11011 控制模式、完整 BOM、效率、ZVS 與實機驗證。';
  p.design={modelVersion:result!.version,requirements:result!.requirements,candidateId:c.id,specKey:fingerprint(c.spec),summary:candidateSummary(result!,c)};
  return p;
 }
 function field(key:NumericKey,label:string,unit:string,hint?:string){return <div className="field" key={key}><label htmlFor={`req-${key}`}>{label}</label><div className="input-unit"><Input id={`req-${key}`} type="number" step="any" value={Number.isNaN(req[key])?'':req[key]} onChange={e=>change(key,e.target.value===''?NaN:Number(e.target.value))} aria-invalid={!!issues[key]}/><span>{unit}</span></div>{issues[key]?<p className="field-error">{issues[key]}</p>:hint?<p className="field-hint">{hint}</p>:null}</div>;}
 return <div className="designer">
 <div className="design-hero"><div><span className="subtle-chip"><Sparkles size={13}/> REQUIREMENTS → COMPONENTS</span><h2>先定義需求，讓系統選值。</h2><p>TEA2209T 主動整流 + 交錯 PFC + HWLLC。Lr、Lm、匝數與電容量由系統產生；以下預填為 240 W 示範，可直接修改。</p></div><Layers size={44}/></div>
 <ol className="design-steps">{['電氣需求','邊界條件','自動方案','元件規格'].map((label,i)=><li key={label} className={i===step?'current':i<step?'done':''}><span>{i<step?<Check size={15}/>:i+1}</span>{label}</li>)}</ol>
 {error&&<p role="alert" className="error-banner">{error}</p>}
 {step===0&&<section className="panel"><div className="panel-heading"><div><div className="eyebrow">STEP 01</div><h2>輸入與輸出</h2><p>只需填產品需求，不必先知道電感或變壓器參數。</p></div></div><div className="designer-fields">
 {field('vacMin','最低 AC 輸入','VAC')}{field('vacMax','最高 AC 輸入','VAC')}{field('lineHz','最低電網頻率','Hz')}
 {field('outputV','額定輸出電壓','V')}{field('outputA','額定輸出電流','A')}
 <div className="field"><label htmlFor="req-outputInterface">輸出用途</label><select id="req-outputInterface" value={req.outputInterface} onChange={e=>change('outputInterface',e.target.value as Requirements['outputInterface'])}><option value="usb-pd">單埠 USB PD EPR</option><option value="dc">專用 DC／整機功率預算</option></select><p className="field-hint">主額定值定義最高輸出電壓與整機功率；可在下方加入其他檔位。</p></div></div>
 <div className="extra-requirements"><div className="supplement-heading"><div><h3>其他輸出檔位 <small>選填</small></h3><p>同一組硬體需支援的電壓／電流；每個檔位自動檢查 10–100% 負載。</p></div><div><Button variant="outline" disabled={req.additionalOutputs.length>=6} onClick={()=>change('additionalOutputs',[...req.additionalOutputs,{voltageV:NaN,currentA:Number.isFinite(req.outputA)?req.outputA:1}])}>新增輸出檔位</Button>{req.outputInterface==='usb-pd'&&<Button variant="outline" disabled={!Number.isFinite(req.outputV*req.outputA)||req.outputV<=5||req.outputA<=0} onClick={()=>change('additionalOutputs',pdOutputPreset(req))}>帶入 PD 常用檔位</Button>}</div></div>
 {req.additionalOutputs.map((p,i)=><div className="output-row" key={i}><span>檔位 {i+1}</span><label>輸出電壓<Input type="number" step="any" aria-label={`檔位 ${i+1} 輸出電壓`} value={Number.isNaN(p.voltageV)?'':p.voltageV} onChange={e=>change('additionalOutputs',req.additionalOutputs.map((x,j)=>j===i?{...x,voltageV:e.target.value===''?NaN:Number(e.target.value)}:x))}/><small>V</small></label><label>最大電流<Input type="number" step="any" aria-label={`檔位 ${i+1} 最大電流`} value={Number.isNaN(p.currentA)?'':p.currentA} onChange={e=>change('additionalOutputs',req.additionalOutputs.map((x,j)=>j===i?{...x,currentA:e.target.value===''?NaN:Number(e.target.value)}:x))}/><small>A</small></label><Button variant="ghost" aria-label={`移除檔位 ${i+1}`} onClick={()=>change('additionalOutputs',req.additionalOutputs.filter((_,j)=>j!==i))}>移除</Button></div>)}
 {!parsed.success&&parsed.error.issues.filter(x=>x.path[0]==='additionalOutputs').map((x,i)=><p className="field-error" key={i}>檔位 {typeof x.path[1]==='number'?x.path[1]+1:''}：{x.message}</p>)}
 </div><div className="design-power"><strong>{Number.isFinite(req.outputV*req.outputA)?f(req.outputV*req.outputA,1):'—'} W</strong><span>額定輸出功率 · {req.additionalOutputs.length+1} 個輸出檔位</span></div><div className="design-actions"><span>架構已依你的 HWLLC 與主動橋需求設定。</span><Button disabled={!electricalValid} onClick={()=>setStep(1)}>下一步：邊界條件 <ArrowRight size={16}/></Button></div></section>}
 {step===1&&<section className="panel"><div className="panel-heading"><div><div className="eyebrow">STEP 02</div><h2>輸出品質與工作環境</h2><p>這些是產品應達到的條件；工程選值策略會自動帶入。</p></div></div><div className="designer-fields">
 {field('holdMs','掉電保持時間','ms')}{field('rippleMv','輸出漣波上限（峰對峰）','mV')}{field('targetEfficiency','整機效率目標','%','用於分配損耗預算；不等於預測效率。')}
 {field('stepPercent','負載階躍幅度','% 額定')}{field('transientPercent','瞬態壓降上限','% Vout')}{field('responseUs','容許控制恢復時間','µs','用於保守估算電容供電需求，後續驗證迴路。')}
 {field('ambientC','最高環境溫度','°C')}{field('caseLimitC','機殼溫度上限','°C')}
 <div className="field"><label htmlFor="req-priority">候選排序偏好</label><select id="req-priority" value={req.priority} onChange={e=>change('priority',e.target.value as Requirements['priority'])}><option value="balanced">平衡起點</option><option value="compact">偏小磁件</option><option value="low-frequency">偏低開關頻率</option></select><p className="field-hint">依頻率及磁芯材料體積排序；尚未做實際 BOM 成本與損耗最佳化。</p></div></div>
 <div className="extra-requirements"><div className="supplement-heading"><div><h3>機構與已知散熱限制 <small>選填</small></h3><p>有產品限制再設定；未設定時保持未知。</p></div><div><Button variant="outline" onClick={()=>change('space',req.space?null:{lengthMm:190,widthMm:85,heightMm:40})}>{req.space?'移除空間限制':'設定可用空間'}</Button><Button variant="outline" onClick={()=>change('coolingBudgetW',req.coolingBudgetW===null?NaN:null)}>{req.coolingBudgetW===null?'設定散熱預算':'移除散熱預算'}</Button></div></div>
 {req.space&&<><p className="field-hint">填可供元件使用的空間，扣除外殼與 PCB；初填 190 × 85 × 40 mm 為示範，請依產品修改。</p><div className="designer-fields">{([['lengthMm','可用長度'],['widthMm','可用寬度'],['heightMm','元件高度上限']] as const).map(([key,label])=><div className="field" key={key}><label htmlFor={`space-${key}`}>{label}</label><div className="input-unit"><Input id={`space-${key}`} type="number" step="any" value={Number.isNaN(req.space![key])?'':req.space![key]} onChange={e=>change('space',{...req.space!,[key]:e.target.value===''?NaN:Number(e.target.value)})}/><span>mm</span></div></div>)}</div>{issues.space&&<p className="field-error">可用空間：{issues.space}</p>}</>}
 {req.coolingBudgetW!==null&&<div className="field cooling-field"><label htmlFor="req-coolingBudgetW">可用散熱能力</label><div className="input-unit"><Input id="req-coolingBudgetW" type="number" step="any" value={Number.isNaN(req.coolingBudgetW)?'':req.coolingBudgetW} onChange={e=>change('coolingBudgetW',e.target.value===''?NaN:Number(e.target.value))}/><span>W</span></div><p className={issues.coolingBudgetW?'field-error':'field-hint'}>{issues.coolingBudgetW??'採產品規定或適用溫度條件下的量測值；不知道時可移除此限制，無需猜熱阻。'}</p></div>}
 </div>
 <details className="design-details"><summary>查看系統會自行處理的項目</summary><p>母線電壓、頻率候選、磁通密度起點、電流密度、電容容差、漏感比例與降額由設計策略設定。系統搜尋 3 種磁芯、5 個頻率及整數匝數組合，依跨工況極值選繞組與電容；從 8 顆可查證電容篩選並聯組合。</p><p>控制器各模式、完整 BOM、磁性／半導體損耗及完整機構配置仍需後續驗證。</p></details>
 <div className="design-actions"><Button variant="outline" onClick={()=>setStep(0)}><ArrowLeft size={16}/>返回需求</Button><Button disabled={!parsed.success||busy} onClick={()=>void generate()}>{busy?<LoaderCircle size={16} className="animate-spin"/>:<Sparkles size={16}/>} {busy?'正在選值…':'自動產生設計方案'}</Button></div></section>}
 {step===2&&result&&<><div className="design-result-heading"><div><h2>{result.candidates.length?'已產生候選方案':'目前條件沒有可用候選'}</h2><p>已檢查 {result.explored.toLocaleString()} 組磁芯、頻率與匝數組合。這是初始設計篩選，尚未完成控制器與硬體驗證。</p></div><Button variant="outline" onClick={()=>setStep(1)}>修改需求</Button></div>
 {result.blockers.map(b=><p role="alert" className="error-banner" key={b}>{b}</p>)}
 {result.candidates.length>0&&<p className="envelope-note">每個候選已計入 {req.additionalOutputs.length+1} 個輸出檔位的模型工況；需要控制模式驗證的項目會保留標示。</p>}
 <div className="candidate-grid">{result.candidates.map((c,i)=><button type="button" key={c.id} aria-pressed={c.id===selected} className={`candidate-card ${c.id===selected?'selected':''}`} onClick={()=>setSelected(c.id)}><span className="candidate-kicker">{i===0?'建議起點':`備選 ${i}`}</span><h3>{c.fsKhz} <small>kHz</small></h3><p>{c.core} · {c.np}:{c.ns} 匝</p><dl><div><dt>Lm / Lr</dt><dd>{f(c.lmUh,1)} / {f(c.lrUh,2)} µH</dd></div><div><dt>Cr1 / Cr2</dt><dd>{f(c.cr1Nf,1)} / {f(c.cr2Nf,1)} nF</dd></div><div><dt>輸出電容組</dt><dd>{f(c.outputCapUf,0)} µF / {c.outputCapV} V</dd></div><div><dt>磁通 / 銅填充</dt><dd>{f(c.bPeakT,3)} T / {f(c.fill*100,1)}%</dd></div><div><dt>磁芯材料體積指標</dt><dd>{f(c.magneticVolumeCm3,1)} cm³</dd></div></dl><span className="candidate-select">{c.id===selected?<><Check size={15}/>已選擇</>:'選擇此方案'}</span></button>)}</div>
 <p className="panel-footnote">材料體積含兩顆 PFC 磁芯與變壓器磁芯，不等於成品外形或整機體積。推薦排序沒有使用未驗證的效率分數。</p>{result.candidates.length>0&&<p className="panel-footnote">候選排除記錄：頻率 {result.rejections.frequency} · 磁通 {result.rejections.flux} · 填充 {result.rejections.fill} · 面積 {result.rejections.space}。各組以第一個不符合條件計數。</p>}
 <div className="design-actions"><span>你可以比較取捨，或直接使用建議起點。</span><Button disabled={!candidate} onClick={()=>setStep(3)}>查看完整元件規格 <ArrowRight size={16}/></Button></div></>}
 {step===3&&result&&candidate&&<><ComponentResults result={result} c={candidate}/><DesignEvaluation key={candidate.id} c={candidate} result={result}/><details className="design-details"><summary>模型來源、系統假設與待驗證項目</summary><ul>{result.assumptions.map(a=><li key={a}>{a}</li>)}</ul><p>本輪系統策略：Bpk ≤ {result.policy.bPeakT} T、J = {result.policy.currentDensity} A/mm²、銅填充 ≤ {f(result.policy.fillMax*100,0)}%。</p><ul>{sources.map(([label,url])=><li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>)}</ul></details>
 <div className="design-actions wrap"><Button variant="outline" onClick={()=>setStep(2)}><ArrowLeft size={16}/>比較方案</Button><div><Button variant="outline" onClick={()=>downloadText('hwllc-design-seed.txt',candidateSummary(result,candidate)+'\n\n原始需求：\n'+JSON.stringify(req,null,2),'text/plain;charset=utf-8')}><Download size={16}/>下載選值報告</Button><Button variant="outline" onClick={()=>downloadText('hwllc-design-project.json',JSON.stringify(project(candidate),null,2),'application/json')}>匯出專案 JSON</Button><Button onClick={()=>onApply(project(candidate))}>建立專案並驗算 <ArrowRight size={16}/></Button></div></div></>}
 </div>;
}
function ComponentResults({result:r,c}:{result:Synthesis;c:Candidate}){
 const rows=[
 ['兩相 PFC 電感',`每相 ${f(c.pfcLuh)} µH`,`${c.pfcCore} × 2；各 ${c.pfcTurns} 匝；Ipk ${f(c.pfcPeakA)} A，Irms ${f(c.pfcRmsA)} A`],
 ['PFC 繞組／氣隙',`銅面積 ≥ ${f(c.pfcCopperMm2)} mm²`,`AL ${f(c.pfcAlNh)} nH/turn²；等效氣隙約 ${f(c.pfcGapMm)} mm；磁芯磁阻與邊緣效應未計`],
 ['母線電容組',`${f(c.bulkUf,0)} µF / ${c.bulkVoltageV} V`,`含 −20% 容差，${f(r.policy.busStartV)} → ${f(r.policy.busStopV)} V 可供 ${f(c.holdActualMs)} ms；需再核對漣波額定與壽命`],
 ['變壓器',`${c.core} · ${c.np}:${c.ns} 匝`,`N87 候選材料；骨架 ${c.bobbin}；峰值磁通 ${f(c.bPeakT,3)} T`],
 ['初級感量',`Lm ${f(c.lmUh)} µH · Lr ${f(c.lrUh)} µH`,`Lp = Lm + Lr = ${f(c.lpUh)} µH；漏感為製造目標，需量測校準`],
 ['變壓器 AL／氣隙',`${f(c.alNh)} nH/turn² · 約 ${f(c.gapMm)} mm`,'氣隙為忽略磁芯磁阻與邊緣效應的起點，不是加工圖'],
 ['初／次級繞線',`${c.primaryStrands} / ${c.secondaryStrands} 股 × Ø${c.strandMm} mm`,`銅面積 ${f(c.primaryCopperMm2)} / ${f(c.secondaryCopperMm2)} mm²；需核對漆膜、絕緣與 AC 損耗`],
 ['諧振電容 Cr1 / Cr2',`${f(c.cr1Nf)} / ${f(c.cr2Nf)} nF · 各 ${c.crVoltageV} V`,`RMS 額定需求 ≥ ${f(c.cr1RippleA)} / ${f(c.cr2RippleA)} A；薄膜或合適高頻介質，需核對脈衝與溫度`],
 ['輸出電容規格需求',`${f(c.outputCapUf,0)} µF / ${c.outputCapV} V`,`合成 ESR ≤ ${f(c.outputEsrMaxMohm)} mΩ；漣波電流額定 ≥ ${f(c.outputRippleRatingA)} A；實際並聯組合見下方`],
 ['次級 SR MOSFET',`${c.srRatingV} V 耐壓起點`,`理想最大應力 ${f(c.srIdealV)} V；不含振鈴。RRW43110 VD 腳需另守 135 V 建議上限`],
 ['整機散熱需求',`有效熱阻 ≤ ${f(r.thermal.maxThetaCPerW)} °C/W`,`依 ${f(r.thermal.lossBudgetW)} W 損耗預算；未將未知熱阻或效率當作實測值`],
 ];
 return <section className="panel component-results"><div className="panel-heading spread"><div><div className="eyebrow">STEP 04 · DESIGN SEED</div><h2>系統產生的元件規格</h2><p>{r.requirements.outputV} V / {r.requirements.outputA} A · 額定母線 {r.policy.busV} V · {c.fsKhz} kHz · 後續可在進階頁調整</p></div><span className="subtle-chip">初估，待驗證</span></div><div className="design-table-wrap"><table><thead><tr><th>元件／項目</th><th>自動選值</th><th>選用條件</th></tr></thead><tbody>{rows.map(([name,value,reason])=><tr key={name}><th scope="row">{name}</th><td>{value}</td><td>{reason}</td></tr>)}</tbody></table></div></section>;
}
