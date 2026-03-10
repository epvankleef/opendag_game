// ===== MINI-GAMES =====
// Triggered between quiz questions as a bonus round.
// Each game calls onComplete(bonusPoints) when done.
// Max bonus: 500 points.

const MINIGAME_DURATION = 60;

// ─── PONG ────────────────────────────────────────────────────────────────────
class PongGame {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.done = false;
    this.score = 0;
    this.timeLeft = MINIGAME_DURATION;
    this.lives = 3;

    const W = canvas.width, H = canvas.height;
    this.paddleW = 80; this.paddleH = 10;
    this.paddleX = (W - this.paddleW) / 2;
    this.paddleY = H - 25;
    this.paddleSpeed = 7;

    this.ballR = 8;
    this.ballX = W / 2; this.ballY = H / 2;
    this.ballVX = 4.5 * (Math.random() > 0.5 ? 1 : -1);
    this.ballVY = 4.5;

    this.keys = {};
    this._mousemove = (e) => {
      const r = canvas.getBoundingClientRect();
      this.paddleX = e.clientX - r.left - this.paddleW / 2;
      this.paddleX = Math.max(0, Math.min(W - this.paddleW, this.paddleX));
    };
    this._keydown = (e) => { this.keys[e.key] = true; };
    this._keyup   = (e) => { this.keys[e.key] = false; };
    canvas.addEventListener('mousemove', this._mousemove);
    document.addEventListener('keydown', this._keydown);
    document.addEventListener('keyup',   this._keyup);

    document.getElementById('mg-controls').textContent = '🖱️ Beweeg muis of ← → pijlen · Vang de bal!';
    this._timerInterval = setInterval(() => {
      this.timeLeft--;
      document.getElementById('mg-timer').textContent = this.timeLeft;
      if (this.timeLeft <= 0) this._end();
    }, 1000);
    this._loop();
  }

  _loop() {
    if (this.done) return;
    this._update();
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const W = this.canvas.width, H = this.canvas.height;
    if (this.keys['ArrowLeft']  || this.keys['a']) this.paddleX -= this.paddleSpeed;
    if (this.keys['ArrowRight'] || this.keys['d']) this.paddleX += this.paddleSpeed;
    this.paddleX = Math.max(0, Math.min(W - this.paddleW, this.paddleX));

    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    // Left / right walls
    if (this.ballX - this.ballR <= 0) { this.ballVX = Math.abs(this.ballVX); }
    if (this.ballX + this.ballR >= W)  { this.ballVX = -Math.abs(this.ballVX); }
    // Top wall
    if (this.ballY - this.ballR <= 0) { this.ballVY = Math.abs(this.ballVY); }

    // Paddle hit
    if (
      this.ballVY > 0 &&
      this.ballY + this.ballR >= this.paddleY &&
      this.ballY - this.ballR <= this.paddleY + this.paddleH &&
      this.ballX >= this.paddleX &&
      this.ballX <= this.paddleX + this.paddleW
    ) {
      this.ballVY = -Math.abs(this.ballVY);
      const hit = (this.ballX - this.paddleX) / this.paddleW - 0.5;
      this.ballVX = hit * 9;
      this.score++;
      document.getElementById('mg-score').textContent = this.score;
      // Speed up slowly
      const spd = Math.sqrt(this.ballVX ** 2 + this.ballVY ** 2);
      if (spd < 9) { const f = Math.min(9 / spd, 1.06); this.ballVX *= f; this.ballVY *= f; }
    }

    // Ball fell off
    if (this.ballY > H + 20) {
      this.lives--;
      if (this.lives <= 0) { this._end(); return; }
      this.ballX = W / 2; this.ballY = H / 2;
      this.ballVX = 4.5 * (Math.random() > 0.5 ? 1 : -1);
      this.ballVY = 4.5;
    }
  }

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H);

    // Center dashed line
    ctx.setLineDash([6, 6]); ctx.strokeStyle = '#ffffff15';
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.setLineDash([]);

    // Lives
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.lives ? '#ff00aa' : '#333';
      ctx.beginPath(); ctx.arc(14 + i * 22, 14, 7, 0, Math.PI * 2); ctx.fill();
    }

    // Paddle
    ctx.shadowBlur = 12; ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(this.paddleX, this.paddleY, this.paddleW, this.paddleH);

    // Ball
    ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#ff00aa';
    ctx.beginPath(); ctx.arc(this.ballX, this.ballY, this.ballR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  _end() {
    if (this.done) return; this.done = true;
    clearInterval(this._timerInterval); cancelAnimationFrame(this._raf);
    this.canvas.removeEventListener('mousemove', this._mousemove);
    document.removeEventListener('keydown', this._keydown);
    document.removeEventListener('keyup', this._keyup);
    this.onComplete(Math.min(500, this.score * 40));
  }
}

