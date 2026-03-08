class QuizScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizScene' });
  }

  init(data) {
    this.settings = data.settings;
    this.character = data.character;
    this.currentQuestion = 0;
    this.score = 0;
    this.streak = 0;
    this.highestStreak = 0;
    this.correctCount = 0;
    this.previousQuestions = [];
    this.timerRunning = false;
    this.timeLeft = 0;
    this.answered = false;
  }

  create() {
    const overlay = document.getElementById('quiz-overlay');
    overlay.classList.remove('hidden');

    // Set up next button handler
    document.getElementById('next-btn').onclick = () => {
      this.nextQuestion();
    };

    // Reset UI state from previous session
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('quiz-answers').innerHTML = '';
    document.getElementById('quiz-question').textContent = '';
    document.getElementById('quiz-intro').textContent = '';
    document.getElementById('next-btn').textContent = 'VOLGENDE ▶';

    // Quit button - back to setup
    document.getElementById('quit-btn').onclick = () => {
      if (this.timerInterval) clearInterval(this.timerInterval);
      overlay.classList.add('hidden');
      const root = document.documentElement;
      Object.entries(DEFAULT_COLORS).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
      root.style.setProperty('--bg-dark', '#0a0a1a');
      this.scene.start('TitleScene');
    };

    // Start first question
    this.loadQuestion();
  }

  async loadQuestion() {
    this.answered = false;
    this.currentQuestion++;

    // Update UI
    document.getElementById('quiz-score').textContent = this.score;
    document.getElementById('quiz-number').textContent = `${this.currentQuestion}/${GAME_CONFIG.totalQuestions}`;
    document.getElementById('quiz-streak').textContent = `🔥 ${this.streak}`;

    // Hide feedback, clear answers
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('quiz-answers').innerHTML = '';
    document.getElementById('quiz-question').textContent = '';
    document.getElementById('quiz-intro').textContent = '';
    document.getElementById('timer-text').textContent = '';
    document.getElementById('quiz-question').classList.add('loading-question');

    // Determine if this is a boss question
    const isBoss = this.settings.modifier === 'boss' && this.currentQuestion === GAME_CONFIG.totalQuestions;
    // Mystery mode: random theme each question
    let thema = this.settings.thema;
    if (this.settings.modifier === 'mystery') {
      const themes = ['AI & Kunstmatige Intelligentie', 'Software Development & Programmeren', 'AI Tools zoals ChatGPT, Copilot en Midjourney', 'Game Development & Game Design', 'AR, VR en Mixed Reality', 'Cybersecurity & Ethical Hacking', 'Robotica & Automatisering', 'Data Science & Machine Learning', 'Cloud Computing & DevOps', 'Internet of Things & Smart Devices', 'Web Development & Apps', 'Blockchain & Crypto Technologie'];
      thema = themes[Math.floor(Math.random() * themes.length)];
    }

    try {
      const questionData = await API.generateQuestion({
        thema,
        stijl: this.settings.stijl,
        taal: this.settings.taal,
        moeilijkheid: isBoss ? 'Beast Mode' : this.settings.moeilijkheid,
        vraagType: this.settings.vraagType,
        vraagNummer: this.currentQuestion,
        score: this.score,
        streak: this.streak,
        karakterNaam: this.character.naam,
        previousQuestions: this.previousQuestions,
      });

      this.currentQuestionData = questionData;
      this.previousQuestions.push(questionData.vraag);

      // Display question
      document.getElementById('quiz-question').classList.remove('loading-question');
      document.getElementById('quiz-intro').textContent = questionData.introTekst || '';
      document.getElementById('quiz-question').textContent = questionData.vraag;

      // If boss question, show indicator
      if (isBoss) {
        document.getElementById('quiz-intro').textContent = '👑 BOSS VRAAG! TRIPLE POINTS! 👑';
      }

      // Create answer buttons
      const answersDiv = document.getElementById('quiz-answers');
      answersDiv.innerHTML = '';

      questionData.opties.forEach((optie, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = optie;
        btn.onclick = () => this.handleAnswer(index, questionData);
        answersDiv.appendChild(btn);
      });

      // Start timer
      this.startTimer();

    } catch (error) {
      console.error('Error loading question:', error);
      document.getElementById('quiz-question').textContent = 'Oeps! Kon geen vraag laden. Even geduld...';
      setTimeout(() => this.loadQuestion(), 2000);
      this.currentQuestion--;
    }
  }

  startTimer() {
    const isSpeed = this.settings.modifier === 'speed';
    const duration = isSpeed ? GAME_CONFIG.speedTimerDuration : GAME_CONFIG.timerDuration;
    this.timeLeft = duration;
    this.timerRunning = true;

    const timerBar = document.getElementById('timer-bar');
    const timerText = document.getElementById('timer-text');
    timerBar.style.width = '100%';
    timerBar.className = 'timer-bar';
    timerText.textContent = Math.ceil(this.timeLeft);

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (!this.timerRunning) return;

      this.timeLeft -= 0.1;
      const pct = (this.timeLeft / duration) * 100;
      timerBar.style.width = Math.max(0, pct) + '%';
      timerText.textContent = Math.max(0, Math.ceil(this.timeLeft));

      // Color changes
      if (pct < 20) {
        timerBar.className = 'timer-bar danger';
        timerText.className = 'timer-text danger';
      } else if (pct < 50) {
        timerBar.className = 'timer-bar warning';
        timerText.className = 'timer-text warning';
      } else {
        timerText.className = 'timer-text';
      }

      if (this.timeLeft <= 0) {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        timerText.textContent = '0';
        if (!this.answered) {
          this.handleTimeout();
        }
      }
    }, 100);
  }

  handleTimeout() {
    this.answered = true;
    this.streak = 0;

    // Disable all buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.classList.add('disabled');
    });

    // Highlight correct answer
    const correctIndex = this.currentQuestionData.correctIndex;
    const buttons = document.querySelectorAll('.answer-btn');
    if (buttons[correctIndex]) {
      buttons[correctIndex].classList.add('correct');
    }

    // Show feedback
    this.showFeedback(false, 'Tijd is op!', `Het juiste antwoord was: ${this.currentQuestionData.opties[correctIndex]}`);
  }

  async handleAnswer(selectedIndex, questionData) {
    if (this.answered) return;
    this.answered = true;
    this.timerRunning = false;
    clearInterval(this.timerInterval);

    const isCorrect = selectedIndex === questionData.correctIndex;
    const buttons = document.querySelectorAll('.answer-btn');

    // Disable all buttons
    buttons.forEach(btn => btn.classList.add('disabled'));

    // Highlight selected and correct
    buttons[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      buttons[questionData.correctIndex].classList.add('correct');
    }

    if (isCorrect) {
      this.streak++;
      this.correctCount++;
      if (this.streak > this.highestStreak) this.highestStreak = this.streak;

      // Calculate points
      let points = GAME_CONFIG.basePoints;

      // Time bonus
      const duration = this.settings.modifier === 'speed' ? GAME_CONFIG.speedTimerDuration : GAME_CONFIG.timerDuration;
      const timePct = this.timeLeft / duration;
      points += Math.round(GAME_CONFIG.timeBonus * timePct);

      // Streak multiplier
      if (this.streak >= GAME_CONFIG.superStreakThreshold) {
        points *= 3;
      } else if (this.streak >= GAME_CONFIG.streakMultiplierThreshold) {
        points *= 2;
      }

      // Difficulty multiplier (harder = more points)
      const diffMult = GAME_CONFIG.difficultyMultipliers[this.settings.moeilijkheid] || 1;
      points = Math.round(points * diffMult);

      // Speed mode bonus
      if (this.settings.modifier === 'speed') {
        points = Math.round(points * GAME_CONFIG.speedModeMultiplier);
      }

      // Boss question bonus
      if (this.settings.modifier === 'boss' && this.currentQuestion === GAME_CONFIG.totalQuestions) {
        points *= 3;
      }

      this.score += points;
      document.getElementById('quiz-score').textContent = this.score;
      document.getElementById('quiz-streak').textContent = `🔥 ${this.streak}`;

      // Score popup animation
      this.showScorePopup(points);

      // Streak flash
      if (this.streak >= GAME_CONFIG.streakMultiplierThreshold) {
        this.showStreakFlash();
      }
    } else {
      this.streak = 0;
      document.getElementById('quiz-streak').textContent = `🔥 0`;
    }

    // Get AI feedback
    try {
      const feedback = await API.generateFeedback({
        vraag: questionData.vraag,
        gekozenAntwoord: questionData.opties[selectedIndex],
        correctAntwoord: questionData.opties[questionData.correctIndex],
        isCorrect,
        streak: this.streak,
        stijl: this.settings.stijl,
        karakterNaam: this.character.naam,
        taal: this.settings.taal,
      });

      this.showFeedback(isCorrect, feedback.reactie, feedback.uitleg);
    } catch {
      this.showFeedback(
        isCorrect,
        isCorrect ? 'Goed gedaan! 🎉' : 'Helaas!',
        isCorrect ? '' : `Het juiste antwoord was: ${questionData.opties[questionData.correctIndex]}`
      );
    }
  }

  showFeedback(isCorrect, text, explanation) {
    const feedbackDiv = document.getElementById('quiz-feedback');
    const feedbackText = document.getElementById('feedback-text');
    const feedbackExpl = document.getElementById('feedback-explanation');

    feedbackText.textContent = text;
    feedbackText.style.color = isCorrect ? 'var(--correct)' : 'var(--wrong)';
    feedbackExpl.textContent = explanation || '';
    feedbackDiv.classList.remove('hidden');

    // Update next button text on last question
    if (this.currentQuestion >= GAME_CONFIG.totalQuestions) {
      document.getElementById('next-btn').textContent = 'BEKIJK RESULTAAT ▶';
    }
  }

  showScorePopup(points) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    popup.style.left = '50%';
    popup.style.top = '40%';
    popup.style.transform = 'translateX(-50%)';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  }

  showStreakFlash() {
    const flash = document.createElement('div');
    flash.className = 'streak-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
  }

  nextQuestion() {
    if (this.currentQuestion >= GAME_CONFIG.totalQuestions) {
      // Game over
      document.getElementById('quiz-overlay').classList.add('hidden');
      this.scene.start('GameOverScene', {
        settings: this.settings,
        character: this.character,
        score: this.score,
        correctCount: this.correctCount,
        totalQuestions: GAME_CONFIG.totalQuestions,
        highestStreak: this.highestStreak,
      });
    } else if (this.currentQuestion === 3 || this.currentQuestion === 6) {
      // Show fun fact / opleiding tip after question 3 and 6
      this.showFunFact();
    } else {
      this.loadQuestion();
    }
  }

  async showFunFact() {
    const quizOverlay = document.getElementById('quiz-overlay');
    const funfactOverlay = document.getElementById('funfact-overlay');
    const panel = document.querySelector('.funfact-panel');

    quizOverlay.classList.add('hidden');

    // Set loading state
    document.getElementById('funfact-emoji').textContent = '⏳';
    document.getElementById('funfact-title').textContent = 'EVEN GEDULD...';
    document.getElementById('funfact-text').textContent = 'AI genereert een weetje...';
    panel.className = 'funfact-panel';
    funfactOverlay.classList.remove('hidden');

    try {
      const fact = await API.generateFunFact({
        thema: this.settings.thema,
        taal: this.settings.taal,
        stijl: this.settings.stijl,
        karakterNaam: this.character.naam,
        vraagNummer: this.currentQuestion,
      });

      document.getElementById('funfact-emoji').textContent = fact.emoji || '🤯';
      document.getElementById('funfact-title').textContent = fact.titel || 'WIST JE DAT...?';
      document.getElementById('funfact-text').textContent = fact.tekst || '';

      if (fact.type === 'opleiding') {
        panel.classList.add('opleiding');
      }
    } catch {
      document.getElementById('funfact-emoji').textContent = '🤯';
      document.getElementById('funfact-title').textContent = 'WIST JE DAT...?';
      document.getElementById('funfact-text').textContent = 'AI kan in milliseconden unieke quizvragen genereren - elke keer anders!';
    }

    document.getElementById('funfact-continue-btn').onclick = () => {
      funfactOverlay.classList.add('hidden');
      quizOverlay.classList.remove('hidden');
      this.loadQuestion();
    };
  }

  shutdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
