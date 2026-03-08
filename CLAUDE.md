# QuizRoyale - AI-Driven Quiz Game

## Beschrijving
Een interactieve AI-gestuurde quiz game voor de open dag van MBO4 Software Developer - Applied AI (WeDoTechProjects).
Bezoekers (12-16 jaar) ervaren de kracht van AI: alles wordt live gegenereerd door AI.

## Tech Stack
- **Frontend**: Phaser 3 (game engine) + HTML/CSS
- **Backend**: Node.js + Express
- **AI**: Multi-provider (OpenAI, Google Gemini, Ollama)
- **Database**: SQLite (better-sqlite3) voor persistent highscores
- **Styling**: Cyberpunk arcade aesthetic met CRT scanlines

## Hoe te runnen
1. `npm install`
2. Vul je API key in `.env` (OpenAI, Gemini, of Ollama)
3. `node server.js`
4. Open `http://localhost:3000`

## Structuur
- `server.js` - Express backend met multi-LLM API endpoints + SQLite highscores
- `public/` - Frontend (Phaser game)
- `public/js/scenes/` - Game scenes (Boot, Title, Setup, Loading, Quiz, GameOver)
- `public/js/api.js` - API communicatie
- `public/js/constants.js` - Configuratie, ranks, en guardrails
- `public/css/style.css` - Cyberpunk styling met CSS custom properties

## Features
- AI-gegenereerde quizmaster characters met pixel art avatars
- 12 tech-focused thema's (AI, SD, Game Dev, AR/VR, Cybersecurity, etc.)
- "Wist je dat...?" weetjes en opleiding tips tussen vragen
- Persistent highscores met leaderboard (SQLite)
- Difficulty multipliers (Chill x1, Normal x1.5, Beast Mode x2.5)
- Game modifiers (Speed Round, Mystery, Boss Vraag)
- Timer countdown met kleurverandering
- Streak systeem met multipliers
- Navigatie: quit tijdens quiz, home/replay na game over

## Conventies
- Scenes in aparte bestanden in `public/js/scenes/`
- API responses altijd als JSON
- Multi-layer guardrails: blocklist, input sanitization, system prompt, safety settings
- Kindvriendelijke content (12-16 jaar, schoolomgeving)
- Alle thema's tech/AI/SD gerelateerd
