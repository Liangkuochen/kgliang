# 🐍 十關吃蛇大冒險

一個不需要後端、可以直接放到 GitHub Pages 執行的 HTML5 Canvas 吃蛇遊戲。

## 功能

- 10 個關卡
- 每關需要吃到指定數量的食物
- 關卡越高，蛇速度越快
- 關卡越高，障礙物越多
- 分數系統與最終通關獎勵
- 支援鍵盤方向鍵與 WASD
- 空白鍵暫停
- 電腦、手機瀏覽器皆可開啟

## 本機執行

直接雙擊 `index.html` 即可在瀏覽器開啟。

## 放到 GitHub Pages

1. 在 GitHub 建立一個新的 Repository，例如 `snake-game`
2. 把 `index.html`、`style.css`、`game.js`、`README.md` 上傳到 Repository
3. 進入 Repository 的 **Settings → Pages**
4. 在 **Build and deployment**：
   - Source 選 `Deploy from a branch`
   - Branch 選 `main`
   - Folder 選 `/ (root)`
5. 按 Save
6. 等待 GitHub Pages 部署完成後，就會得到一個可以分享的遊戲網址。

## 專案結構

```text
snake-game/
├── index.html
├── style.css
├── game.js
└── README.md
```

## 自訂

你可以直接修改 `game.js` 裡面的 `levels` 陣列，調整每一關：

- `target`：需要吃幾個食物
- `speed`：移動間隔，數字越小越快
- `obstacles`：障礙物數量
- `name`：關卡名稱
