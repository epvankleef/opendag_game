# QuizRoyale - AI-Driven Quiz Game

## Beschrijving
Een interactieve AI-gestuurde quiz game voor de open dag van MBO4 Software Developer - Applied AI.
Bezoekers (12-16 jaar) ervaren de kracht van AI: alles wordt live gegenereerd door Google Gemini.

## Tech Stack
- **Frontend**: Phaser 3 (game engine) + HTML/CSS
- **Backend**: Node.js + Express
- **AI**: Google Gemini 2.0 Flash (gratis tier)
- **Geen database** - alles client-side

## Hoe te runnen
1. `npm install`
2. Vul je Gemini API key in `.env`
3. `node server.js`
4. Open `http://localhost:3000`

## Structuur
- `server.js` - Express backend met Gemini API endpoints
- `public/` - Frontend (Phaser game)
- `public/js/scenes/` - Game scenes (Title, Setup, Loading, Quiz, GameOver)
- `public/js/api.js` - API communicatie
- `public/js/constants.js` - Configuratie en guardrails

## Conventies
- Scenes in aparte bestanden in `public/js/scenes/`
- API responses altijd als JSON
- Guardrails op input (blocklist), system prompt, en Gemini safety settings
- Kindvriendelijke content (12-16 jaar, schoolomgeving)
