# 🎯 Product Dev Board

產品開發看板 - 支援拖拽的 Kanban 任務管理工具

## ✨ 功能特色

- 📋 三欄式看板：Backlog → Sprint → Done
- 🎨 流暢的拖拽操作
- 🔍 即時搜尋與篩選
- 💾 LocalStorage 自動儲存
- 📤 匯出/匯入 JSON 功能
- ⚠️ 停滯任務自動提醒（>3天）

## 🚀 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/product-dev-board)

或手動部署：

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 部署
vercel
```

## 📝 使用說明

### 新增任務
1. 點擊「+ 新增任務」按鈕
2. 填寫任務標題、負責人、類型
3. 任務會自動加入 Backlog

### 管理任務
- **拖拽**：直接拖動卡片到其他欄位
- **編輯**：點擊卡片上的「編輯」按鈕
- **刪除**：點擊卡片右上角的 × 按鈕

### 團隊協作
1. 一人維護主看板
2. 定期匯出 JSON 分享給團隊
3. 其他成員匯入 JSON 同步狀態

## 🛠️ 技術棧

- **框架**：Next.js 14
- **UI**：React + Tailwind CSS
- **拖拽**：@dnd-kit
- **儲存**：LocalStorage
- **字體**：DM Sans + JetBrains Mono

## 📦 專案結構

```
product-dev-board/
├── app/
│   ├── layout.js      # 根佈局
│   ├── page.js        # 主要看板頁面
│   └── globals.css    # 全域樣式
├── public/            # 靜態資源
├── package.json       # 依賴配置
└── README.md          # 說明文件
```

## 📄 授權

MIT License

---

Made with ❤️ by PM Mayors