// ─── SPACE INVADERS ───────────────────────────────────────────────────────────
class SpaceInvadersGame {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.done = false;
    this.score = 0;
    this.timeLeft = MINIGAME_DURATION;

    const W = canvas.width;
    this.shipX = W / 2;
    this.shipW = 28; this.shipH = 20;
    this.shipSpeed = 5;

    // Aliens: 4 rows x 7 cols
    this.aliens = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        this.aliens.push({ x: 60 + c * 45, y: 35 + r * 32, alive: true });
      }
    }
    this.alienDir = 1; this.alienSpeed = 0.6; this.alienDropY = 18;
    this.alienMoveTimer = 0;

    this.bullets = [];   // player bullets
    this.abombs = [];    // alien bombs
    this.shootCooldown = 0;
    this.abombTimer = 0;

    this.keys = {};
    this._keydown = (e) => {
      this.keys[e.key] = true;
      if ((e.key === ' ' || e.key === 'ArrowUp') && this.shootCooldown <= 0) this._shoot();
    };
    this._keyup = (e) => { this.keys[e.key] = false; };
    this._click = () => { if (this.shootCooldown <= 0) this._shoot(); };
    document.addEventListener('keydown', this._keydown);
    document.addEventListener('keyup',   this._keyup);
    this.canvas.addEventListener('click', this._click);

    document.getElementById('mg-controls').textContent = '← → bewegen · SPATIE of klik schieten · Schiet ze neer!';

    this._timerInterval = setInterval(() => {
      this.timeLeft--;
      document.getElementById('mg-timer').textContent = this.timeLeft;
      if (this.timeLeft <= 0) this._end();
    }, 1000);
    this._lastTime = performance.now();
    this._loop();
  }

  _shoot() {
    const H = this.canvas.height;
    this.bullets.push({ x: this.shipX, y: H - 30 });
    this.shootCooldown = 18;
  }

  _loop() {
    if (this.done) return;
    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 16.67, 3);
    this._lastTime = now;
    this._update(dt);
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
    const W = this.canvas.width, H = this.canvas.height;

    // Ship movement
    if (this.keys['ArrowLeft']  || this.keys['a']) this.shipX -= this.shipSpeed;
    if (this.keys['ArrowRight'] || this.keys['d']) this.shipX += this.shipSpeed;
    this.shipX = Math.max(this.shipW / 2, Math.min(W - this.shipW / 2, this.shipX));
    if (this.shootCooldown > 0) this.shootCooldown--;

    // Player bullets
    this.bullets = this.bullets.filter(b => b.y > -10);
    this.bullets.forEach(b => { b.y -= 7 * dt; });

    // Alien bombs
    this.abombs = this.abombs.filter(b => b.y < H + 10);
    this.abombs.forEach(b => { b.y += 3.5 * dt; });
    this.abombTimer -= dt;
    if (this.abombTimer <= 0) {
      const alive = this.aliens.filter(a => a.alive);
      if (alive.length) {
        const a = alive[Math.floor(Math.random() * alive.length)];
        this.abombs.push({ x: a.x, y: a.y + 10 });
      }
      this.abombTimer = 55 + Math.random() * 30;
    }

    // Alien movement
    this.alienMoveTimer += dt;
    if (this.alienMoveTimer >= 28) {
      this.alienMoveTimer = 0;
      const alive = this.aliens.filter(a => a.alive);
      if (!alive.length) { this._end(); return; }
      const minX = Math.min(...alive.map(a => a.x));
      const maxX = Math.max(...alive.map(a => a.x));
      if ((this.alienDir > 0 && maxX >= W - 30) || (this.alienDir < 0 && minX <= 30)) {
        this.aliens.forEach(a => { if (a.alive) a.y += this.alienDropY; });
        this.alienDir *= -1;
      } else {
        this.aliens.forEach(a => {
          if (a.alive) a.x += this.alienDir * (this.alienSpeed * (MINIGAME_DURATION - this.timeLeft + 5));
        });
      }
    }

    // Bullet vs alien
    this.bullets.forEach(b => {
      this.aliens.forEach(a => {
        if (!a.alive) return;
        if (Math.abs(b.x - a.x) < 14 && Math.abs(b.y - a.y) < 12) {
          a.alive = false; b.y = -999;
          this.score += 10;
          document.getElementById('mg-score').textContent = this.score;
        }
      });
    });

    // Alien bomb vs ship
    this.abombs.forEach(b => {
      if (Math.abs(b.x - this.shipX) < 16 && b.y > H - 40) {
        b.y = H + 999; // "dodge" it — no lives system, just miss
      }
    });
  }

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H);

    // Aliens
    this.aliens.forEach(a => {
      if (!a.alive) return;
      ctx.shadowBlur = 8; ctx.shadowColor = '#ff00aa';
      ctx.fillStyle = '#ff00aa';
      // Simple alien sprite using rectangles
      ctx.fillRect(a.x - 10, a.y - 6, 20, 12);
      ctx.fillRect(a.x - 6,  a.y - 10, 4, 5);
      ctx.fillRect(a.x + 2,  a.y - 10, 4, 5);
      ctx.fillRect(a.x - 14, a.y,      4, 6);
      ctx.fillRect(a.x + 10, a.y,      4, 6);
      ctx.shadowBlur = 0;
    });

    // Player bullets
    ctx.fillStyle = '#00ff88'; ctx.shadowBlur = 8; ctx.shadowColor = '#00ff88';
    this.bullets.forEach(b => { ctx.fillRect(b.x - 2, b.y - 8, 4, 12); });

    // Alien bombs
    ctx.fillStyle = '#ff6600'; ctx.shadowColor = '#ff6600';
    this.abombs.forEach(b => { ctx.fillRect(b.x - 2, b.y - 6, 4, 10); });
    ctx.shadowBlur = 0;

    // Ship (triangle + wings)
    ctx.shadowBlur = 14; ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(this.shipX, H - 20 - this.shipH);
    ctx.lineTo(this.shipX - this.shipW / 2, H - 20);
    ctx.lineTo(this.shipX + this.shipW / 2, H - 20);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    // Ground line
    ctx.strokeStyle = '#00f0ff40';
    ctx.beginPath(); ctx.moveTo(0, H - 18); ctx.lineTo(W, H - 18); ctx.stroke();
  }

  _end() {
    if (this.done) return; this.done = true;
    clearInterval(this._timerInterval); cancelAnimationFrame(this._raf);
    document.removeEventListener('keydown', this._keydown);
    document.removeEventListener('keyup',   this._keyup);
    this.canvas.removeEventListener('click', this._click);
    this.onComplete(Math.min(500, this.score * 3));
  }
}

