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
let snake, dir, nextDir, food, obstacles;
let running = false, paused = false, timer = null;
let soundOn = true;
let audioCtx = null;
let touchStart = null;

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

function randomCell() {
  return { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
}

function ensureAudio() {
  if (!soundOn) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function beep(freq, duration=.08, type="sine", volume=.045, delay=0) {
  if (!soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + delay + .01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration + .02);
}

function soundEat() {
  beep(520, .06, "square", .035);
  beep(760, .07, "square", .03, .055);
}

function soundCrash() {
  beep(130, .18, "sawtooth", .06);
  beep(80, .25, "sawtooth", .045, .11);
}

function soundLevelUp() {
  beep(523, .09, "sine", .04);
  beep(659, .09, "sine", .04, .09);
  beep(784, .14, "sine", .045, .18);
}

function soundWin() {
  [523,659,784,1047].forEach((n,i) => beep(n, .13, "sine", .05, i*.11));
}

function makeLevel() {
  const cfg = levels[level - 1];
  snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir = {x:1,y:0};
  nextDir = {x:1,y:0};
  obstacles = [];
  let attempts = 0;

  while (obstacles.length < cfg.obstacles && attempts++ < 5000) {
    const p = randomCell();
    if (snake.some(s => same(s,p))) continue;
    if (obstacles.some(o => same(o,p))) continue;
    if (Math.abs(p.x-10) + Math.abs(p.y-10) < 5) continue;
    obstacles.push(p);
  }

  spawnFood();
  updateHUD();
  draw();
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

function showGame() {
  $("startScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
}

function showHome() {
  clearInterval(timer);
  running = false;
  paused = false;
  $("gameScreen").classList.add("hidden");
  $("startScreen").classList.remove("hidden");
  $("overlay").classList.add("hidden");
}

function startGame() {
  ensureAudio();
  if (running) return;
  running = true;
  paused = false;
  $("pause").textContent = "⏸ 暫停";
  setMessage(`第 ${level} 關：${levels[level-1].name}`);
  clearInterval(timer);
  timer = setInterval(tick, levels[level - 1].speed);
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  $("pause").textContent = paused ? "▶ 繼續" : "⏸ 暫停";
  $("overlayText").textContent = paused ? "⏸ 遊戲暫停" : "";
  $("overlayButton").textContent = paused ? "▶ 繼續遊戲" : "繼續";
  $("overlay").classList.toggle("hidden", !paused);
  setMessage(paused ? "遊戲已暫停" : "繼續挑戰！");
}

function changeDirection(x, y) {
  if (x === -dir.x && y === -dir.y) return;
  nextDir = {x, y};
}

function tick() {
  if (!running || paused) return;

  dir = nextDir;
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS)
    return gameOver("撞到牆壁了！");

  if (obstacles.some(o => same(o, head)))
    return gameOver("撞到障礙物了！");

  const bodyToCheck = snake.slice(0, snake.length - 1);
  if (bodyToCheck.some(s => same(s, head)))
    return gameOver("撞到自己的身體了！");

  snake.unshift(head);

  if (same(head, food)) {
    score += 10 * level;
    eatenThisLevel++;
    soundEat();

    if (eatenThisLevel >= levels[level - 1].target) {
      clearInterval(timer);

      if (level === 10) return winGame();

      soundLevelUp();
      level++;
      eatenThisLevel = 0;
      updateHUD();
      setMessage(`🎉 第 ${level-1} 關完成！準備進入第 ${level} 關…`);

      setTimeout(() => {
        if (!running) return;
        makeLevel();
        startGame();
      }, 900);
      draw();
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
  soundCrash();
  $("overlayText").textContent = `💥 遊戲結束\n${reason}\n分數：${score}`;
  $("overlayButton").textContent = "↻ 再玩一次";
  $("overlay").classList.remove("hidden");
  $("pause").textContent = "⏸ 暫停";
  setMessage("挑戰失敗，重新挑戰吧！");
  draw(true);
}

function winGame() {
  running = false;
  clearInterval(timer);
  score += 500;
  updateHUD();
  soundWin();
  $("overlayText").textContent = `🏆 全部通關！\n恭喜完成 10 個關卡！\n最終分數：${score}`;
  $("overlayButton").textContent = "↻ 再玩一次";
  $("overlay").classList.remove("hidden");
  setMessage("🎊 你是吃蛇大師！");
  draw(true);
}

function restart() {
  ensureAudio();
  clearInterval(timer);
  level = 1;
  score = 0;
  eatenThisLevel = 0;
  running = false;
  paused = false;
  $("overlay").classList.add("hidden");
  $("pause").textContent = "⏸ 暫停";
  makeLevel();
  startGame();
}

function draw(gameEnded=false) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#0b1715";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,.045)";
  ctx.lineWidth = 1;

  for (let x=0; x<=COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x*CELL,0);
    ctx.lineTo(x*CELL,canvas.height);
    ctx.stroke();
  }

  for (let y=0; y<=ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0,y*CELL);
    ctx.lineTo(canvas.width,y*CELL);
    ctx.stroke();
  }

  obstacles.forEach(o => {
    ctx.fillStyle = "#8d5a3a";
    ctx.fillRect(o.x*CELL+3,o.y*CELL+3,CELL-6,CELL-6);
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.fillRect(o.x*CELL+6,o.y*CELL+6,CELL/3,CELL/3);
  });

  if (food) {
    const cx = food.x*CELL+CELL/2, cy = food.y*CELL+CELL/2;
    ctx.fillStyle = "#ffcf4a";
    ctx.beginPath();
    ctx.arc(cx,cy,CELL*.30,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(cx-4,cy-3,3,0,Math.PI*2);
    ctx.fill();
  }

  snake.forEach((s,i) => {
    const pad = i === 0 ? 2 : 3;
    ctx.fillStyle = i === 0 ? "#a9ffd0" : "#55c98a";
    ctx.fillRect(s.x*CELL+pad,s.y*CELL+pad,CELL-pad*2,CELL-pad*2);

    if (i === 0) {
      ctx.fillStyle = "#092016";
      let e1=[0,0], e2=[0,0];
      if (dir.x === 1)  { e1=[14,7];  e2=[14,13]; }
      if (dir.x === -1) { e1=[6,7];   e2=[6,13]; }
      if (dir.y === -1) { e1=[7,6];   e2=[13,6]; }
      if (dir.y === 1)  { e1=[7,14];  e2=[13,14]; }
      ctx.fillRect(s.x*CELL+e1[0],s.y*CELL+e1[1],3,3);
      ctx.fillRect(s.x*CELL+e2[0],s.y*CELL+e2[1],3,3);
    }
  });

  if (gameEnded) {
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
}

// 鍵盤控制
window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();

  if (k === "arrowup" || k === "w") changeDirection(0,-1);
  if (k === "arrowdown" || k === "s") changeDirection(0,1);
  if (k === "arrowleft" || k === "a") changeDirection(-1,0);
  if (k === "arrowright" || k === "d") changeDirection(1,0);
  if (k === " ") togglePause();
});

// 手機方向按鈕
document.querySelectorAll(".dir").forEach(btn => {
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    ensureAudio();
    const d = btn.dataset.dir;
    if (d === "up") changeDirection(0,-1);
    if (d === "down") changeDirection(0,1);
    if (d === "left") changeDirection(-1,0);
    if (d === "right") changeDirection(1,0);
  });
});

