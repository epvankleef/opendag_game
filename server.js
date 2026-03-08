require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================
// LLM Provider: openai, ollama, of gemini
// ============================================

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai', 'ollama', of 'gemini'
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function callLLM(prompt) {
  if (LLM_PROVIDER === 'gemini') return callGemini(prompt);
  if (LLM_PROVIDER === 'openai') return callOpenAI(prompt);
  return callOllama(prompt);
}

// Ollama provider
async function callOllama(prompt) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.response;
}

// OpenAI provider
async function callOpenAI(prompt) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1024,
  });
  return completion.choices[0].message.content;
}

// Gemini provider
async function callGemini(prompt) {
  const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
    ],
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Helper: parse JSON uit LLM response
function parseJSON(text) {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  // Probeer JSON te vinden in de response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(cleaned);
}

// ============================================
// Guardrails
// ============================================

const BLOCKLIST = [
  'porn', 'porno', 'sex', 'nude', 'naked', 'xxx', 'hentai',
  'drugs', 'cocaine', 'heroin', 'meth',
  'kill', 'murder', 'suicide', 'rape', 'terrorist', 'terrorism',
  'nazi', 'hitler', 'holocaust',
  'hoer', 'slet', 'kanker', 'tyfus', 'tering', 'kut', 'lul',
  'nigger', 'nigga', 'fag', 'faggot', 'retard',
  'wiet', 'wiets', 'crack', 'xtc',
  'geweld', 'moord', 'verkrachting', 'zelfmoord',
];

function containsBlockedContent(text) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return BLOCKLIST.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}

function sanitizeInput(text, maxLength = 100) {
  if (!text || typeof text !== 'string') return '';
  return text.slice(0, maxLength).replace(/[<>{}]/g, '');
}

const SYSTEM_PROMPT = `Je bent een vriendelijke, grappige quizmaster in een quiz game voor jongeren van 12-16 jaar op een schoolopendag van de MBO4 opleiding Software Developer - Applied AI.

CONTEXT:
- Dit is een open dag voor een ICT/Software Development opleiding met focus op AI.
- Bezoekers zijn potentiële studenten die geïnteresseerd zijn in tech, gaming, en AI.
- Probeer waar mogelijk een link te leggen naar technologie, AI, software development, of ICT.
- Bij gaming-thema's (Pokemon, Fortnite, etc.): mix vragen over het spel MET vragen over de technologie erachter (bijv. "Welke AI-techniek zorgt ervoor dat NPC's slim reageren?" of "In welke programmeertaal is Minecraft oorspronkelijk geschreven?").
- Bij tech-thema's: maak het concreet en herkenbaar voor jongeren.

STRIKTE REGELS:
- Genereer NOOIT content die gewelddadig, seksueel, racistisch, discriminerend of ongepast is.
- Houd alles leuk, respectvol en geschikt voor een schoolomgeving.
- Als een thema ongepast is, negeer het en gebruik het thema "Coole Tech Weetjes" in plaats daarvan.
- Gebruik GEEN scheldwoorden, beledigingen of grof taalgebruik.
- Antwoorden moeten feitelijk correct zijn.
- Reageer altijd in het gevraagde karakter/stijl, maar blijf kindvriendelijk.

Je antwoordt ALTIJD in valid JSON formaat, zonder markdown code blocks.`;

// ============================================
// API Endpoints
// ============================================