// ─── SNAKE ───────────────────────────────────────────────────────────────────
class SnakeGame {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.done = false;
    this.score = 0;
    this.timeLeft = MINIGAME_DURATION;

    this.cell = 20;
    this.cols = Math.floor(canvas.width  / this.cell);
    this.rows = Math.floor(canvas.height / this.cell);

    this.snake = [{ x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this._placeFood();

    this._keydown = (e) => {
      if (e.key === 'ArrowUp'    || e.key === 'w') { if (this.dir.y !== 1)  this.nextDir = {x:0,y:-1}; }
      if (e.key === 'ArrowDown'  || e.key === 's') { if (this.dir.y !== -1) this.nextDir = {x:0,y:1};  }
      if (e.key === 'ArrowLeft'  || e.key === 'a') { if (this.dir.x !== 1)  this.nextDir = {x:-1,y:0}; }
      if (e.key === 'ArrowRight' || e.key === 'd') { if (this.dir.x !== -1) this.nextDir = {x:1,y:0};  }
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    };
    document.addEventListener('keydown', this._keydown);

    document.getElementById('mg-controls').textContent = '← → ↑ ↓ of WASD · Eet de pixels!';

    this._timerInterval = setInterval(() => {
      this.timeLeft--;
      document.getElementById('mg-timer').textContent = this.timeLeft;
      if (this.timeLeft <= 0) this._end();
    }, 1000);

    this._moveInterval = setInterval(() => { if (!this.done) this._step(); }, 130);
    this._draw();
  }

  _placeFood() {
    do {
      this.food = { x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows) };
    } while (this.snake.some(s => s.x === this.food.x && s.y === this.food.y));
  }

