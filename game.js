const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 20, ROWS = 20, CELL = canvas.width / COLS;
const levels = [
  { target: 5,  speed: 150, obstacles: 0,  name: "新手森林" },
  { target: 7,  speed: 140, obstacles: 4,  name: "小石谷" },
  { target: 9,  speed: 130, obstacles: 6,  name: "迷霧山路" },
  { target: 11, speed: 120, obstacles: 8,  name: "荊棘地" },
  { target: 13, speed: 110, obstacles: 10, name: "熔岩邊境" },
  { target: 15, speed: 100, obstacles: 13, name: "冰雪迷宮" },
  { target: 17, speed: 90,  obstacles: 16, name: "黑暗森林" },
  { target: 19, speed: 82,  obstacles: 20, name: "死亡峽谷" },
  { target: 22, speed: 74,  obstacles: 25, name: "龍之巢穴" },
  { target: 26, speed: 66,  obstacles: 30, name: "最終試煉" }
];

let level = 1, score = 0, eatenThisLevel = 0;
let snake, dir, nextDir, food, obstacles, running = false, paused = false;
let timer = null;

const $ = id => document.getElementById(id);
function setMessage(t) { $("message").textContent = t; }
function updateHUD() {
  const cfg = levels[level - 1];
  $("level").textContent = level;
  $("score").textContent = score;
  $("target").textContent = `${eatenThisLevel}/${cfg.target}`;
  $("speed").textContent = `${Math.round(150 / cfg.speed * 10) / 10}x`;
}

function same(a,b) { return a.x === b.x && a.y === b.y; }
function randomCell() { return {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)}; }

function makeLevel() {
  const cfg = levels[level - 1];
  snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir = {x:1,y:0}; nextDir = {x:1,y:0};
  obstacles = [];
  let attempts = 0;
  while (obstacles.length < cfg.obstacles && attempts++ < 5000) {
    const p = randomCell();
    if (snake.some(s => same(s,p))) continue;
    if (obstacles.some(o => same(o,p))) continue;
    // 避免開局附近過於擁擠
    if (Math.abs(p.x-10) + Math.abs(p.y-10) < 5) continue;
    obstacles.push(p);
  }
  spawnFood();
  updateHUD();
  draw();
  setMessage(`第 ${level} 關：${cfg.name}｜吃 ${cfg.target} 個食物！`);
}

function spawnFood() {
  let p, tries = 0;
  do {
    p = randomCell();
    tries++;
  } while (
    tries < 5000 &&
    (snake.some(s => same(s,p)) || obstacles.some(o => same(o,p)))
  );
  food = p;
}

function resetGame() {
  clearInterval(timer);
  level = 1; score = 0; eatenThisLevel = 0;
  running = false; paused = false;
  $("pause").textContent = "暫停";
  makeLevel();
  setMessage("按「開始遊戲」開始！");
}

function startGame() {
  if (running) return;
  running = true; paused = false;
  $("pause").textContent = "暫停";
  setMessage(`第 ${level} 關開始！`);
  clearInterval(timer);
  timer = setInterval(tick, levels[level - 1].speed);
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  $("pause").textContent = paused ? "繼續" : "暫停";
  setMessage(paused ? "遊戲已暫停" : `第 ${level} 關繼續！`);
}

function changeDirection(x,y) {
  if (x === -dir.x && y === -dir.y) return;
  nextDir = {x,y};
}

function tick() {
  if (!running || paused) return;
  dir = nextDir;
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

  // 撞牆
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver("撞到牆壁了！");
  // 撞障礙
  if (obstacles.some(o => same(o, head))) return gameOver("撞到障礙物了！");
  // 撞自己（尾巴若會移除則允許踩到尾巴原位置）
  const bodyToCheck = snake.slice(0, snake.length - 1);
  if (bodyToCheck.some(s => same(s, head))) return gameOver("撞到自己的身體了！");

  snake.unshift(head);
  if (same(head, food)) {
    score += 10 * level;
    eatenThisLevel++;
    if (eatenThisLevel >= levels[level - 1].target) {
      draw();
      clearInterval(timer);
      if (level === 10) return winGame();
      level++;
      eatenThisLevel = 0;
      setTimeout(() => {
        makeLevel();
        startGame();
      }, 650);
      setMessage(`🎉 通關！準備進入第 ${level} 關…`);
      return;
    }
    spawnFood();
  } else {
    snake.pop();
  }
  updateHUD();
  draw();
}

function gameOver(reason) {
  running = false;
  clearInterval(timer);
  setMessage(`💥 ${reason} 目前分數：${score}。按「重新開始」再挑戰！`);
  draw(true);
}

function winGame() {
  running = false;
  clearInterval(timer);
  score += 500;
  updateHUD();
  setMessage(`🏆 恭喜！你完成全部 10 關！最終分數：${score}`);
  draw(true);
}

function draw(gameEnded=false) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#0b1715"; ctx.fillRect(0,0,canvas.width,canvas.height);

  // 網格
  ctx.strokeStyle = "rgba(255,255,255,.045)";
  ctx.lineWidth = 1;
  for (let x=0;x<=COLS;x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,canvas.height); ctx.stroke(); }
  for (let y=0;y<=ROWS;y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(canvas.width,y*CELL); ctx.stroke(); }

  // 障礙
  obstacles.forEach(o => {
    ctx.fillStyle = "#8d5a3a";
    ctx.fillRect(o.x*CELL+3,o.y*CELL+3,CELL-6,CELL-6);
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.fillRect(o.x*CELL+6,o.y*CELL+6,CELL/3,CELL/3);
  });

  // 食物
  if (food) {
    const cx = food.x*CELL+CELL/2, cy = food.y*CELL+CELL/2;
    ctx.fillStyle = "#ffcf4a"; ctx.beginPath(); ctx.arc(cx,cy,CELL*.30,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ff6b6b"; ctx.beginPath(); ctx.arc(cx-4,cy-3,3,0,Math.PI*2); ctx.fill();
  }

  // 蛇
  snake.forEach((s,i) => {
    const pad = i === 0 ? 2 : 3;
    ctx.fillStyle = i === 0 ? "#a9ffd0" : "#55c98a";
    ctx.fillRect(s.x*CELL+pad,s.y*CELL+pad,CELL-pad*2,CELL-pad*2);
    if (i === 0) {
      ctx.fillStyle = "#092016";
      let ex1 = 0, ey1 = 0, ex2 = 0, ey2 = 0;
      if (dir.x === 1) { ex1=14; ey1=7; ex2=14; ey2=13; }
      if (dir.x === -1){ ex1=6; ey1=7; ex2=6; ey2=13; }
      if (dir.y === -1){ ex1=7; ey1=6; ex2=13; ey2=6; }
      if (dir.y === 1) { ex1=7; ey1=14; ex2=13; ey2=14; }
      ctx.fillRect(s.x*CELL+ex1,s.y*CELL+ey1,3,3);
      ctx.fillRect(s.x*CELL+ex2,s.y*CELL+ey2,3,3);
    }
  });

  if (gameEnded) {
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
}

window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  if (k === "arrowup" || k === "w") changeDirection(0,-1);
  if (k === "arrowdown" || k === "s") changeDirection(0,1);
  if (k === "arrowleft" || k === "a") changeDirection(-1,0);
  if (k === "arrowright" || k === "d") changeDirection(1,0);
  if (k === " ") togglePause();
});

$("start").addEventListener("click", startGame);
$("pause").addEventListener("click", togglePause);
$("restart").addEventListener("click", resetGame);

resetGame();