// POST /api/generate-character
app.post('/api/generate-character', async (req, res) => {
  try {
    let { thema, stijl, taal, avatarDesc } = req.body;
    thema = sanitizeInput(thema);
    stijl = sanitizeInput(stijl, 50);
    taal = sanitizeInput(taal, 30);
    avatarDesc = sanitizeInput(avatarDesc, 80);

    if (containsBlockedContent(thema) || containsBlockedContent(avatarDesc)) {
      return res.json({
        blocked: true,
        message: 'Nice try! 😄 Dat is niet beschikbaar. Kies iets anders!'
      });
    }

    const avatarInstruction = avatarDesc
      ? `De speler wil een avatar die lijkt op: "${avatarDesc}". Maak een pixel art avatar als een 10x10 grid van hex kleuren. Gebruik "" (lege string) voor transparante pixels. BELANGRIJK: Centreer de afbeelding in het 10x10 grid en gebruik het hele grid. Maak het herkenbaar. Houd het kindvriendelijk!`
      : `Maak een pixel art avatar passend bij het karakter als een 10x10 grid van hex kleuren. Gebruik "" (lege string) voor transparante pixels. BELANGRIJK: Centreer de afbeelding in het 10x10 grid en gebruik het hele grid.`;

    const prompt = `${SYSTEM_PROMPT}

Genereer een quizmaster karakter voor een quiz met deze instellingen:
- Thema: ${thema || 'AI & Technologie'}
- Stijl: ${stijl || 'Game Streamer'}
- Taal: ${taal || 'Nederlands'}

${avatarInstruction}

Antwoord in dit exacte JSON formaat:
{
  "naam": "een creatieve naam voor de quizmaster",
  "catchphrase": "een catchy catchphrase van max 10 woorden",
  "beschrijving": "korte beschrijving van het karakter (1 zin)",
  "emoji": "1 passend emoji",
  "kleuren": {
    "primary": "#hexkleur (hoofdkleur passend bij thema)",
    "secondary": "#hexkleur (accentkleur)",
    "background": "#hexkleur (donkere achtergrondkleur)",
    "text": "#hexkleur (tekstkleur, licht)",
    "correct": "#hexkleur (kleur voor goed antwoord)",
    "wrong": "#hexkleur (kleur voor fout antwoord)"
  },
  "pixelAvatar": [[row of 10 hex color strings or "" for transparent], ...10 rows total],
  "achtergrondStijl": "een van: neon, retro, space, graffiti, natuur, pixel, cyber",
  "ui": {
    "startKnop": "tekst voor start knop in stijl",
    "correctReactie": "korte reactie bij goed antwoord in karakter",
    "foutReactie": "korte reactie bij fout antwoord in karakter",
    "loadingTekst": "tekst tijdens laden in karakter"
  }
}`;

    const text = await callLLM(prompt);
    const character = parseJSON(text);
    res.json(character);
  } catch (error) {
    console.error('Error generating character:', error.message || error);
    res.status(500).json({ error: 'Kon geen karakter genereren. Probeer opnieuw!' });
  }
});