  _step() {
    this.dir = { ...this.nextDir };
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    // Wrap around walls
    head.x = (head.x + this.cols) % this.cols;
    head.y = (head.y + this.rows) % this.rows;

    // Self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this._end(); return;
    }

    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      document.getElementById('mg-score').textContent = this.score;
      this._placeFood();
    } else {
      this.snake.pop();
    }
    this._draw();
  }

  _draw() {
    const ctx = this.ctx, C = this.cell;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H);

    // Grid (subtle)
    ctx.strokeStyle = '#ffffff08';
    for (let x = 0; x <= W; x += C) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += C) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Food
    ctx.shadowBlur = 14; ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(this.food.x * C + 3, this.food.y * C + 3, C - 6, C - 6);
    ctx.shadowBlur = 0;

    // Snake
    this.snake.forEach((s, i) => {
      const t = 1 - i / (this.snake.length + 1);
      ctx.fillStyle = i === 0 ? '#00ff88' : `hsl(160, 100%, ${30 + t * 30}%)`;
      ctx.shadowBlur = i === 0 ? 10 : 0; ctx.shadowColor = '#00ff88';
      ctx.fillRect(s.x * C + 1, s.y * C + 1, C - 2, C - 2);
    });
    ctx.shadowBlur = 0;
  }

  _end() {
    if (this.done) return; this.done = true;
    clearInterval(this._timerInterval); clearInterval(this._moveInterval);
    document.removeEventListener('keydown', this._keydown);
    this.onComplete(Math.min(500, this.score * 80));
  }
}

// ─── BREAKOUT ────────────────────────────────────────────────────────────────
class BreakoutGame {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.done = false;
    this.score = 0;
    this.timeLeft = MINIGAME_DURATION;

    const W = canvas.width, H = canvas.height;
    this.paddleW = 85; this.paddleH = 10;
    this.paddleX = (W - this.paddleW) / 2;
    this.paddleY = H - 25;

    this.ballR = 7;
    this.ballX = W / 2; this.ballY = H - 50;
    this.ballVX = 3.5 * (Math.random() > 0.5 ? 1 : -1);
    this.ballVY = -4;

