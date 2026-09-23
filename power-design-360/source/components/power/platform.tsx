import {ArrowRight,ExternalLink,CircuitBoard} from 'lucide-react';
import type {Spec,Result} from '@/lib/power/model';
export function Platform({spec,result}:{spec:Spec;result:Result|null}) {
 const m=result?.metrics;
 const value=(n:number|null|undefined,d=3)=>n==null?'—':n.toFixed(d);
 return <section className="panel platform-panel"><div className="panel-heading spread"><div><div className="eyebrow">HWLLC PLATFORM</div><h2>控制鏈與驗證邊界</h2><p>Half-Wave LLC · 半波次級整流</p></div><CircuitBoard size={26}/></div>
 <div className="platform-route"><div><span>AC 整流</span><strong>{spec.rectifier==='tea2209'?'TEA2209T':'二極體橋'}</strong><p>{spec.rectifier==='tea2209'?'四顆 MOSFET 主動全橋':'全波橋式整流'}</p></div><ArrowRight/><div><span>交錯 Boost PFC</span><strong>RRW11011</strong><p>兩相電流／自適應母線</p></div><ArrowRight/><div><span>HWLLC 功率級</span><strong>RRW40120</strong><p>高、低側閘極驅動</p></div></div>
 <div className="platform-detail"><div><strong>RRW43110 · 次級 SR</strong><p>依 VDS 感測控制同步整流。VD 腳正峰值、負向振鈴及開關頻率需個別確認。</p></div><div><strong>RRW30120 · 次級回授／PD</strong><p>經光耦回授到 RRW11011。{spec.outputInterface==='usb-pd'?'單埠 EPR 最高 240 W；需再驗證 PDO、線材與升降壓轉換。':'目前為 DC／整機預算，端口分配與 RRW30120 韌體設定需另行確認。'}</p></div></div>
 <div className="tank-diagnostic"><div className="eyebrow">LC TIME SCALE</div><h3>分割電容支路估算</h3><p>接法：{spec.hwCapConnection==='split-bus'?'已確認母線分割接法':'待確認／其他接法'}。母線視為交流短路時，Cac = Cr1 + Cr2。</p><dl className="tank-values"><div><dt>交流電容量</dt><dd>{value(m?.hwCapSumNf)} <small>nF</small></dd></div><div><dt>LC 固有頻率</dt><dd>{value(m?.hwTankFrKhz,2)} <small>kHz</small></dd></div><div><dt>LC 半週期</dt><dd>{value(m?.hwTankHalfUs)} <small>µs</small></dd></div><div><dt>Cr1 / Cr2</dt><dd>{value(m?.hwCapRatio,4)}</dd></div><div><dt>Ton,LS / 半週期</dt><dd>{value(m?.hwOnHalfRatio)}</dd></div></dl><p className="panel-footnote">fLC = 1 / (2π√(Lr·Cac))；半週期 = π√(Lr·Cac)。未包含 Lm、整流狀態、寄生與損耗。時間比接近 1 也不代表設計通過。</p></div>
 <div className="model-pending"><strong>HWLLC 增益與 ZVS：仍待驗證</strong><p>LC 估算描述支路時間尺度，不等於控制器開關頻率或完整 HWLLC 諧振模型。完整增益、電流應力與 ZVS 需實際電路圖、控制時序和波形。</p></div>
 <a className="platform-source" href="https://www.renesas.com/en/document/sds/rrw11011-short-form-datasheet" target="_blank" rel="noreferrer">RRW11011 官方架構 · 簡版 Rev.0.01 <ExternalLink size={14}/></a>
 </section>;
}