// POST /api/generate-question
app.post('/api/generate-question', async (req, res) => {
  try {
    let { thema, stijl, taal, moeilijkheid, vraagType, vraagNummer, score, streak, karakterNaam, previousQuestions } = req.body;
    thema = sanitizeInput(thema);
    stijl = sanitizeInput(stijl, 50);
    taal = sanitizeInput(taal, 30);
    moeilijkheid = sanitizeInput(moeilijkheid, 20);
    vraagType = sanitizeInput(vraagType, 30);

    const prevQuestionsText = previousQuestions && previousQuestions.length > 0
      ? `\n\nVorige vragen (NIET herhalen):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    const prompt = `${SYSTEM_PROMPT}

Je bent "${karakterNaam || 'De Quizmaster'}" in de stijl van een ${stijl || 'game streamer'}.
Genereer vraag ${vraagNummer || 1} van 10 voor een quiz.

Instellingen:
- Thema: ${thema || 'AI & Technologie'}
- Taal: ${taal || 'Nederlands'}
- Moeilijkheid: ${moeilijkheid || 'Normal'}
- Vraagtype: ${vraagType || 'Multiple Choice'}
- Huidige score: ${score || 0}
- Huidige streak: ${streak || 0}
${prevQuestionsText}

${vraagType === 'Waar of Niet Waar' ? 'Geef precies 2 opties: "Waar" en "Niet Waar".' : 'Geef precies 4 antwoordopties.'}

Antwoord in dit exacte JSON formaat:
{
  "vraag": "de quizvraag",
  "opties": ["optie1", "optie2"${vraagType === 'Waar of Niet Waar' ? '' : ', "optie3", "optie4"'}],
  "correctIndex": 0,
  "introTekst": "korte intro door de quizmaster in karakter (max 15 woorden)"
}

Het correctIndex is de 0-based index van het juiste antwoord.
Zorg dat de vraag NIEUW is en niet eerder gesteld.`;

    const text = await callLLM(prompt);
    const question = parseJSON(text);
    res.json(question);
  } catch (error) {
    console.error('Error generating question:', error.message || error);
    res.status(500).json({ error: 'Kon geen vraag genereren. Probeer opnieuw!' });
  }
});

// POST /api/generate-feedback
app.post('/api/generate-feedback', async (req, res) => {
  try {
    let { vraag, gekozenAntwoord, correctAntwoord, isCorrect, streak, stijl, karakterNaam, taal } = req.body;

    const prompt = `${SYSTEM_PROMPT}

Je bent "${karakterNaam || 'De Quizmaster'}" in de stijl van een ${sanitizeInput(stijl, 50) || 'game streamer'}.
Taal: ${sanitizeInput(taal, 30) || 'Nederlands'}

De speler heeft zojuist een vraag ${isCorrect ? 'GOED' : 'FOUT'} beantwoord.
- Vraag: ${sanitizeInput(vraag, 300)}
- Gekozen antwoord: ${sanitizeInput(gekozenAntwoord, 200)}
- Correct antwoord: ${sanitizeInput(correctAntwoord, 200)}
- Huidige streak: ${streak || 0}

${isCorrect && streak >= 3 ? 'De speler heeft een streak van ' + streak + '! Ga HELEMAAL LOS met je reactie!' : ''}
${!isCorrect ? 'Geef een respectvolle, grappige roast en leg kort uit wat het juiste antwoord was.' : ''}

Antwoord in dit exacte JSON formaat:
{
  "reactie": "reactie in karakter (max 25 woorden)",
  "uitleg": "korte uitleg van het juiste antwoord als het fout was, anders leeg (max 20 woorden)"
}`;

    const text = await callLLM(prompt);
    const feedback = parseJSON(text);
    res.json(feedback);
  } catch (error) {
    console.error('Error generating feedback:', error.message || error);
    res.json({
      reactie: isCorrect ? 'Goed gedaan! 🎉' : 'Helaas, dat was niet juist!',
      uitleg: ''
    });
  }
});

// POST /api/generate-gameover
app.post('/api/generate-gameover', async (req, res) => {
  try {
    let { score, maxScore, correctCount, totalQuestions, highestStreak, thema, stijl, karakterNaam, taal } = req.body;

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const prompt = `${SYSTEM_PROMPT}

Je bent "${karakterNaam || 'De Quizmaster'}" in de stijl van een ${sanitizeInput(stijl, 50) || 'game streamer'}.
Taal: ${sanitizeInput(taal, 30) || 'Nederlands'}

De quiz is afgelopen! Resultaten:
- Score: ${score} punten
- Goed: ${correctCount} van de ${totalQuestions} vragen (${percentage}%)
- Hoogste streak: ${highestStreak || 0}
- Thema: ${sanitizeInput(thema, 100) || 'AI & Technologie'}

Genereer een episch eindscherm.

Antwoord in dit exacte JSON formaat:
{
  "titel": "een unieke, grappige persoonlijke titel voor de speler (max 6 woorden)",
  "verhaal": "een kort verhaaltje (2-3 zinnen) over de prestatie van de speler, in karakter",
  "rank": "Bronze/Silver/Gold/Platinum/Diamond gebaseerd op percentage",
  "afsluitZin": "een epische afsluitzin in karakter (max 10 woorden)"
}

Rank regels: <30%=Bronze, <50%=Silver, <70%=Gold, <90%=Platinum, >=90%=Diamond`;

    const text = await callLLM(prompt);
    const gameover = parseJSON(text);
    res.json(gameover);
  } catch (error) {
    console.error('Error generating gameover:', error.message || error);
    res.status(500).json({ error: 'Kon geen eindscherm genereren.' });
  }
});

// POST /api/generate-funfact
app.post('/api/generate-funfact', async (req, res) => {
  try {
    let { thema, taal, vraagNummer, stijl, karakterNaam } = req.body;
    thema = sanitizeInput(thema);
    taal = sanitizeInput(taal, 30);
    stijl = sanitizeInput(stijl, 50);

    const isOpleidingTip = vraagNummer === 6;

    const prompt = `${SYSTEM_PROMPT}

Je bent "${karakterNaam || 'De Quizmaster'}" in de stijl van een ${stijl || 'game streamer'}.
Taal: ${taal || 'Nederlands'}
Thema: ${thema || 'AI & Technologie'}

${isOpleidingTip
  ? `Genereer een korte, enthousiaste tip over wat je leert bij de MBO4 opleiding Software Developer - Applied AI. Link het aan het thema "${thema}". Maak het aantrekkelijk voor jongeren van 12-16 jaar. Bijvoorbeeld: "Bij onze opleiding leer je zelf AI-modellen bouwen!" of "In jaar 2 maak je je eigen game met Unity!"`
  : `Genereer een verrassend, cool "Wist je dat...?" weetje over technologie, AI, of software development. Het moet gerelateerd zijn aan het thema "${thema}". Maak het mind-blowing voor jongeren van 12-16 jaar.`}

Antwoord in dit exacte JSON formaat:
{
  "type": "${isOpleidingTip ? 'opleiding' : 'funfact'}",
  "titel": "${isOpleidingTip ? 'BIJ ONZE OPLEIDING...' : 'WIST JE DAT...?'}",
  "tekst": "het weetje of de tip (max 30 woorden)",
  "emoji": "1 passend emoji"
}`;

    const text = await callLLM(prompt);
    const funfact = parseJSON(text);
    res.json(funfact);
  } catch (error) {
    console.error('Error generating funfact:', error.message || error);
    res.json({
      type: 'funfact',
      titel: 'WIST JE DAT...?',
      tekst: 'AI kan in milliseconden quizvragen genereren die uniek zijn - geen enkele vraag is hetzelfde!',
      emoji: '🤯'
    });
  }
});

// ============================================
// Database (SQLite - persistent highscores)
// ============================================

const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'highscores.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS highscores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naam TEXT NOT NULL,
    score INTEGER NOT NULL,
    thema TEXT,
    moeilijkheid TEXT,
    rank TEXT,
    correctCount INTEGER,
    totalQuestions INTEGER,
    karakterNaam TEXT,
    karakterEmoji TEXT,
    avatar TEXT,
    datum DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertScore = db.prepare(`
  INSERT INTO highscores (naam, score, thema, moeilijkheid, rank, correctCount, totalQuestions, karakterNaam, karakterEmoji, avatar)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getTopScores = db.prepare(`SELECT * FROM highscores ORDER BY score DESC LIMIT 20`);

app.get('/api/highscores', (req, res) => {
  res.json(getTopScores.all());
});

app.post('/api/highscores', (req, res) => {
  let { naam, score, thema, moeilijkheid, rank, correctCount, totalQuestions, karakterNaam, karakterEmoji, avatar } = req.body;
  naam = sanitizeInput(naam, 20);
  if (containsBlockedContent(naam)) naam = 'Speler';
  if (!naam.trim()) naam = 'Anoniem';

  insertScore.run(
    naam,
    Number(score) || 0,
    sanitizeInput(thema, 50),
    sanitizeInput(moeilijkheid, 20),
    sanitizeInput(rank, 10),
    Number(correctCount) || 0,
    Number(totalQuestions) || 10,
    sanitizeInput(karakterNaam, 50),
    sanitizeInput(karakterEmoji, 10),
    sanitizeInput(avatar, 500)
  );

  const allScores = getTopScores.all();
  const positie = allScores.findIndex(h => h.naam === naam && h.score === (Number(score) || 0)) + 1;
  res.json({ success: true, positie });
});

app.listen(PORT, () => {
  console.log(`🎮 QuizRoyale server draait op http://localhost:${PORT}`);
  console.log(`📡 LLM Provider: ${LLM_PROVIDER.toUpperCase()}`);
  if (LLM_PROVIDER === 'ollama') {
    console.log(`🦙 Ollama model: ${OLLAMA_MODEL} @ ${OLLAMA_URL}`);
  }
});
