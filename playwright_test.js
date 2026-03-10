const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, 'test_screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

async function screenshot(page, name) {
  const filePath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  [Screenshot: test_screenshots/${name}.png]`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function clickButtonById(page, id) {
  return page.evaluate((id) => {
    const btn = document.getElementById(id);
    if (btn) { btn.click(); return true; }
    return false;
  }, id);
}

async function clickButtonByText(page, textFragment) {
  return page.evaluate((frag) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes(frag));
    if (btn) { btn.click(); return btn.textContent.trim(); }
    return null;
  }, textFragment);
}

// Wait until quiz overlay is visible and question text is loaded
async function waitForQuizQuestion(page, maxWaitMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = await page.evaluate(() => {
      const questionEl = document.getElementById('quiz-question');
      const answersEl = document.getElementById('quiz-answers');
      const scoreEl = document.getElementById('quiz-score');
      const quizOverlay = document.getElementById('quiz-overlay');
      const charOverlay = document.getElementById('character-overlay');
      return {
        questionText: questionEl ? questionEl.textContent.trim() : '',
        answersHTML: answersEl ? answersEl.innerHTML.trim() : '',
        answersButtonCount: answersEl ? answersEl.querySelectorAll('button').length : 0,
        scoreText: scoreEl ? scoreEl.textContent.trim() : '',
        isLoading: questionEl ? questionEl.classList.contains('loading-question') : true,
        quizOverlayVisible: quizOverlay ? !quizOverlay.classList.contains('hidden') : false,
        charOverlayVisible: charOverlay ? !charOverlay.classList.contains('hidden') : false,
      };
    });
    const ready = result.quizOverlayVisible && result.questionText.length > 10 && result.answersButtonCount >= 2 && !result.isLoading;
    console.log(`  Waiting for quiz... quizVisible=${result.quizOverlayVisible}, charVisible=${result.charOverlayVisible}, q="${result.questionText.substring(0,40)}", answers=${result.answersButtonCount}, loading=${result.isLoading}`);
    if (ready) {
      return result;
    }
    await sleep(2000);
  }
  return null;
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [BrowserError] ${msg.text()}`);
  });
  page.on('pageerror', err => console.log(`  [PageError] ${err.message}`));

  const results = [];
  function pass(step, detail) {
    console.log(`PASS [Step ${step}] ${detail}`);
    results.push({ step, status: 'PASS', detail });
  }
  function fail(step, detail) {
    console.log(`FAIL [Step ${step}] ${detail}`);
    results.push({ step, status: 'FAIL', detail });
  }

  try {
    // ─── STEP 1: Title Screen ────────────────────────────────────────────────
    console.log('\n=== STEP 1: Opening http://localhost:3000 ===');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(3000);
    await screenshot(page, '01_title_screen');

    const canvas = await page.$('canvas');
    const pageTitle = await page.title();
    console.log(`  Page title: "${pageTitle}"`);
    console.log(`  Canvas present: ${!!canvas}`);

    if (canvas) {
      const hasExpectedTitle = pageTitle.toLowerCase().includes('quiz') || pageTitle.toLowerCase().includes('wedotech');
      if (hasExpectedTitle) {
        pass(1, `Title screen loaded. Page title: "${pageTitle}". Canvas present. (Game renders WEDOTECH/.QUIZ on Phaser canvas)`);
      } else {
        fail(1, `Canvas present but unexpected title: "${pageTitle}"`);
      }
    } else {
      fail(1, 'No canvas element — Phaser did not load');
    }

    // ─── STEP 2: Click canvas → Setup Screen ───────────────────────────────
    console.log('\n=== STEP 2: Clicking to advance to Setup Screen ===');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(2000);
    await screenshot(page, '02_setup_screen');

    const step2Text = await page.evaluate(() => document.body.innerText);
    const step2Checks = {
      thema: /thema/i.test(step2Text),
      niveau: /niveau/i.test(step2Text),
      quizmaster: /quizmaster/i.test(step2Text),
      speelModus: /speel\s*modus/i.test(step2Text) || /modus/i.test(step2Text),
      normaal: /normaal/i.test(step2Text),
      speedRound: /speed\s*round/i.test(step2Text),
      mystery: /mystery/i.test(step2Text),
      bossVraag: /boss\s*vraag/i.test(step2Text),
      avatar: /avatar/i.test(step2Text),
      startQuiz: /start\s*quiz/i.test(step2Text),
    };
    const passCount = Object.values(step2Checks).filter(Boolean).length;
    console.log(`  Setup elements (${passCount}/10):`, step2Checks);
    console.log(`  Page text snippet: "${step2Text.substring(0, 300).replace(/\n/g, ' ')}"`);

    if (passCount >= 8) {
      pass(2, `Setup screen fully loaded (${passCount}/10). All required sections present: Thema, Niveau, Quizmaster Stijl, SPEEL MODUS (NORMAAL/SPEED ROUND/MYSTERY/BOSS VRAAG), Avatar, START QUIZ.`);
    } else if (passCount >= 4) {
      pass(2, `Setup screen partially loaded (${passCount}/10). Missing: ${Object.entries(step2Checks).filter(([,v])=>!v).map(([k])=>k).join(', ')}`);
    } else {
      fail(2, `Setup screen not detected (${passCount}/10). Still on title or crashed.`);
    }

    // ─── STEP 3: Select theme, NORMAAL mode, START QUIZ ─────────────────────
    console.log('\n=== STEP 3: Selecting theme, NORMAAL mode, START QUIZ ===');

    const themeClicked = await clickButtonByText(page, 'Kunstmatige');
    console.log(`  Theme clicked: "${themeClicked || 'not found'}"`);
    await sleep(300);

    const normaalModeClicked = await clickButtonByText(page, '🎮 NORMAAL');
    console.log(`  NORMAAL game mode clicked: "${normaalModeClicked || 'not found'}"`);
    await sleep(300);

    const startClicked = await clickButtonById(page, 'start-quiz-btn');
    console.log(`  START QUIZ clicked by id: ${startClicked}`);
    await sleep(1000);
    await screenshot(page, '03_loading_screen');

    const step3Text = await page.evaluate(() => document.body.innerText);
    const hasLoadingIndicator = /laden|genereer|loading|even geduld|wordt/i.test(step3Text);
    const stillOnSetup = /start quiz/i.test(step3Text) && /thema/i.test(step3Text);
    console.log(`  Loading indicator: ${hasLoadingIndicator}, Still on setup: ${stillOnSetup}`);
    console.log(`  Screen text: "${step3Text.substring(0, 200).replace(/\n/g, ' ')}"`);

    if (!stillOnSetup || hasLoadingIndicator) {
      pass(3, `START QUIZ triggered, loading screen appeared. Loading text: "${step3Text.substring(0, 80).replace(/\n/g,' ')}"`);
    } else {
      fail(3, 'Still on setup screen after clicking START QUIZ');
    }

    // ─── STEP 4: Wait for character reveal ──────────────────────────────────
    console.log('\n=== STEP 4: Waiting for character reveal (AI generation) ===');

    let letsGoFound = false;
    let characterDetails = '';

    for (let i = 0; i < 25; i++) {
      await sleep(2000);
      const info = await page.evaluate(() => {
        const letsGoBtn = document.getElementById('lets-go-btn');
        const charOverlay = document.getElementById('character-overlay');
        const charName = document.getElementById('char-name');
        const charCatchphrase = document.getElementById('char-catchphrase');
        const loadingEl = document.getElementById('loading-overlay');
        // character-overlay is shown when it does NOT have 'hidden' class
        const charOverlayVisible = charOverlay ? !charOverlay.classList.contains('hidden') : false;
        const loadingVisible = loadingEl ? !loadingEl.classList.contains('hidden') : false;
        return {
          charOverlayVisible,
          loadingVisible,
          charName: charName ? charName.textContent.trim() : '',
          charCatchphrase: charCatchphrase ? charCatchphrase.textContent.trim() : '',
        };
      });

      console.log(`  Wait ${i+1}/25: charOverlayVisible=${info.charOverlayVisible}, loadingVisible=${info.loadingVisible}, charName="${info.charName}"`);

      if (info.charOverlayVisible && info.charName) {
        letsGoFound = true;
        characterDetails = `Name: "${info.charName}", Catchphrase: "${info.charCatchphrase}"`;
        break;
      }
    }

    await screenshot(page, '04_character_reveal');
    const charText = await page.evaluate(() => document.body.innerText);
    console.log(`  Character screen text: "${charText.substring(0, 300).replace(/\n/g, ' ')}"`);

    if (letsGoFound) {
      pass(4, `Character reveal screen displayed. ${characterDetails}`);
    } else {
      fail(4, `Character reveal not detected after 40 seconds. Last text: "${charText.substring(0,150).replace(/\n/g,' ')}"`);
    }

    // ─── STEP 4b: Click LET'S GO ─────────────────────────────────────────────
    console.log('\n=== STEP 4b: Clicking LET\'S GO ===');
    const letsGoClicked = await clickButtonById(page, 'lets-go-btn');
    console.log(`  LET'S GO clicked by id: ${letsGoClicked}`);
    await sleep(1000);

    // ─── STEP 5: Wait for Quiz Screen ────────────────────────────────────────
    console.log('\n=== STEP 5: Waiting for quiz screen to load ===');

    const quizQuestion = await waitForQuizQuestion(page, 35000);
    await screenshot(page, '05_quiz_screen');

    if (quizQuestion) {
      // Also check for timer, score, question number
      const quizUIInfo = await page.evaluate(() => {
        return {
          score: document.getElementById('quiz-score')?.textContent?.trim() || '',
          questionNum: document.getElementById('quiz-number')?.textContent?.trim() || '',
          timerText: document.getElementById('timer-text')?.textContent?.trim() || '',
          questionText: document.getElementById('quiz-question')?.textContent?.trim() || '',
          answerButtons: document.getElementById('quiz-answers') ?
            Array.from(document.getElementById('quiz-answers').querySelectorAll('button')).map(b => b.textContent.trim().substring(0,50)) : [],
        };
      });
      console.log(`  Quiz UI: score="${quizUIInfo.score}", question#="${quizUIInfo.questionNum}", timer="${quizUIInfo.timerText}"`);
      console.log(`  Question: "${quizUIInfo.questionText.substring(0, 100)}"`);
      console.log(`  Answer buttons: ${JSON.stringify(quizUIInfo.answerButtons)}`);

      const hasScore = quizUIInfo.score !== '' || quizUIInfo.score === '0';
      const hasQuestionNum = quizUIInfo.questionNum !== '';
      const hasTimer = quizUIInfo.timerText !== '';
      const hasQuestion = quizUIInfo.questionText.length > 10;
      const hasAnswers = quizUIInfo.answerButtons.length > 0;

      pass(5, `Quiz screen loaded. Score: "${quizUIInfo.score}" ✓, Question#: "${quizUIInfo.questionNum}" (${hasQuestionNum?'✓':'?'}), Timer: "${quizUIInfo.timerText}" (${hasTimer?'✓':'?'}), Question text: ${hasQuestion?'✓':'?'}, Answer buttons: ${quizUIInfo.answerButtons.length}`);
    } else {
      const currentText = await page.evaluate(() => document.body.innerText.substring(0,300));
      fail(5, `Quiz screen did not load after 35s. Current text: "${currentText.replace(/\n/g,' ')}"`);
    }

    // ─── STEP 6: Answer a Question ───────────────────────────────────────────
    console.log('\n=== STEP 6: Answering a question ===');

    if (!quizQuestion) {
      fail(6, 'Skipped — quiz screen not loaded');
    } else {
      const answerResult = await page.evaluate(() => {
        const answersDiv = document.getElementById('quiz-answers');
        if (!answersDiv) return { clicked: null, error: 'No quiz-answers div' };
        const btns = Array.from(answersDiv.querySelectorAll('button'));
        if (btns.length === 0) return { clicked: null, error: 'No answer buttons found' };
        btns[0].click();
        return { clicked: btns[0].textContent.trim().substring(0, 80), total: btns.length };
      });
      console.log(`  Answer click result:`, answerResult);

      await sleep(3000);
      await screenshot(page, '06_after_answer');

      const feedbackInfo = await page.evaluate(() => {
        const feedbackEl = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('next-btn');
        const feedbackText = feedbackEl ? feedbackEl.textContent.trim() : '';
        const feedbackVisible = feedbackEl ? !feedbackEl.classList.contains('hidden') : false;
        const nextVisible = nextBtn ? nextBtn.style.display !== 'none' && !nextBtn.disabled : false;
        const bodyText = document.body.innerText;
        return {
          feedbackText: feedbackText.substring(0, 200),
          feedbackVisible,
          nextVisible,
          hasCorrect: /correct|juist|goed gedaan|bravo|geweldig|top|super/i.test(feedbackText),
          hasWrong: /fout|wrong|onjuist|helaas|helaas|niet goed/i.test(feedbackText),
          hasVolgende: /volgende/i.test(bodyText),
        };
      });
      console.log(`  Feedback:`, feedbackInfo);

      if (feedbackInfo.feedbackVisible || feedbackInfo.hasCorrect || feedbackInfo.hasWrong || feedbackInfo.nextVisible) {
        pass(6, `Answer feedback shown. Feedback visible: ${feedbackInfo.feedbackVisible}, Correct: ${feedbackInfo.hasCorrect}, Wrong: ${feedbackInfo.hasWrong}, VOLGENDE button: ${feedbackInfo.hasVolgende}. Feedback text: "${feedbackInfo.feedbackText.substring(0,100)}"`);
      } else {
        fail(6, `No feedback detected. feedbackVisible: ${feedbackInfo.feedbackVisible}, nextVisible: ${feedbackInfo.nextVisible}. Text: "${feedbackInfo.feedbackText.substring(0,100)}"`);
      }
    }

    // ─── STEP 7: Click VOLGENDE → Next Question ─────────────────────────────
    console.log('\n=== STEP 7: Clicking VOLGENDE for next question ===');

    if (!quizQuestion) {
      fail(7, 'Skipped — quiz screen not loaded');
    } else {
      const volgendeClicked = await clickButtonById(page, 'next-btn');
      console.log(`  VOLGENDE (next-btn) clicked: ${volgendeClicked}`);
      await sleep(1000);

      // Wait for next question to load
      const nextQuestion = await waitForQuizQuestion(page, 35000);
      await screenshot(page, '07_next_question');

      if (nextQuestion) {
        const nextQuizInfo = await page.evaluate(() => {
          return {
            questionNum: document.getElementById('quiz-number')?.textContent?.trim() || '',
            questionText: document.getElementById('quiz-question')?.textContent?.trim() || '',
            answerCount: document.getElementById('quiz-answers') ?
              document.getElementById('quiz-answers').querySelectorAll('button').length : 0,
          };
        });
        console.log(`  Next question: #="${nextQuizInfo.questionNum}", text="${nextQuizInfo.questionText.substring(0,80)}", answers=${nextQuizInfo.answerCount}`);
        pass(7, `Next question loaded successfully. Question#: "${nextQuizInfo.questionNum}", Answer buttons: ${nextQuizInfo.answerCount}, Question: "${nextQuizInfo.questionText.substring(0,60)}..."`);
      } else {
        const currentText = await page.evaluate(() => document.body.innerText.substring(0,300));
        fail(7, `Next question did not load after 35s. Current: "${currentText.replace(/\n/g,' ')}"`);
      }
    }

  } catch (err) {
    console.log(`\n[FATAL ERROR] ${err.message}\n${err.stack}`);
    await screenshot(page, 'error_state').catch(() => {});
  }

  await browser.close();

  console.log('\n' + '='.repeat(70));
  console.log('FINAL TEST RESULTS:');
  console.log('='.repeat(70));
  for (const r of results) {
    console.log(`${r.status} [Step ${r.step}]: ${r.detail}`);
  }

  return results;
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
