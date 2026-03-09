class SetupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SetupScene' });
  }

  create() {
    // Show the HTML setup overlay
    const overlay = document.getElementById('setup-overlay');
    overlay.classList.remove('hidden');

    // Theme button selection
    const themeGrid = document.getElementById('theme-grid');

    themeGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (!btn) return;
      themeGrid.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });

    // Difficulty buttons
    this.setupButtonGroup('diff-btn');

    // Start quiz button
    const startBtn = document.getElementById('start-quiz-btn');
    startBtn.onclick = () => {
      const settings = this.gatherSettings();
      overlay.classList.add('hidden');
      this.scene.start('LoadingScene', { settings });
    };
  }

  setupButtonGroup(className) {
    document.querySelectorAll(`.${className}`).forEach(btn => {
      btn.addEventListener('click', () => {
        btn.parentElement.querySelectorAll(`.${className}`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  gatherSettings() {
    const selectedThemeBtn = document.querySelector('.theme-btn.selected');
    const thema = selectedThemeBtn ? selectedThemeBtn.dataset.theme : 'AI & Kunstmatige Intelligentie';

    const stijl = document.getElementById('style-select').value;

    const diffBtn = document.querySelector('.diff-btn.selected');
    const moeilijkheid = diffBtn ? diffBtn.dataset.diff : 'Normal';

    const avatarDesc = document.getElementById('avatar-desc').value.trim();

    return {
      thema,
      stijl,
      taal: 'Nederlands',
      moeilijkheid,
      vraagType: 'Multiple Choice',
      modifier: 'none',
      avatarDesc,
    };
  }
}
