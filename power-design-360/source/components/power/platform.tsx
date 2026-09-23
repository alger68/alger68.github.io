import {ArrowRight,ExternalLink,CircuitBoard} from 'lucide-react';
import type {Spec} from '@/lib/power/model';
export function Platform({spec}:{spec:Spec}) {
 return <section className="panel platform-panel"><div className="panel-heading spread"><div><div className="eyebrow">HWLLC PLATFORM</div><h2>控制鏈與驗證邊界</h2><p>Half-Wave LLC · 半波次級整流</p></div><CircuitBoard size={26}/></div>
 <div className="platform-route"><div><span>AC 整流</span><strong>{spec.rectifier==='tea2209'?'TEA2209T':'二極體橋'}</strong><p>{spec.rectifier==='tea2209'?'四顆 MOSFET 主動全橋':'全波橋式整流'}</p></div><ArrowRight/><div><span>交錯 Boost PFC</span><strong>RRW11011</strong><p>兩相電流／自適應母線</p></div><ArrowRight/><div><span>HWLLC 功率級</span><strong>RRW40120</strong><p>高、低側閘極驅動</p></div></div>
 <div className="platform-detail"><div><strong>RRW43110 · 次級 SR</strong><p>依 VDS 感測控制同步整流。VD 腳正峰值、負向振鈴及開關頻率需個別確認。</p></div><div><strong>RRW30120 · 次級回授／PD</strong><p>經光耦回授到 RRW11011。{spec.outputInterface==='usb-pd'?'單埠 EPR 最高 240 W；需再驗證 PDO、線材與升降壓轉換。':'目前為 DC／整機預算，端口分配與 RRW30120 韌體設定需另行確認。'}</p></div></div>
 <div className="model-pending"><strong>HWLLC 增益模型：待建立</strong><p>目前可計算功率、保持能量與熱預算，並比對控制器工作範圍。Cr1／Cr2、Lr／Lm 與匝數先獨立記錄；完整增益、電流應力與 ZVS 需實際電路圖和控制時序。</p></div>
 <a className="platform-source" href="https://www.renesas.com/en/document/sds/rrw11011-short-form-datasheet" target="_blank" rel="noreferrer">RRW11011 官方架構 · 簡版 Rev.0.01 <ExternalLink size={14}/></a>
 </section>;
}
