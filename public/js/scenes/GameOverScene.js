class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.settings = data.settings;
    this.character = data.character;
    this.score = data.score;
    this.correctCount = data.correctCount;
    this.totalQuestions = data.totalQuestions;
    this.highestStreak = data.highestStreak;
  }

  _renderAvatar(containerId, size) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    if (this.character.avatarImage) {
      const img = document.createElement('img');
      img.src = this.character.avatarImage;
      img.className = 'char-avatar-img';
      img.style.width = img.style.height = size + 'px';
      el.appendChild(img);
    } else {
      el.textContent = this.character.emoji || '🎮';
      el.style.fontSize = Math.round(size * 0.55) + 'px';
    }
  }

  async create() {
    const overlay = document.getElementById('gameover-overlay');
    const percentage = Math.round((this.correctCount / this.totalQuestions) * 100);
    const rank = getRank(percentage);
    const rankData = RANKS[rank];

    // Render avatar prominently
    this._renderAvatar('gameover-avatar-wrap', 130);

    // Set rank badge
    document.getElementById('rank-icon').textContent = rankData.icon;
    document.getElementById('rank-name').textContent = rank.toUpperCase();

    // Reset panel class
    const panel = document.querySelector('.gameover-panel');
    panel.className = 'gameover-panel';

    // Set stats
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-correct').textContent = `${this.correctCount}/${this.totalQuestions}`;
    document.getElementById('final-streak').textContent = this.highestStreak;

    // Show overlay with placeholder while AI generates
    document.getElementById('player-title').textContent = '...';
    document.getElementById('gameover-story').textContent = 'AI is je resultaat aan het beoordelen...';
    document.getElementById('gameover-closer').textContent = '';

    // Reset highscore section
    document.getElementById('highscore-submit').classList.remove('hidden');
    document.getElementById('player-name').value = '';

    overlay.classList.remove('hidden');

    // Show leaderboard immediately
    this.showLeaderboard();

    // Get AI game over data
    try {
      const gameover = await API.generateGameOver({
        score: this.score,
        maxScore: this.totalQuestions * GAME_CONFIG.basePoints * 3,
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        highestStreak: this.highestStreak,
        thema: this.settings.thema,
        stijl: this.settings.stijl,
        karakterNaam: this.character.naam,
        taal: this.settings.taal,
      });

      document.getElementById('player-title').textContent = `"${gameover.titel || 'Quiz Held'}"`;
      document.getElementById('gameover-story').textContent = gameover.verhaal || '';
      document.getElementById('gameover-closer').textContent = gameover.afsluitZin || '';

      if (gameover.badge && gameover.badge.naam) {
        document.getElementById('rank-icon').textContent = gameover.badge.emoji || rankData.icon;
        document.getElementById('rank-name').textContent = gameover.badge.naam;
      } else if (gameover.rank && RANKS[gameover.rank]) {
        document.getElementById('rank-name').textContent = gameover.rank.toUpperCase();
        document.getElementById('rank-icon').textContent = RANKS[gameover.rank].icon;
      }
    } catch (error) {
      console.error('Error generating gameover:', error);
      document.getElementById('player-title').textContent = `"Quiz ${rank}"`;
      document.getElementById('gameover-story').textContent = `Je hebt ${this.correctCount} van de ${this.totalQuestions} vragen goed beantwoord!`;
      document.getElementById('gameover-closer').textContent = 'Goed gespeeld!';
    }

    // Submit highscore
    document.getElementById('submit-score-btn').onclick = async () => {
      const naam = document.getElementById('player-name').value.trim() || 'Anoniem';
      await API.submitHighscore({
        naam,
        score: this.score,
        thema: this.settings.thema,
        moeilijkheid: this.settings.moeilijkheid,
        rank,
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        karakterNaam: this.character.naam || '',
        karakterEmoji: this.character.emoji || '🎮',
        avatar: this.character.avatarImage || '',
      });

      document.getElementById('highscore-submit').classList.add('hidden');
      await this.showLeaderboard();
    };

    // Reset colors helper
    const resetColors = () => {
      const root = document.documentElement;
      Object.entries(DEFAULT_COLORS).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
      root.style.setProperty('--bg-dark', '#0a0a1a');
    };

    // Replay button - back to setup
    document.getElementById('replay-btn').onclick = () => {
      overlay.classList.add('hidden');
      resetColors();
      this.scene.start('SetupScene');
    };

    // Home button - back to title screen
    document.getElementById('home-btn').onclick = () => {
      overlay.classList.add('hidden');
      resetColors();
      this.scene.start('TitleScene');
    };
  }

  async showLeaderboard() {
    const leaderboardDiv = document.getElementById('leaderboard');
    const listDiv = document.getElementById('leaderboard-list');
    leaderboardDiv.classList.remove('hidden');

    try {
      const scores = await API.getHighscores();
      listDiv.innerHTML = '';

      scores.forEach((entry, i) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row' + (i < 3 ? ' top-3' : '');
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const avatarHtml = entry.avatar
          ? `<img src="${entry.avatar}" class="lb-avatar-img" alt="avatar">`
          : `<span class="lb-avatar-emoji">${entry.karakterEmoji || '🎮'}</span>`;
        row.innerHTML = `
          <span class="lb-rank">${medal}</span>
          <span class="lb-name">${avatarHtml} ${entry.naam}</span>
          <span class="lb-theme">${entry.thema || ''}</span>
          <span class="lb-diff">${entry.moeilijkheid || ''}</span>
          <span class="lb-score">${entry.score}</span>
        `;
        listDiv.appendChild(row);
      });

      if (scores.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color: var(--text-dim);">Nog geen scores!</p>';
      }
    } catch {
      listDiv.innerHTML = '<p style="text-align:center; color: var(--text-dim);">Kon leaderboard niet laden</p>';
    }
  }
}
