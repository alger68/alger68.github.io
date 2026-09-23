# Power Design 360

繁體中文電源設計工作台，結合 React 操作介面、TypeScript 計算 API、16 面向工程審查與原廠資料庫。

- 網站：https://power-design-360.ifluit.chatgpt.site
- GitHub 前端入口：https://alger68.github.io/power-design-360/
- 原始碼位置：`alger68/alger68.github.io` 的 `power-design-360/source/`
- 版本：0.1.0

## 已實作

- 建立、命名及複製專案；各瀏覽器保存最多 30 案。
- 23 項輸入參數，由後端重新驗證後執行計算。
- PFC / LLC 功率預算、RMS 輸入電流、Boost 峰值工作點占空比。
- 含負容差的母線電容保持時間、LLC 諧振頻率、k、Q、Rac 及三種負載的 FHA 曲線。
- 五項解析檢核。未知熱阻維持「待驗證」，不自動視為符合。
- 16 個面向、32 項手動審查，記錄判定、證據類型、報告說明、時間與精確規格版本。
- 規格變更會使舊證據標記「需重審」；不同分頁儲存衝突會暫停寫入並提示備份。
- 最多三案比較、JSON 匯入匯出、可列印為 PDF 的 HTML 報告。
- 18 項原廠 / 標準組織官方資源與查核版本。
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

只適用 **Boost PFC + 半橋 LLC + 中心抽頭全波整流**。Ns 指半個次級繞組，n=Np/Ns。PFC 與 LLC 的效率、PF 是使用者假設，不是模擬結果。

- 功率：Pbus = Pout / ηLLC；Pin = Pbus / ηPFC。
- 保持時間：t = Ceff(Vbus² − Vend²) / (2Pbus)。不含 ESR、老化與額外控制損耗。
- fr = 1/(2π√LrCr)，k=Lm/Lr，Rac=8n²Rload/π²，Q=√(Lr/Cr)/Rac。
- FHA：M=1/√((1+(1−1/Fn²)/k)²+Q²(Fn−1/Fn)²)，Fn=fs/fr。
- 需求增益：Mtarget=2nVo/Vbus；保持終點另以 Vend 計算。
- 集總機殼溫度：Tamb+Ploss×Rθeffective，須有適用的熱路徑證據，不推算半導體接面溫度。

沒有 SPICE、非線性磁性、寄生、整流壓降、控制迴路、實際 ZVS 判定、EMI 預測、元件壽命模型或自動認證判定。諧振點位於頻率範圍只代表範圍條件，不代表設計可行或可量產。

## 資料與擴充

`localStorage` 不是雲端備份；不同網域各有自己的儲存空間。請定期匯出 JSON。匯入會建立新專案 ID，保留規格及證據；複製方案會清空證據，避免把舊方案的測試當成新方案的結果。

規範條目在 `catalog.ts` 維護；增加自動計算應同時加入獨立數值測試、適用條件、來源及引擎版本。未來可增加磁性設計、元件應力、實測資料、權限、專案数据库及審核簽章。

本專案提供原始碼供查閱；擁有者尚未指定原創程式碼的公開授權。第三方套件、字型、標準與原廠文件適用各自授權。官方資料只提供連結，不重製付費標準或宣稱第三方認證。
