# 🐍 十關吃蛇大冒險（手機版）

可直接部署到 GitHub Pages 的純 HTML/CSS/JavaScript 吃蛇遊戲。

## 新增功能

- 📱 手機方向鍵
- 👆 滑動畫面控制方向
- 🔊 Web Audio 音效，不需要另外上傳音效檔
- 🎵 吃到食物、撞擊、過關、全破都有不同音效
- 🎬 開始畫面
- 🔇 可開關音效
- ⏸ 暫停畫面
- 🏆 10 關完整保留

## GitHub Pages

把 `index.html`、`style.css`、`game.js`、`README.md` 上傳到 GitHub Repository。

接著：

**Settings → Pages → Deploy from a branch → main → /(root) → Save**

完成後即可用 GitHub Pages 網址在手機開啟。

## 手機操作

1. 點「開始遊戲」
2. 點畫面下方 ▲ ◀ ▼ ▶ 控制蛇
3. 或直接在遊戲區域滑動
4. 遊戲中可以按「暫停」
5. 開始遊戲後第一次點擊會啟用瀏覽器音效

## 關卡

第 1 關到第 10 關會逐漸增加速度與障礙物。

修改 `game.js` 的 `levels` 陣列即可調整每關難度。
