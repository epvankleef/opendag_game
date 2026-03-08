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
    const customTheme = document.getElementById('custom-theme');

    themeGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (!btn) return;
      themeGrid.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      customTheme.value = '';
    });

    customTheme.addEventListener('input', () => {
      if (customTheme.value.trim()) {
        themeGrid.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('selected'));
      }
    });

    // Difficulty buttons
    this.setupButtonGroup('diff-btn');
    this.setupButtonGroup('type-btn');
    this.setupButtonGroup('mod-btn');

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
    const customTheme = document.getElementById('custom-theme').value.trim();
    const thema = customTheme || (selectedThemeBtn ? selectedThemeBtn.dataset.theme : 'AI & Technologie');

    const stijl = document.getElementById('style-select').value;
    const taal = document.getElementById('language-select').value;

    const diffBtn = document.querySelector('.diff-btn.selected');
    const moeilijkheid = diffBtn ? diffBtn.dataset.diff : 'Normal';

    const typeBtn = document.querySelector('.type-btn.selected');
    const vraagType = typeBtn ? typeBtn.dataset.type : 'Multiple Choice';

    const modBtn = document.querySelector('.mod-btn.selected');
    const modifier = modBtn ? modBtn.dataset.mod : 'none';

    const avatarDesc = document.getElementById('avatar-desc').value.trim();

    return { thema, stijl, taal, moeilijkheid, vraagType, modifier, avatarDesc };
  }
}
