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
    this.add.text(cx + 6, titleY + 6, 'WEDOTECH', {
      fontFamily: '"Press Start 2P"', fontSize: titleSize + 'px', color: '#001a2e',
    }).setOrigin(0.5).setAlpha(0.5);

    this.titleTop = this.add.text(cx, titleY, 'WEDOTECH', {
      fontFamily: '"Press Start 2P"',
      fontSize: titleSize + 'px',
      color: '#00f0ff',
      stroke: '#001520',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 45, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const extY = titleY + titleSize * 1.02;
    this.add.text(cx + 6, extY + 6, '.QUIZ', {
      fontFamily: '"Press Start 2P"', fontSize: titleSize + 'px', color: '#2a0020',
    }).setOrigin(0.5).setAlpha(0.5);

    this.titleBot = this.add.text(cx, extY, '.QUIZ', {
      fontFamily: '"Press Start 2P"',
      fontSize: titleSize + 'px',
      color: '#ff00aa',
      stroke: '#1a0016',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff00aa', blur: 45, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // ── Divider ──
    const divY = extY + titleSize * 1.06;
    const divW = Math.min(380, width * 0.48);
    this.divGfx = this.add.graphics().setAlpha(0);
    this.divGfx.lineStyle(1, 0xffe600, 0.65);
    this.divGfx.lineBetween(cx - divW/2, divY, cx + divW/2, divY);
    this.divGfx.fillStyle(0xffe600, 1);
    [-divW/2, 0, divW/2].forEach(dx => this.divGfx.fillCircle(cx + dx, divY, 3));

    // ── Subtitle ──
    const subSize = Math.min(14, width / 55);
    this.subtitle = this.add.text(cx, divY + 30, '⚡  AI-POWERED QUIZ GAME  ⚡', {
      fontFamily: '"Press Start 2P"',
      fontSize: subSize + 'px',
      color: '#ffe600',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffe600', blur: 14, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── WeDoTechProjects ──
    const wdtpY = divY + 86;
    this.wdtp = this.add.text(cx, wdtpY, 'WeDoTechProjects', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(13, width / 72) + 'px',
      color: '#00f0ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 10, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── MBO4 badge ──
    this.badge = this.add.text(cx, wdtpY + 32, 'MBO4 Software Developer — Applied AI', {
      fontFamily: '"Exo 2"',
      fontSize: '15px',
      color: '#5a5a9a',
      fontStyle: 'bold',
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
    this.add.text(cx, height - 22, 'Powered by AI  •  Geen enkele vraag is vooraf geschreven', {
      fontFamily: '"Exo 2"', fontSize: '12px', color: '#3a3a6a',
    }).setOrigin(0.5).setAlpha(0.55);

    this.add.text(width - 28, height - 22, 'v1.1', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#2a2a5a',
    }).setOrigin(1, 0.5);

    // ════════════════════════════════════════
    //  Entrance animations
    // ════════════════════════════════════════
    this.tweens.add({ targets: this.titleTop, alpha: 1, scaleX: 1, scaleY: 1, duration: 750, ease: 'Back.easeOut', delay: 150 });
    this.tweens.add({ targets: this.titleBot, alpha: 1, scaleX: 1, scaleY: 1, duration: 750, ease: 'Back.easeOut', delay: 400 });
    this.tweens.add({ targets: this.divGfx,   alpha: 1, duration: 400, delay: 820 });
    this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 500, delay: 950 });
    this.tweens.add({ targets: this.wdtp,     alpha: 1, duration: 500, delay: 1200 });
    this.tweens.add({ targets: this.badge,    alpha: 0.65, duration: 500, delay: 1380 });
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

    // ── AI-generated title extensie ──
    this._fetchGameTitle();

    // ── Click to start ──
    this.input.on('pointerdown', () => {
      if (this.transitioning) return;
      this.transitioning = true;
      this.cameras.main.flash(200, 0, 240, 255, true);
      this.tweens.add({
        targets: [this.titleTop, this.titleBot, this.subtitle, this.startText, this.wdtp, this.badge, this.divGfx],
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
      if (!data.extensie || this.transitioning) return;
      // Only swap the extension (.QUIZ → .EXE / .PY / etc.)
      this.tweens.add({
        targets: this.titleBot,
        alpha: 0,
        duration: 80,
        onComplete: () => {
          this.titleBot.setText(data.extensie);
          this.tweens.add({ targets: this.titleBot, alpha: 1, duration: 200, ease: 'Quad.easeOut' });
        },
      });
    } catch {
      // Keep .QUIZ on error
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
  }
}
