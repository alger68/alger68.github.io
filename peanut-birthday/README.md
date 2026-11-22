# 🎂 豪娃花生哥哥 · 生日航空信

一封從台灣飛往法國的動畫生日卡（純 HTML，不需要任何框架或建置）。

## 檔案
| 檔案 | 用途 |
|---|---|
| `index.html` | 整張卡片（動畫、音樂、煙火都在裡面） |
| `peanut-cafe-hero.jpeg` | 第三幕：巴黎咖啡館主角插畫 |
| `taiwan-france-flight.jpg` | 第二幕：台北 101 → 艾菲爾鐵塔航線背景 |
| `.nojekyll` | 讓 GitHub Pages 原樣發佈，不經 Jekyll 處理 |

## 上線到 GitHub Pages（網頁操作，約 5 分鐘）
1. 登入 GitHub → 右上角 **+** → **New repository**
   - 名稱例如 `peanut-birthday`，選 **Public**，按 **Create repository**
2. 在新 repo 頁面點 **uploading an existing file**，把這個資料夾的 4 個檔案全部拖進去 → **Commit changes**
   - `.nojekyll` 是隱藏檔，Mac 在 Finder 按 `⌘ + Shift + .` 就看得到
3. **Settings → Pages** → Source 選 **Deploy from a branch**，Branch 選 `main` / `/(root)` → **Save**
4. 等 1–2 分鐘，網址會是：`https://<你的帳號>.github.io/peanut-birthday/`

## 用指令上線（會 git 的話）
```bash
cd 花生哥哥生日卡/site
git init && git add . && git commit -m "Happy birthday 花生哥哥"
git branch -M main
git remote add origin https://github.com/<你的帳號>/peanut-birthday.git
git push -u origin main
```
接著一樣到 Settings → Pages 打開。

## 小技巧
- **編輯模式**：網址後面加 `?edit` → 會出現「編輯文案」與「替換插畫」按鈕。壽星拿到的網址不要加。
- **改祝福文字**：直接改 `index.html` 裡 `DEFAULT_CONFIG` 的內容（約第 980 行），在 GitHub 網頁點鉛筆圖示就能改。
- **傳送時機**：巴黎比台北慢 7 小時（冬令時間）。想讓他在巴黎早上 8 點收到，就在台北下午 3 點送出。
- **驚喜一點**：可以不要直接給網址，改成先傳「你有一封航空信 ✉️」再附連結。
- Repo 設成 Public 才能用免費的 GitHub Pages；網址不公開分享的話，其他人也不容易找到。
