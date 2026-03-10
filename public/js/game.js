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

// Explicitly load fonts before starting Phaser so canvas text renders correctly
Promise.all([
  document.fonts.load('16px "Press Start 2P"'),
  document.fonts.load('16px "Exo 2"'),
]).then(() => {
  new Phaser.Game(config);
});
