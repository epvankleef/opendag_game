class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.transitioning = false;

    // ── Deep background: radial vignette ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x0a0a1a, 0x0a0a1a, 1);
    bg.fillRect(0, 0, width, height);

    // ── Circuit-board traces ──
    const circuits = this.add.graphics();
    this.drawCircuitBoard(circuits, width, height);

    // ── Ambient glow orbs (large, blurred, slow) ──
    this.createGlowOrb(width * 0.2, height * 0.3, 180, 0x00f0ff, 0.04);
    this.createGlowOrb(width * 0.8, height * 0.6, 200, 0xff00aa, 0.035);
    this.createGlowOrb(width * 0.5, height * 0.8, 150, 0xffe600, 0.025);

    // ── Data stream particles ──
    this.particles = [];
    const dataChars = ['0', '1', '{', '}', '<', '>', '/', '*', '#', '=', '+', '▪', '▫', '◆', '◇', '●'];
    const pColors = ['#00f0ff', '#ff00aa', '#ffe600', '#00f0ff', '#00f0ff'];

    for (let i = 0; i < 50; i++) {
      const char = dataChars[Phaser.Math.Between(0, dataChars.length - 1)];
      const color = pColors[Phaser.Math.Between(0, pColors.length - 1)];
      const fontSize = Phaser.Math.Between(8, 18);

      const p = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        char,
        {
          fontFamily: '"Press Start 2P"',
          fontSize: fontSize + 'px',
          color: color,
        }
      ).setAlpha(0);

      this.particles.push({
        obj: p,
        speed: Phaser.Math.FloatBetween(0.4, 2.0),
        drift: Phaser.Math.FloatBetween(-0.3, 0.3),
        maxAlpha: Phaser.Math.FloatBetween(0.06, 0.2),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        phaseSpeed: Phaser.Math.FloatBetween(0.01, 0.04),
      });
    }

    // ── Corner brackets (subtle frame) ──
    const bracketAlpha = 0.15;
    const bracketInset = 24;
    const bLen = 40;
    const cornerGfx = this.add.graphics();
    cornerGfx.lineStyle(1, 0x00f0ff, bracketAlpha);
    // Top-left
    cornerGfx.lineBetween(bracketInset, bracketInset, bracketInset + bLen, bracketInset);
    cornerGfx.lineBetween(bracketInset, bracketInset, bracketInset, bracketInset + bLen);
    // Top-right
    cornerGfx.lineBetween(width - bracketInset, bracketInset, width - bracketInset - bLen, bracketInset);
    cornerGfx.lineBetween(width - bracketInset, bracketInset, width - bracketInset, bracketInset + bLen);
    // Bottom-left
    cornerGfx.lineBetween(bracketInset, height - bracketInset, bracketInset + bLen, height - bracketInset);
    cornerGfx.lineBetween(bracketInset, height - bracketInset, bracketInset, height - bracketInset - bLen);
    // Bottom-right
    cornerGfx.lineBetween(width - bracketInset, height - bracketInset, width - bracketInset - bLen, height - bracketInset);
    cornerGfx.lineBetween(width - bracketInset, height - bracketInset, width - bracketInset, height - bracketInset - bLen);

    // ── Title: "QUIZ" ──
    const centerY = height * 0.32;
    const titleSize = Math.min(72, width / 10);

    this.titleQuiz = this.add.text(width / 2, centerY - 20, 'QUIZ', {
      fontFamily: '"Press Start 2P"',
      fontSize: titleSize + 'px',
      color: '#00f0ff',
      stroke: '#001a2e',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 30, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // ── Title: "ROYALE" ──
    this.titleRoyale = this.add.text(width / 2, centerY + titleSize * 0.9, 'ROYALE', {
      fontFamily: '"Press Start 2P"',
      fontSize: titleSize + 'px',
      color: '#ff00aa',
      stroke: '#1a0016',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff00aa', blur: 30, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // ── Decorative diamonds flanking title ──
    const diamondY = centerY + titleSize * 0.4;
    const diamondSpread = Math.min(320, width * 0.35);
    this.diamondLeft = this.add.text(width / 2 - diamondSpread, diamondY, '◆', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffe600',
    }).setOrigin(0.5).setAlpha(0);

    this.diamondRight = this.add.text(width / 2 + diamondSpread, diamondY, '◆', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffe600',
    }).setOrigin(0.5).setAlpha(0);

    // ── Subtitle ──
    const subY = centerY + titleSize * 1.9;
    this.subtitle = this.add.text(width / 2, subY, '⚡ AI-POWERED QUIZ GAME ⚡', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(12, width / 65) + 'px',
      color: '#ffe600',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffe600', blur: 12, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── WeDoTechProjects Badge ──
    const badgeY = subY + 36;
    this.wdtp = this.add.text(width / 2, badgeY, 'WeDoTechProjects', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(11, width / 80) + 'px',
      color: '#00f0ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 8, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── MBO4 Badge ──
    const mboY = badgeY + 28;
    this.badge = this.add.text(width / 2, mboY, 'MBO4 Software Developer — Applied AI', {
      fontFamily: '"Exo 2"',
      fontSize: '13px',
      color: '#6a6aaa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // ── Start CTA ──
    this.startText = this.add.text(width / 2, height * 0.72, '▶  KLIK OM TE STARTEN  ◀', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(14, width / 55) + 'px',
      color: '#e0e8ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 10, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    // ── Footer ──
    this.add.text(width / 2, height - 28, 'Powered by AI  •  Geen enkele vraag is vooraf geschreven', {
      fontFamily: '"Exo 2"',
      fontSize: '11px',
      color: '#3a3a6a',
    }).setOrigin(0.5).setAlpha(0.5);

    // ── Version tag ──
    this.add.text(width - 32, height - 28, 'v1.0', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#2a2a5a',
    }).setOrigin(1, 0.5);

    // ════════════════════════════════════════
    //  Entrance animation sequence
    // ════════════════════════════════════════

    // Title QUIZ - slam in from above
    this.tweens.add({
      targets: this.titleQuiz,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 700,
      ease: 'Back.easeOut',
      delay: 200,
    });

    // Title ROYALE - slam in slightly after
    this.tweens.add({
      targets: this.titleRoyale,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 700,
      ease: 'Back.easeOut',
      delay: 450,
    });

    // Diamonds snap in
    this.tweens.add({
      targets: [this.diamondLeft, this.diamondRight],
      alpha: 0.7,
      duration: 400,
      delay: 800,
    });

    // Subtitle fade in
    this.tweens.add({
      targets: this.subtitle,
      alpha: 1,
      duration: 500,
      delay: 900,
    });

    // WeDoTechProjects
    this.tweens.add({
      targets: this.wdtp,
      alpha: 1,
      duration: 500,
      delay: 1000,
    });

    // Badge
    this.tweens.add({
      targets: this.badge,
      alpha: 0.7,
      duration: 500,
      delay: 1200,
    });

    // Start text
    this.tweens.add({
      targets: this.startText,
      alpha: 1,
      duration: 500,
      delay: 1400,
    });

    // Particles fade in gradually
    this.time.addEvent({
      delay: 600,
      callback: () => {
        this.particlesActive = true;
      },
    });

    // ── Ambient animations (after entrance) ──
    this.time.addEvent({
      delay: 1900,
      callback: () => {
        // Gentle title float
        this.tweens.add({
          targets: this.titleQuiz,
          y: '-=5',
          duration: 2500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.tweens.add({
          targets: this.titleRoyale,
          y: '+=5',
          duration: 2500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Pulsing CTA
        this.tweens.add({
          targets: this.startText,
          alpha: 0.25,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Rotating diamond pulse
        this.tweens.add({
          targets: [this.diamondLeft, this.diamondRight],
          alpha: 0.2,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // ── Click to start ──
    this.input.on('pointerdown', () => {
      if (this.transitioning) return;
      this.transitioning = true;

      // Flash effect
      this.cameras.main.flash(200, 0, 240, 255, true);

      // Fade everything out
      const allElements = [
        this.titleQuiz, this.titleRoyale, this.subtitle,
        this.startText, this.wdtp, this.badge, this.diamondLeft, this.diamondRight,
      ];

      this.tweens.add({
        targets: allElements,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeIn',
      });

      this.cameras.main.fadeOut(500, 10, 10, 26);
      this.time.delayedCall(500, () => {
        this.scene.start('SetupScene');
      });
    });

    this.particlesActive = false;
  }

  drawCircuitBoard(gfx, w, h) {
    const nodeSpacing = 80;
    const nodes = [];

    // Create node grid
    for (let x = nodeSpacing; x < w; x += nodeSpacing) {
      for (let y = nodeSpacing; y < h; y += nodeSpacing) {
        // Offset every other row
        const offsetX = (Math.floor(y / nodeSpacing) % 2) * (nodeSpacing / 2);
        const nx = x + offsetX;
        if (nx < w) {
          nodes.push({ x: nx, y });
        }
      }
    }

    // Draw traces between nearby nodes
    gfx.lineStyle(1, 0x00f0ff, 0.04);
    nodes.forEach((node, i) => {
      // Connect to 1-2 random nearby nodes
      const connections = Phaser.Math.Between(1, 2);
      for (let c = 0; c < connections; c++) {
        const target = nodes[Phaser.Math.Between(0, nodes.length - 1)];
        const dist = Phaser.Math.Distance.Between(node.x, node.y, target.x, target.y);
        if (dist > 40 && dist < nodeSpacing * 2) {
          // Draw right-angle traces (circuit style)
          if (Math.random() > 0.5) {
            gfx.lineBetween(node.x, node.y, target.x, node.y);
            gfx.lineBetween(target.x, node.y, target.x, target.y);
          } else {
            gfx.lineBetween(node.x, node.y, node.x, target.y);
            gfx.lineBetween(node.x, target.y, target.x, target.y);
          }
        }
      }
    });

    // Draw small dots at nodes
    gfx.fillStyle(0x00f0ff, 0.08);
    nodes.forEach(node => {
      if (Math.random() > 0.6) {
        gfx.fillCircle(node.x, node.y, 2);
      }
    });
  }

  createGlowOrb(x, y, radius, color, alpha) {
    const orb = this.add.circle(x, y, radius, color, alpha);
    this.tweens.add({
      targets: orb,
      alpha: alpha * 0.3,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: Phaser.Math.Between(3000, 5000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return orb;
  }

  update() {
    if (!this.particlesActive) return;
    const { width, height } = this.cameras.main;

    this.particles.forEach(p => {
      p.obj.y -= p.speed;
      p.obj.x += p.drift;
      p.phase += p.phaseSpeed;
      p.obj.setAlpha(p.maxAlpha * (0.5 + Math.sin(p.phase) * 0.5));

      if (p.obj.y < -20) {
        p.obj.y = height + 20;
        p.obj.x = Phaser.Math.Between(0, width);
      }
      if (p.obj.x < -20) p.obj.x = width + 10;
      if (p.obj.x > width + 20) p.obj.x = -10;
    });
  }
}
