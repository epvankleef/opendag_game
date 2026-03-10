class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.transitioning = false;

    // ── Background ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x06061a, 0x06061a, 0x0d0d2e, 0x0d0d2e, 1);
    bg.fillRect(0, 0, width, height);

    // ── Circuit-board traces ──
    this.drawCircuitBoard(this.add.graphics(), width, height);

    // ── Ambient glow orbs ──
    this.createGlowOrb(width * 0.15, height * 0.28, 240, 0x00f0ff, 0.05);
    this.createGlowOrb(width * 0.85, height * 0.6,  260, 0xff00aa, 0.04);
    this.createGlowOrb(width * 0.5,  height * 0.88, 180, 0xffe600, 0.028);

    // ── Floating data particles ──
    this.particles = [];
    const chars  = ['0','1','{','}','<','>','/','*','#','=','λ','∑','π','◆','●'];
    const colors = ['#00f0ff','#ff00aa','#ffe600','#00f0ff','#00ff88'];
    for (let i = 0; i < 55; i++) {
      const p = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        chars[Phaser.Math.Between(0, chars.length - 1)],
        { fontFamily: '"Press Start 2P"', fontSize: Phaser.Math.Between(8, 18) + 'px',
          color: colors[Phaser.Math.Between(0, colors.length - 1)] }
      ).setAlpha(0);
      this.particles.push({
        obj: p,
        speed:      Phaser.Math.FloatBetween(0.4, 1.8),
        drift:      Phaser.Math.FloatBetween(-0.3, 0.3),
        maxAlpha:   Phaser.Math.FloatBetween(0.04, 0.18),
        phase:      Phaser.Math.FloatBetween(0, Math.PI * 2),
        phaseSpeed: Phaser.Math.FloatBetween(0.01, 0.035),
      });
    }

    // ── Corner brackets ──
    const bLen = 55, bIn = 28;
    const c = this.add.graphics();
    c.lineStyle(2, 0x00f0ff, 0.18);
    [[bIn, bIn, 1, 0], [width-bIn, bIn, -1, 0],
     [bIn, height-bIn, 1, 0], [width-bIn, height-bIn, -1, 0]].forEach(([x, y, sx]) => {
      c.lineBetween(x, y, x + sx * bLen, y);
      c.lineBetween(x, y, x, y + (y < height/2 ? bLen : -bLen));
    });

    // ════════════════════════════════════════
    //  TITLE
    // ════════════════════════════════════════
    const titleSize = Math.min(118, width / 6.5);
    const cx = width / 2;
    const titleY = height * 0.30;

    // Drop shadow layers
    this.add.text(cx + 6, titleY + 6, 'NEURAL', {
      fontFamily: '"Press Start 2P"', fontSize: titleSize + 'px', color: '#001a2e',
    }).setOrigin(0.5).setAlpha(0.5);

    this.titleTop = this.add.text(cx, titleY, 'NEURAL', {
      fontFamily: '"Press Start 2P"',
      fontSize: titleSize + 'px',
      color: '#00f0ff',
      stroke: '#001520',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 12, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const extY = titleY + titleSize * 1.02;
    this.add.text(cx + 6, extY + 6, 'ARENA', {
      fontFamily: '"Press Start 2P"', fontSize: titleSize + 'px', color: '#2a0020',
    }).setOrigin(0.5).setAlpha(0.5);

    this.titleBot = this.add.text(cx, extY, 'ARENA', {
      fontFamily: '"Press Start 2P"',
      fontSize: titleSize + 'px',
      color: '#ff00aa',
      stroke: '#1a0016',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff00aa', blur: 12, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // ── Animated Divider ──
    const divY = extY + titleSize * 1.06;
    const divW = Math.min(380, width * 0.48);
    this.divY = divY;
    this.divW = divW;
    this.divCx = cx;

    // Base line (subtle)
    this.divGfx = this.add.graphics().setAlpha(0);
    this.divGfx.lineStyle(1, 0xffe600, 0.3);
    this.divGfx.lineBetween(cx - divW/2, divY, cx + divW/2, divY);

    // Node dots that pulse
    this.divDots = [];
    [-divW/2, -divW/4, 0, divW/4, divW/2].forEach((dx, i) => {
      const dot = this.add.circle(cx + dx, divY, 3, 0xffe600, 0).setAlpha(0);
      this.divDots.push(dot);
      // Staggered pulse
      this.tweens.add({
        targets: dot, scaleX: 1.8, scaleY: 1.8, alpha: 0.4,
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: 820 + i * 150,
      });
    });

    // Scanning energy pulse (bright core + outer glow + halo)
    this.divPulseHalo = this.add.circle(cx - divW/2, divY, 40, 0xffe600, 0);
    this.divPulseGlow = this.add.circle(cx - divW/2, divY, 20, 0xffe600, 0);
    this.divPulse = this.add.circle(cx - divW/2, divY, 8, 0xffffff, 0);
    // Bright line overlay drawn each frame
    this.divScanGfx = this.add.graphics().setAlpha(0);

    // Start scan animation after entrance
    this.time.delayedCall(1200, () => {
      this.divScanActive = true;
      // Pulse travels back and forth
      this.tweens.add({
        targets: [this.divPulse, this.divPulseGlow, this.divPulseHalo],
        x: cx + divW/2, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: this.divPulse, alpha: 1,
        duration: 400,
      });
      this.tweens.add({
        targets: this.divPulseGlow, alpha: 0.25,
        duration: 400,
      });
      this.tweens.add({
        targets: this.divPulseHalo, alpha: 0.08,
        duration: 400,
      });
      // Pulse breathing
      this.tweens.add({
        targets: this.divPulse, scaleX: 1.4, scaleY: 1.4,
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: this.divPulseGlow, scaleX: 1.3, scaleY: 1.3,
        duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: this.divScanGfx, alpha: 1,
        duration: 400, delay: 0,
      });
    });

    // ── Subtitle ──
    const subSize = Math.min(14, width / 55);
    this.subtitle = this.add.text(cx, divY + 30, '⚡  AI-POWERED QUIZ GAME  ⚡', {
      fontFamily: '"Press Start 2P"',
      fontSize: subSize + 'px',
      color: '#ffe600',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffe600', blur: 14, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── AI Built Badge ──
    const badgeY = divY + 80;
    const badgeSize = Math.min(13, width / 60);
    this.aiBadge = this.add.text(cx, badgeY, '🤖  100% GEBOUWD DOOR AI  🤖', {
      fontFamily: '"Press Start 2P"',
      fontSize: badgeSize + 'px',
      color: '#00ff88',
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff88', blur: 16, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    this.aiBadgeSub = this.add.text(cx, badgeY + 34, 'Vragen • Characters • Feedback — alles live gegenereerd', {
      fontFamily: '"Exo 2"',
      fontSize: '14px',
      color: '#5a8a7a',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    // ── Opleiding ──
    this.opleidingText = this.add.text(cx, badgeY + 66, 'MBO4 Software Developer — Applied AI', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(10, width / 90) + 'px',
      color: '#ff00aa',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff00aa', blur: 8, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── CTA ──
    const ctaSize = Math.min(16, width / 50);
    this.startText = this.add.text(cx, height * 0.9, '▶   KLIK OM TE STARTEN   ◀', {
      fontFamily: '"Press Start 2P"',
      fontSize: ctaSize + 'px',
      color: '#ffffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 18, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── Footer ──
    this.add.text(cx, height - 22, 'Powered by Claude AI + OpenAI  •  Geen enkele vraag is vooraf geschreven', {
      fontFamily: '"Exo 2"', fontSize: '13px', color: '#4a4a7a',
    }).setOrigin(0.5).setAlpha(0.7);

    // ════════════════════════════════════════
    //  Entrance animations
    // ════════════════════════════════════════
    this.tweens.add({ targets: this.titleTop, alpha: 1, scaleX: 1, scaleY: 1, duration: 750, ease: 'Back.easeOut', delay: 150 });
    this.tweens.add({ targets: this.titleBot, alpha: 1, scaleX: 1, scaleY: 1, duration: 750, ease: 'Back.easeOut', delay: 400 });
    this.tweens.add({ targets: this.divGfx,   alpha: 1, duration: 400, delay: 820 });
    this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 500, delay: 950 });
    this.tweens.add({ targets: this.aiBadge,    alpha: 1, duration: 500, delay: 1200 });
    this.tweens.add({ targets: this.aiBadgeSub, alpha: 0.7, duration: 500, delay: 1380 });
    this.tweens.add({ targets: this.opleidingText, alpha: 0.9, duration: 500, delay: 1550 });
    this.tweens.add({ targets: this.startText, alpha: 1, duration: 500, delay: 1600 });

    this.time.addEvent({ delay: 600, callback: () => { this.particlesActive = true; } });

    // ── Idle animations ──
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.tweens.add({ targets: this.titleTop, y: '-=5', duration: 2800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.titleBot, y: '+=5', duration: 2800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.startText, alpha: 0.2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scheduleGlitch();
      },
    });


    // ── Click to start ──
    this.input.on('pointerdown', () => {
      if (this.transitioning) return;
      this.transitioning = true;
      this.divScanActive = false;
      this.cameras.main.flash(200, 0, 240, 255, true);
      this.tweens.add({
        targets: [this.titleTop, this.titleBot, this.subtitle, this.startText, this.aiBadge, this.aiBadgeSub, this.opleidingText, this.divGfx, this.divPulse, this.divPulseGlow, this.divPulseHalo, this.divScanGfx, ...this.divDots],
        alpha: 0, duration: 350, ease: 'Quad.easeIn',
      });
      this.cameras.main.fadeOut(480, 10, 10, 26);
      this.time.delayedCall(480, () => { this.scene.start('SetupScene'); });
    });

    this.particlesActive = false;
  }

  async _fetchGameTitle() {
    try {
      const data = await API.getGameTitle();
      if (this.transitioning) return;

      // Swap top word (WEDOTECH → NEURAL / TURBO / etc.)
      if (data.woord) {
        this.tweens.add({
          targets: this.titleTop, alpha: 0, duration: 80,
          onComplete: () => {
            this.titleTop.setText(data.woord);
            this.tweens.add({ targets: this.titleTop, alpha: 1, duration: 200, ease: 'Quad.easeOut' });
          },
        });
      }

      // Swap extension (.QUIZ → .EXE / .QUEST / etc.)
      if (data.extensie) {
        this.tweens.add({
          targets: this.titleBot, alpha: 0, duration: 80, delay: 60,
          onComplete: () => {
            this.titleBot.setText(data.extensie);
            this.tweens.add({ targets: this.titleBot, alpha: 1, duration: 200, ease: 'Quad.easeOut' });
          },
        });
      }
    } catch {
      // Keep defaults on error
    }
  }

  scheduleGlitch() {
    this.time.delayedCall(Phaser.Math.Between(3500, 7000), () => {
      if (this.transitioning) return;
      const target = Math.random() > 0.5 ? this.titleTop : this.titleBot;
      const origX  = target.x;
      this.tweens.add({
        targets: target,
        x: origX + Phaser.Math.Between(-10, 10),
        duration: 40, yoyo: true, repeat: 3,
        onComplete: () => { target.x = origX; },
      });
      this.tweens.add({ targets: target, alpha: 0.35, duration: 30, yoyo: true, repeat: 2 });
      this.scheduleGlitch();
    });
  }

  drawCircuitBoard(gfx, w, h) {
    const sp = 80, nodes = [];
    for (let x = sp; x < w; x += sp) {
      for (let y = sp; y < h; y += sp) {
        const nx = x + (Math.floor(y / sp) % 2) * (sp / 2);
        if (nx < w) nodes.push({ x: nx, y });
      }
    }
    gfx.lineStyle(1, 0x00f0ff, 0.045);
    nodes.forEach(node => {
      for (let c = 0; c < Phaser.Math.Between(1, 2); c++) {
        const t = nodes[Phaser.Math.Between(0, nodes.length - 1)];
        const d = Phaser.Math.Distance.Between(node.x, node.y, t.x, t.y);
        if (d > 40 && d < sp * 2) {
          if (Math.random() > 0.5) { gfx.lineBetween(node.x, node.y, t.x, node.y); gfx.lineBetween(t.x, node.y, t.x, t.y); }
          else                     { gfx.lineBetween(node.x, node.y, node.x, t.y);  gfx.lineBetween(node.x, t.y, t.x, t.y); }
        }
      }
    });
    gfx.fillStyle(0x00f0ff, 0.1);
    nodes.forEach(n => { if (Math.random() > 0.6) gfx.fillCircle(n.x, n.y, 2); });
  }

  createGlowOrb(x, y, r, color, alpha) {
    const orb = this.add.circle(x, y, r, color, alpha);
    this.tweens.add({
      targets: orb, alpha: alpha * 0.22, scaleX: 1.2, scaleY: 1.2,
      duration: Phaser.Math.Between(4000, 7000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  update() {
    if (!this.particlesActive) return;
    const { width, height } = this.cameras.main;
    this.particles.forEach(p => {
      p.obj.y -= p.speed; p.obj.x += p.drift; p.phase += p.phaseSpeed;
      p.obj.setAlpha(p.maxAlpha * (0.5 + Math.sin(p.phase) * 0.5));
      if (p.obj.y < -20)        { p.obj.y = height + 20; p.obj.x = Phaser.Math.Between(0, width); }
      if (p.obj.x < -20)       p.obj.x = width  + 10;
      if (p.obj.x > width + 20) p.obj.x = -10;
    });

    // Draw energy trail behind scan pulse
    if (this.divScanActive && this.divPulse) {
      const g = this.divScanGfx;
      g.clear();
      const px = this.divPulse.x;
      const y = this.divY;
      const left = this.divCx - this.divW / 2;
      const right = this.divCx + this.divW / 2;

      // Wide glow layer (subtle)
      g.lineStyle(6, 0xffe600, 0.08);
      g.lineBetween(left, y, right, y);

      // Hot zone around pulse
      const hotLen = 120;
      const hStart = Math.max(left, px - hotLen);
      const hEnd = Math.min(right, px + hotLen);
      g.lineStyle(4, 0xffe600, 0.35);
      g.lineBetween(hStart, y, hEnd, y);

      // Core bright line near pulse
      const coreLen = 50;
      const cStart = Math.max(left, px - coreLen);
      const cEnd = Math.min(right, px + coreLen);
      g.lineStyle(2, 0xffffff, 0.6);
      g.lineBetween(cStart, y, cEnd, y);

      // Dim rest of line
      g.lineStyle(1, 0xffe600, 0.15);
      g.lineBetween(left, y, hStart, y);
      g.lineBetween(hEnd, y, right, y);

      // Make dots near the pulse glow brighter
      this.divDots.forEach(dot => {
        const dist = Math.abs(dot.x - px);
        const boost = Math.max(0, 1 - dist / 120);
        dot.setScale(1 + boost * 1.6);
        dot.fillColor = boost > 0.5 ? 0xffffff : boost > 0.2 ? 0xffe600 : 0xffe600;
        dot.setAlpha(0.3 + boost * 0.7);
      });
    }
  }
}
