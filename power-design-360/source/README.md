# Power Design 360

繁體中文電源設計工作台，結合 React 操作介面、TypeScript 計算 API、16 面向工程審查與原廠資料庫。

- 網站：https://power-design-360.ifluit.chatgpt.site
- GitHub 前端入口：https://alger68.github.io/power-design-360/
- 原始碼位置：`alger68/alger68.github.io` 的 `power-design-360/source/`
- 版本：0.2.0

## 已實作

- 建立、命名及複製專案；各瀏覽器保存最多 30 案。
- 依拓樸顯示參數，由後端重新驗證；未知應力與熱阻可留白。
- PFC / LLC 功率預算、RMS 輸入電流、Boost 峰值工作點占空比。
- 含負容差的母線電容能量預算；一般 LLC 可計算諧振頻率、k、Q、Rac 及 FHA 曲線。
- HWLLC 專用範本：TEA2209T → RRW11011 PFC／HWLLC → RRW40120／RRW43110／RRW30120；Cr1／Cr2 與磁性參數獨立記錄。
- 單埠 USB PD EPR 上限檢查（48 V、5 A、240 W），與專用 DC／整機總功率分開。
- 一般 LLC 五項解析檢核；HWLLC 平台增加驅動供電、SR／驅動應力及頻率檢核，依整流／輸出選項加入橋式預算與單埠 PD 上限。未知項維持「待驗證」。
- 16 個面向、38 項手動審查，記錄判定、證據類型、報告說明、時間與精確規格版本。
- 規格變更會使舊證據標記「需重審」；不同分頁儲存衝突會暫停寫入並提示備份。
- 最多三案比較、JSON 匯入匯出、可列印為 PDF 的 HTML 報告。
- 23 項原廠 / 標準組織官方資源與查核版本。
- 響應式版面、鍵盤可操作的表單與對話框。

## 架構

```text
React 工作台 → POST /api/calculate → Zod 驗證 → 解析引擎 → 結果 / 曲線 / 規則
      ↓
瀏覽器 localStorage ←→ 專案 JSON
```

`app/` 提供 Vinext 全端網站與 API routes。`frontend/` 是同一套 React UI 的靜態入口，可放在 GitHub Pages。**GitHub Pages 不執行後端**；它呼叫公開部署的計算 API。沒有帳號、資料庫或雲端共同編輯。

| 路徑 | 用途 |
| --- | --- |
| `components/power/` | 操作介面、參數、檢核、比較與資料庫 |
| `lib/power/model.ts` | 版本、輸入及可攜專案資料格式 |
| `lib/power/engine.ts` | 純函式解析引擎 |
| `lib/power/api.ts` | JSON 大小限制、伺服器驗證與 CORS |
| `lib/power/catalog.ts` | 可自訂的 16 面向規範及官方來源 |
| `lib/power/review.ts` | 證據有效性與統計 |
| `lib/power/storage.ts` | 版本化本地保存與分頁衝突保護 |
| `lib/power/report.ts` | HTML 報告與文字跳脫 |
| `tests/` | 數值、API、證據、儲存與報告回歸測試 |

## 本機開發

需要 Node.js 22.13+ 與 pnpm。請保留 `pnpm-lock.yaml`。

```bash
cd power-design-360/source
pnpm install --frozen-lockfile
pnpm dev
```

依終端機顯示的網址開啟。公開版本的原始碼含非機密 `.openai/hosting.json`（不含網站擁有者識別）；在 Sites 中部署新站時，由平台註冊自己的專案識別碼。

```bash
pnpm test
pnpm typecheck
pnpm build
```

全端建置輸出是 Cloudflare Workers 相容的 `dist/server/index.js`。使用 Sites 時由 Sites 工作流程註冊、建置與發佈；不應重用他人的網站識別碼或憑證。要改成獨立 Cloudflare 部署，請建立自己的 Worker 設定與資源，並確認建置後的 Wrangler 設定；本版未驗證獨立帳戶的部署流程。

## GitHub Pages 前端

```bash
pnpm build:pages
```

把 `dist-pages/` 的內容放到 GitHub Pages 來源分支的 `power-design-360/`。不要把整個原始碼當作建置產物。儲存庫其他頁面應保留。

