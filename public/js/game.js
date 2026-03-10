// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, SetupScene, LoadingScene, QuizScene, GameOverScene],
};

// Wait for fonts to load before starting Phaser so canvas text renders correctly
document.fonts.ready.then(() => {
  new Phaser.Game(config);
});
