// Game constants
const GAME_CONFIG = {
  totalQuestions: 10,
  basePoints: 100,
  timeBonus: 50,
  timerDuration: 15, // seconds
  speedTimerDuration: 7,
  streakMultiplierThreshold: 3, // streak needed for 2x
  superStreakThreshold: 5, // streak needed for 3x
  beastModeMultiplier: 2,
  speedModeMultiplier: 1.5,
  difficultyMultipliers: {
    'Chill': 1,
    'Normal': 1.5,
    'Beast Mode': 2.5,
  },
};

const RANKS = {
  Bronze: { icon: '🥉', minPercent: 0, color: '#cd7f32' },
  Silver: { icon: '🥈', minPercent: 30, color: '#c0c0c0' },
  Gold: { icon: '🥇', minPercent: 50, color: '#ffd700' },
  Platinum: { icon: '💠', minPercent: 70, color: '#e5e4e2' },
  Diamond: { icon: '💎', minPercent: 90, color: '#b9f2ff' },
};

function getRank(percentage) {
  if (percentage >= 90) return 'Diamond';
  if (percentage >= 70) return 'Platinum';
  if (percentage >= 50) return 'Gold';
  if (percentage >= 30) return 'Silver';
  return 'Bronze';
}

// Default theme colors
const DEFAULT_COLORS = {
  primary: '#00f0ff',
  secondary: '#ff00aa',
  background: '#0a0a1a',
  text: '#e0e8ff',
  correct: '#00ff88',
  wrong: '#ff3355',
};