    // Bricks: 5 rows x 8 cols
    this.brickCols = 8; this.brickRows = 5;
    this.brickW = Math.floor((W - 20) / this.brickCols) - 4;
    this.brickH = 16;
    this.brickPadX = 4; this.brickOffX = 10; this.brickOffY = 28;
    this.bricks = [];
    const rowColors = ['#ff3355','#ff6600','#ffd700','#00ff88','#00f0ff'];
    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < this.brickCols; c++) {
        this.bricks.push({
          x: this.brickOffX + c * (this.brickW + this.brickPadX),
          y: this.brickOffY + r * (this.brickH + 5),
          alive: true,
          color: rowColors[r]
        });
      }
    }

    this.keys = {};
    this._mousemove = (e) => {
      const r = canvas.getBoundingClientRect();
      this.paddleX = e.clientX - r.left - this.paddleW / 2;
      this.paddleX = Math.max(0, Math.min(W - this.paddleW, this.paddleX));
    };
    this._keydown = (e) => { this.keys[e.key] = true; };
    this._keyup   = (e) => { this.keys[e.key] = false; };
    canvas.addEventListener('mousemove', this._mousemove);
    document.addEventListener('keydown', this._keydown);
    document.addEventListener('keyup',   this._keyup);

    document.getElementById('mg-controls').textContent = '🖱️ Muis of ← → · Breek alle blokken!';

    this._timerInterval = setInterval(() => {
      this.timeLeft--;
      document.getElementById('mg-timer').textContent = this.timeLeft;
      if (this.timeLeft <= 0) this._end();
    }, 1000);
    this._loop();
  }

  _loop() {
    if (this.done) return;
    this._update();
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const W = this.canvas.width, H = this.canvas.height;
    if (this.keys['ArrowLeft']  || this.keys['a']) this.paddleX -= 7;
    if (this.keys['ArrowRight'] || this.keys['d']) this.paddleX += 7;
    this.paddleX = Math.max(0, Math.min(W - this.paddleW, this.paddleX));

    this.ballX += this.ballVX; this.ballY += this.ballVY;

    // Walls
    if (this.ballX - this.ballR <= 0) { this.ballVX = Math.abs(this.ballVX); }
    if (this.ballX + this.ballR >= W)  { this.ballVX = -Math.abs(this.ballVX); }
    if (this.ballY - this.ballR <= 0)  { this.ballVY = Math.abs(this.ballVY); }

    // Paddle
    if (
      this.ballVY > 0 &&
      this.ballY + this.ballR >= this.paddleY &&
      this.ballY - this.ballR <= this.paddleY + this.paddleH &&
      this.ballX >= this.paddleX && this.ballX <= this.paddleX + this.paddleW
    ) {
      this.ballVY = -Math.abs(this.ballVY);
      const hit = (this.ballX - this.paddleX) / this.paddleW - 0.5;
      this.ballVX = hit * 8;
    }

    // Ball lost
    if (this.ballY > H + 20) {
      // Reset
      this.ballX = W / 2; this.ballY = H - 50;
      this.ballVX = 3.5 * (Math.random() > 0.5 ? 1 : -1);
      this.ballVY = -4;
    }

    // Bricks
    this.bricks.forEach(b => {
      if (!b.alive) return;
      if (
        this.ballX + this.ballR > b.x && this.ballX - this.ballR < b.x + this.brickW &&
        this.ballY + this.ballR > b.y && this.ballY - this.ballR < b.y + this.brickH
      ) {
        b.alive = false;
        this.score++;
        document.getElementById('mg-score').textContent = this.score;
        // Determine bounce direction
        const overlapL = (this.ballX + this.ballR) - b.x;
        const overlapR = (b.x + this.brickW) - (this.ballX - this.ballR);
        const overlapT = (this.ballY + this.ballR) - b.y;
        const overlapB = (b.y + this.brickH) - (this.ballY - this.ballR);
        const minH = Math.min(overlapL, overlapR);
        const minV = Math.min(overlapT, overlapB);
        if (minH < minV) { this.ballVX *= -1; } else { this.ballVY *= -1; }
      }
    });

    // All bricks cleared
    if (this.bricks.every(b => !b.alive)) this._end();
  }

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H);

    // Bricks
    this.bricks.forEach(b => {
      if (!b.alive) return;
      ctx.shadowBlur = 6; ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, this.brickW, this.brickH);
      ctx.fillStyle = '#ffffff30';
      ctx.fillRect(b.x, b.y, this.brickW, 3);
      ctx.shadowBlur = 0;
    });

    // Paddle
    ctx.shadowBlur = 12; ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(this.paddleX, this.paddleY, this.paddleW, this.paddleH);

    // Ball
    ctx.shadowBlur = 16; ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(this.ballX, this.ballY, this.ballR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  _end() {
    if (this.done) return; this.done = true;
    clearInterval(this._timerInterval); cancelAnimationFrame(this._raf);
    this.canvas.removeEventListener('mousemove', this._mousemove);
    document.removeEventListener('keydown', this._keydown);
    document.removeEventListener('keyup',   this._keyup);
    this.onComplete(Math.min(500, this.score * 20));
  }
}