// 滑動控制
canvas.addEventListener("pointerdown", e => {
  touchStart = {x:e.clientX, y:e.clientY};
});

canvas.addEventListener("pointerup", e => {
  if (!touchStart) return;
  const dx = e.clientX - touchStart.x;
  const dy = e.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  if (Math.abs(dx) > Math.abs(dy)) changeDirection(dx > 0 ? 1 : -1, 0);
  else changeDirection(0, dy > 0 ? 1 : -1);
});

$("startGame").addEventListener("click", () => {
  ensureAudio();
  showGame();
  level = 1; score = 0; eatenThisLevel = 0;
  makeLevel();
  startGame();
});

$("soundToggle").addEventListener("click", () => {
  soundOn = !soundOn;
  $("soundToggle").textContent = soundOn ? "🔊 音效：開" : "🔇 音效：關";
  if (soundOn) {
    ensureAudio();
    beep(660,.08,"sine",.04);
  }
});

$("pause").addEventListener("click", togglePause);
$("restart").addEventListener("click", restart);
$("backHome").addEventListener("click", showHome);

$("overlayButton").addEventListener("click", () => {
  if (!running && (level === 10 || eatenThisLevel < levels[level-1].target)) {
    restart();
    return;
  }
  togglePause();
});

// 初始畫面
makeLevel();
