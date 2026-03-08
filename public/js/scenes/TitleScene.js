class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Animated grid background
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x00f0ff, 0.06);
    for (let x = 0; x < width; x += 40) {
      gridGraphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      gridGraphics.lineBetween(0, y, width, y);
    }

    // Floating particles (more + colorful)
    this.particles = [];
    const colors = [0x00f0ff, 0xff00aa, 0xffe600];
    for (let i = 0; i < 80; i++) {
      const color = colors[i % 3];
      const size = Phaser.Math.Between(1, 4);
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        size,
        color,
        Phaser.Math.FloatBetween(0.1, 0.5)
      );
      this.particles.push({
        obj: p,
        speed: Phaser.Math.FloatBetween(0.3, 1.5),
        drift: Phaser.Math.FloatBetween(-0.5, 0.5),
        pulse: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }

    // Decorative corner brackets
    const bracketStyle = { fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#00f0ff' };
    this.add.text(30, 20, '┌', bracketStyle).setAlpha(0.3);
    this.add.text(width - 50, 20, '┐', bracketStyle).setAlpha(0.3);
    this.add.text(30, height - 40, '└', bracketStyle).setAlpha(0.3);
    this.add.text(width - 50, height - 40, '┘', bracketStyle).setAlpha(0.3);

    // "QUIZ" text
    const titleStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: '52px',
      color: '#00f0ff',
      stroke: '#0a0a1a',
      strokeThickness: 6,
    };

    this.titleText = this.add.text(width / 2, height * 0.28, 'QUIZ', titleStyle)
      .setOrigin(0.5)
      .setAlpha(0);

    // "ROYALE" text
    this.titleText2 = this.add.text(width / 2, height * 0.28 + 65, 'ROYALE', {
      ...titleStyle,
      fontSize: '52px',
      color: '#ff00aa',
    }).setOrigin(0.5).setAlpha(0);

    // Decorative line
    this.line = this.add.rectangle(width / 2, height * 0.44, 0, 3, 0x00f0ff, 0.8);

    // Subtitle
    this.subtitle = this.add.text(width / 2, height * 0.50, 'AI-POWERED QUIZ GAME', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#ffe600',
    }).setOrigin(0.5).setAlpha(0);

    // MBO4 badge
    this.badge = this.add.text(width / 2, height * 0.57, 'MBO4 Software Developer — Applied AI', {
      fontFamily: '"Exo 2"',
      fontSize: '14px',
      color: '#6a6a9a',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Start instruction
    this.startText = this.add.text(width / 2, height * 0.72, '▶  KLIK OM TE STARTEN  ◀', {
      fontFamily: '"Press Start 2P"',
      fontSize: '13px',
      color: '#e0e8ff',
    }).setOrigin(0.5).setAlpha(0);

    // Version / powered by text
    this.add.text(width / 2, height - 20, 'Powered by AI  •  Geen enkele vraag is vooraf geschreven', {
      fontFamily: '"Exo 2"',
      fontSize: '11px',
      color: '#3a3a6a',
    }).setOrigin(0.5).setAlpha(0.6);

    // Animate in sequence
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      y: height * 0.25,
      duration: 800,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: this.titleText2,
      alpha: 1,
      y: height * 0.25 + 65,
      duration: 800,
      ease: 'Back.easeOut',
      delay: 200,
    });

    this.tweens.add({
      targets: this.line,
      width: 350,
      duration: 600,
      delay: 500,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.subtitle,
      alpha: 1,
      duration: 500,
      delay: 700,
    });

    this.tweens.add({
      targets: this.badge,
      alpha: 1,
      duration: 500,
      delay: 900,
    });

    this.tweens.add({
      targets: this.startText,
      alpha: 1,
      duration: 500,
      delay: 1100,
    });

    // Pulsing start text
    this.time.addEvent({
      delay: 1600,
      callback: () => {
        this.tweens.add({
          targets: this.startText,
          alpha: 0.3,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      },
    });

    // Subtle title float
    this.tweens.add({
      targets: [this.titleText, this.titleText2],
      y: '+=6',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1500,
    });

    // Click to start
    this.input.on('pointerdown', () => {
      this.tweens.add({
        targets: [this.titleText, this.titleText2, this.subtitle, this.startText, this.line, this.badge],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.scene.start('SetupScene');
        },
      });
    });
  }

  update() {
    const { width, height } = this.cameras.main;
    this.particles.forEach(p => {
      p.obj.y -= p.speed;
      p.obj.x += p.drift;
      p.pulse += 0.02;
      p.obj.setAlpha(0.15 + Math.sin(p.pulse) * 0.15);
      if (p.obj.y < -10) {
        p.obj.y = height + 10;
        p.obj.x = Phaser.Math.Between(0, width);
      }
    });
  }
}