// ─── DODGE ───────────────────────────────────────────────────────────────────
class DodgeGame {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.done = false;
    this.score = 0;
    this.timeLeft = MINIGAME_DURATION;
    this.lives = 3;

    const W = canvas.width;
    this.shipX = W / 2;
    this.shipR = 10;
    this.shipSpeed = 6;

    this.meteors = [];
    this.meteorTimer = 0;
    this.spawnInterval = 55; // frames between spawns
    this.invincible = 0;     // invincibility frames after hit

    this.keys = {};
    this._mousemove = (e) => {
      const r = canvas.getBoundingClientRect();
      this.shipX = e.clientX - r.left;
      this.shipX = Math.max(this.shipR, Math.min(W - this.shipR, this.shipX));
    };
    this._keydown = (e) => { this.keys[e.key] = true; };
    this._keyup   = (e) => { this.keys[e.key] = false; };
    canvas.addEventListener('mousemove', this._mousemove);
    document.addEventListener('keydown', this._keydown);
    document.addEventListener('keyup',   this._keyup);

    document.getElementById('mg-controls').textContent = '🖱️ Muis of ← → · Ontwijkt de meteorieten!';

    this._timerInterval = setInterval(() => {
      this.timeLeft--;
      this.score = MINIGAME_DURATION - this.timeLeft;
      document.getElementById('mg-score').textContent = this.score;
      document.getElementById('mg-timer').textContent = this.timeLeft;
      if (this.timeLeft <= 0) this._end();
      // Increase difficulty
      if (this.spawnInterval > 22) this.spawnInterval -= 1.5;
    }, 1000);
    this._loop();
  }

  _loop() {
    if (this.done) return;
    this._update();
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const W = this.canvas.width, H = this.canvas.height;
    if (this.keys['ArrowLeft']  || this.keys['a']) this.shipX -= this.shipSpeed;
    if (this.keys['ArrowRight'] || this.keys['d']) this.shipX += this.shipSpeed;
    this.shipX = Math.max(this.shipR, Math.min(W - this.shipR, this.shipX));
    if (this.invincible > 0) this.invincible--;

    // Spawn meteors
    this.meteorTimer++;
    if (this.meteorTimer >= this.spawnInterval) {
      this.meteorTimer = 0;
      const r = 8 + Math.random() * 14;
      this.meteors.push({
        x: r + Math.random() * (W - r * 2),
        y: -r,
        r,
        vy: 2.5 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 1.5,
        color: Math.random() > 0.5 ? '#ff3355' : '#ff6600',
      });
    }

    this.meteors = this.meteors.filter(m => m.y < H + m.r + 10);
    this.meteors.forEach(m => { m.x += m.vx; m.y += m.vy; });

    // Collision
    if (this.invincible <= 0) {
      this.meteors.forEach(m => {
        const dx = m.x - this.shipX, dy = m.y - (this.canvas.height - 30);
        if (Math.sqrt(dx * dx + dy * dy) < m.r + this.shipR - 2) {
          this.lives--;
          this.invincible = 60;
          m.y = H + 999; // remove
          if (this.lives <= 0) { this._end(); }
        }
      });
    }
  }

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#ffffff30';
    for (let i = 0; i < 40; i++) {
      // deterministic stars using sine
      const sx = (Math.sin(i * 137.5) * 0.5 + 0.5) * W;
      const sy = (Math.cos(i * 97.3)  * 0.5 + 0.5) * H;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Meteors
    this.meteors.forEach(m => {
      ctx.shadowBlur = 10; ctx.shadowColor = m.color;
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Lives
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.lives ? '#00ff88' : '#333';
      ctx.shadowBlur = i < this.lives ? 8 : 0; ctx.shadowColor = '#00ff88';
      ctx.beginPath(); ctx.arc(14 + i * 22, 14, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Ship
    const shipY = H - 30;
    const blink = this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0;
    if (!blink) {
      ctx.shadowBlur = 14; ctx.shadowColor = '#00f0ff';
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(this.shipX, shipY - 18);
      ctx.lineTo(this.shipX - 13, shipY + 5);
      ctx.lineTo(this.shipX + 13, shipY + 5);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _end() {
    if (this.done) return; this.done = true;
    clearInterval(this._timerInterval); cancelAnimationFrame(this._raf);
    this.canvas.removeEventListener('mousemove', this._mousemove);
    document.removeEventListener('keydown', this._keydown);
    document.removeEventListener('keyup',   this._keyup);
    this.onComplete(Math.min(500, this.score * 18));
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
const MINIGAME_LIST = [
  { id: 'pong',          name: 'PONG',           icon: '🏓', Class: PongGame },
  { id: 'spaceinvaders', name: 'SPACE INVADERS',  icon: '👾', Class: SpaceInvadersGame },
  { id: 'snake',         name: 'SNAKE',           icon: '🐍', Class: SnakeGame },
  { id: 'breakout',      name: 'BREAKOUT',        icon: '🧱', Class: BreakoutGame },
  { id: 'dodge',         name: 'DODGE!',          icon: '☄️',  Class: DodgeGame },
];

const MiniGames = {
  // Shows the mini-game overlay and starts a random game.
  // onComplete(bonusPoints) is called when the game ends.
  show(onComplete) {
    const pick = MINIGAME_LIST[Math.floor(Math.random() * MINIGAME_LIST.length)];

    document.getElementById('mg-game-title').textContent = pick.icon + ' ' + pick.name;
    document.getElementById('mg-score').textContent = '0';
    document.getElementById('mg-timer').textContent = MINIGAME_DURATION;
    document.getElementById('mg-bonus-text').textContent = '';
    document.getElementById('mg-controls').textContent = '';

    const overlay = document.getElementById('minigame-overlay');
    overlay.classList.remove('hidden');

    const canvas = document.getElementById('minigame-canvas');
    // Clear previous frame
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let game;

    const finish = (bonus) => {
      const bonusRounded = Math.round(bonus / 10) * 10; // round to 10s
      document.getElementById('mg-bonus-text').textContent =
        bonusRounded > 0 ? `+${bonusRounded} BONUS PTS!` : 'Volgende keer beter!';

      // Show result for 1.5s then close
      setTimeout(() => {
        overlay.classList.add('hidden');
        onComplete(bonusRounded);
      }, 1800);
    };

    document.getElementById('mg-skip-btn').onclick = () => {
      if (game && game._end) game._end();
      else finish(0);
    };

    // Small delay so overlay is visible before game starts
    setTimeout(() => { game = new pick.Class(canvas, finish); }, 120);
  }
};