自有後端可在建置時設定 `VITE_POWER_API_BASE`，或調整 `frontend/main.tsx`。若前端不在 `/power-design-360/`，請修改 `vite.pages.config.ts` 的 `base`。自訂網域需同步調整 `lib/power/api.ts` 的 `allowedOrigins`。這是公開且無機密資料的計算 API；CORS 是瀏覽器存取規則，並非身分驗證或防濫用機制。

## API

`POST /api/calculate` 接受 `model.ts` 的純規格物件，`Content-Type: application/json`，上限 16 KB。成功回傳引擎版本、規格指紋、數值、曲線與解析檢核。格式錯誤回傳 400；超大資料 413；格式類型不符 415；參數不合法 422。

`GET /api/health` 回傳引擎版本與服務狀態。不接收專案名稱或檢核證據，也不在應用層保存請求內容。部署平台仍可能保留一般請求日誌。

## 工程假設

提供 **一般 LLC** 與 **RRW11011 HWLLC** 兩個模式。能量與熱預算共用；前級（整流＋PFC）和 DC/DC 效率、PF 是使用者假設。前級效率已包含整流橋，不能再加一次橋式損耗。

HWLLC 的 Cr1／Cr2、Lr／Lm、Np／Ns 是獨立記錄，預設未知。HWLLC 返回空的增益曲線及 null 諧振／Q／Rac／增益；不能沿用中心抽頭模型，也不由兩顆電容直接推算等效諧振。完整模型需實際電路圖、控制器選項、時序與波形驗證。母線可隨輸入／輸出變動；每次能量預算只對指定工作點有效。

以下 FHA 公式只適用 **半橋 LLC + 中心抽頭全波整流**，Ns 指半個次級繞組：

- 功率：Pbus = Pout / ηLLC；Pin = Pbus / ηPFC。
- 保持時間：t = Ceff(Vbus² − Vend²) / (2Pbus)。不含 ESR、老化與額外控制損耗。
- fr = 1/(2π√LrCr)，k=Lm/Lr，Rac=8n²Rload/π²，Q=√(Lr/Cr)/Rac。
- FHA：M=1/√((1+(1−1/Fn²)/k)²+Q²(Fn−1/Fn)²)，Fn=fs/fr。
- 需求增益：Mtarget=2nVo/Vbus；保持終點另以 Vend 計算。
- 主動橋導通分項：2 × RDS(on,hot) × Iac,rms²，假設四顆相同 MOSFET；不含 IC、閘極、體二極體與換流。此項只與前級損耗預算比較，不改動總損耗。
- 集總機殼溫度：Tamb+Ploss×Rθeffective，須有適用的熱路徑證據，不推算半導體接面溫度。

沒有 SPICE、非線性磁性、寄生、整流壓降、控制迴路、實際 ZVS 判定、EMI 預測、元件壽命模型或自動認證判定。諧振點位於頻率範圍只代表範圍條件，不代表設計可行或可量產。

## 資料與擴充

`localStorage` 不是雲端備份；不同網域各有自己的儲存空間。請定期匯出 JSON。匯入會建立新專案 ID，保留規格及證據；複製方案會清空證據，避免把舊方案的測試當成新方案的結果。

v0.1 的 v1 專案仍可讀取，缺少拓樸欄位時明確視為一般 LLC／二極體橋／DC 輸出。匯出使用 v2；保留舊證據文字，因規格擴充而需重審。localStorage 保留原 key，以找到既有資料。

控制器數值來源：RRW40120 Rev.0.04 第 6 頁（VCC／VBS 10–18 V、VS 上限 600 V）；RRW43110 Rev.0.03 第 1、6 頁（300 kHz、VD 建議 135 V／絕對最大 145 V）。範圍檢核不代表整機通過；負壓、dv/dt、溫度、閘壓、元件降額、啟動及量測可信度仍需證據。官方來源版本與連結見網站資料庫；不包含使用者提供的原始 PDF。

規範條目在 `catalog.ts` 維護；增加自動計算應同時加入獨立數值測試、適用條件、來源及引擎版本。未來可增加磁性設計、元件應力、實測資料、權限、專案数据库及審核簽章。

本專案提供原始碼供查閱；擁有者尚未指定原創程式碼的公開授權。第三方套件、字型、標準與原廠文件適用各自授權。官方資料只提供連結，不重製付費標準或宣稱第三方認證。
