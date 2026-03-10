class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  init(data) {
    this.settings = data.settings;
  }

  async create() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    loadingOverlay.classList.remove('hidden');

    // Animate loading bar
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + Phaser.Math.Between(3, 8), 85);
      loadingBar.style.width = progress + '%';
    }, 200);

    const messages = [
      'AI is je quizmaster aan het maken...',
      'Persoonlijkheid wordt geladen...',
      'Catchphrase wordt verzonnen...',
      'Kleuren worden gemixed...',
      'Bijna klaar...',
    ];

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      loadingText.textContent = messages[msgIndex];
    }, 1500);

    try {
      // Call API to generate character
      const character = await API.generateCharacter({
        thema: this.settings.thema,
        stijl: this.settings.stijl,
        taal: this.settings.taal,
        avatarDesc: this.settings.avatarDesc,
      });

      clearInterval(progressInterval);
      clearInterval(msgInterval);

      if (character.blocked) {
        loadingBar.style.width = '100%';
        loadingText.textContent = character.message;
        await new Promise(r => setTimeout(r, 2000));
        loadingOverlay.classList.add('hidden');
        this.scene.start('SetupScene');
        return;
      }

      // Complete loading bar
      loadingBar.style.width = '100%';

      // Apply theme colors
      if (character.kleuren) {
        const root = document.documentElement;
        root.style.setProperty('--primary', character.kleuren.primary || DEFAULT_COLORS.primary);
        root.style.setProperty('--secondary', character.kleuren.secondary || DEFAULT_COLORS.secondary);
        root.style.setProperty('--bg-dark', character.kleuren.background || DEFAULT_COLORS.background);
        root.style.setProperty('--correct', character.kleuren.correct || DEFAULT_COLORS.correct);
        root.style.setProperty('--wrong', character.kleuren.wrong || DEFAULT_COLORS.wrong);
      }

      // Hide loading, show character
      loadingOverlay.classList.add('hidden');

      const charOverlay = document.getElementById('character-overlay');
      const charEmoji = document.getElementById('char-emoji');
      const charName = document.getElementById('char-name');
      const charCatchphrase = document.getElementById('char-catchphrase');
      const charDesc = document.getElementById('char-desc');

      // Show DALL-E image if available, otherwise emoji
      const existingImg = document.getElementById('avatar-img');
      if (existingImg) existingImg.remove();
      if (character.avatarImage) {
        const img = document.createElement('img');
        img.id = 'avatar-img';
        img.src = character.avatarImage;
        img.alt = this.settings.avatarDesc || 'avatar';
        charEmoji.style.display = 'none';
        charEmoji.parentElement.insertBefore(img, charEmoji);
      } else {
        charEmoji.style.display = '';
        charEmoji.textContent = character.emoji || '🎮';
      }
      charName.textContent = character.naam || 'De Quizmaster';
      charName.dataset.text = character.naam || 'De Quizmaster';
      charCatchphrase.textContent = `"${character.catchphrase || 'Let the quiz begin!'}"`;
      charDesc.textContent = character.beschrijving || '';

      // Show avatar description label if player typed one
      const existingLabel = document.querySelector('.avatar-desc-label');
      if (existingLabel) existingLabel.remove();
      if (this.settings.avatarDesc) {
        const label = document.createElement('p');
        label.className = 'avatar-desc-label';
        label.textContent = `jouw avatar: ${this.settings.avatarDesc}`;
        document.getElementById('avatar-container').appendChild(label);
      }

      // Style avatar ring with character's primary color
      const avatarRing = document.getElementById('avatar-ring');
      if (avatarRing && character.kleuren && character.kleuren.primary) {
        const c = character.kleuren.primary;
        avatarRing.style.borderColor = c;
        avatarRing.style.boxShadow = `0 0 20px ${c}66, 0 0 60px ${c}26, inset 0 0 30px ${c}0d`;
      }

      // Update start button text if AI provided custom text
      const letsGoBtn = document.getElementById('lets-go-btn');
      if (character.ui && character.ui.startKnop) {
        letsGoBtn.querySelector('.btn-text').textContent = character.ui.startKnop;
      }

      charOverlay.classList.remove('hidden');

      // Store character + settings for quiz
      this.gameData = {
        settings: this.settings,
        character,
      };

      letsGoBtn.onclick = () => {
        charOverlay.classList.add('hidden');
        this.scene.start('QuizScene', this.gameData);
      };

    } catch (error) {
      console.error('Error loading character:', error);
      clearInterval(progressInterval);
      clearInterval(msgInterval);
      loadingText.textContent = 'Er ging iets mis! Probeer opnieuw...';
      await new Promise(r => setTimeout(r, 2000));
      loadingOverlay.classList.add('hidden');
      this.scene.start('SetupScene');
    }
  }
}
