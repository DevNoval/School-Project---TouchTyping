/* ============================ script.js - Typing Test (Simplified) ============================ */

/* ---------- Utility ---------- */
const pickRandom = (array, n) => {
  const pool = [...array], out = [];
  while (out.length < n && pool.length)
    out.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  return out;
};

/* ---------- Generate kata/quote ---------- */
function generateWords() {
  if (!WORD_DATA) return [];
  const { mode, language } = STATE;
  const isTimer = mode === "timer", count = isTimer ? 999 : STATE.activeWordCount;

  if (mode === "words" || isTimer) {
    const list = WORD_DATA.words?.[language === "en" ? "english_words" : "indonesia_words"] ?? [];
    const result = [];
    while (result.length < count) result.push(...pickRandom(list, Math.min(list.length, count - result.length)));
    return result.slice(0, count);
  }

  const quotes = WORD_DATA.quotes?.[language === "en" ? "quotes_en" : "quotes_id"] ?? [];
  const valid = quotes.filter(q => {
    const length = q.split(/\s+/).length;
    return length >= CONFIG.quoteMinWords && length <= CONFIG.quoteMaxWords;
  }) || quotes;

  const chosen = valid[Math.floor(Math.random() * valid.length)].trim().split(/\s+/);
  const length = chosen.length > CONFIG.quoteMaxWords ? CONFIG.quoteMaxWords : chosen.length;
  return chosen.slice(0, length);
}

/* ---------- Rendering ---------- */
function renderWords(timerMode = STATE.mode === "timer") {
  wordsContainer.innerHTML = "";
  const start = timerMode ? STATE.currentIndex : 0;
  const end = timerMode ? Math.min(STATE.wordsList.length, start + CONFIG.wordsCount) : STATE.wordsList.length;

  STATE.wordsList.slice(start, end).forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.dataset.index = start + i;
    span.innerHTML = [...word].map(c => `<span>${c}</span>`).join("");
    if (start + i === STATE.currentIndex) span.classList.add("current");
    wordsContainer.append(span, " ");
  });
  updateCaret(); updateFooter();
}

/* ---------- Caret ---------- */
function updateCaret() {
  document.querySelectorAll(".caret").forEach(caret => caret.remove());
  const current = document.querySelector(".word.current");

  if (!current) return;
  const caret = document.createElement("span");
  caret.className = "caret"; caret.setAttribute("aria-hidden", "true");
  const chars = [...current.children].filter(caret => !caret.classList.contains("caret"));
  const pos = typingInput.value.length;
  pos < chars.length ? current.insertBefore(caret, chars[pos]) : current.appendChild(caret);
}

/* ---------- Input Handling ---------- */
function updateDisplay(typed) {
  const current = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
  if (!current) return;
  const target = STATE.wordsList[STATE.currentIndex] || '';
  const charSpans = [...current.children].filter(n => n.tagName === 'SPAN' && !n.classList.contains('caret'));

  for (let i = 0; i < charSpans.length; i++) {
    const char = charSpans[i];
    if (i < typed.length) {
      char.style.color = typed[i] === target[i] ? 'var(--success)' : 'var(--danger)';
    } else {
      char.style.color = '';
    }
  }
  if (!typed.length) {
    current.classList.remove('wrong');
    typingInput.classList.remove('input-wrong');
  }
  updateCaret(); updateAccuracy(); updateWPM();
}

function onType(e) {
  const value = typingInput.value;
  
  if (!STATE.started && value.length) startTimer();
  if (e.isTrusted) STATE.totalKeystrokes++;

  updateDisplay(value);

  const target = STATE.wordsList[STATE.currentIndex] || "";
  const isWrong = [...value].some((c, i) => c !== target[i]);
  typingInput.classList.toggle("input-wrong", isWrong);
  const curEl = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
  
  if (curEl && value.length === 0) curEl.classList.remove("wrong");
}

function onKeyDown(e) {
  const key = e.key, target = STATE.wordsList[STATE.currentIndex] || '', typed = typingInput.value;
  if (key === " ") { e.preventDefault(); handleSpace(); return; }
  if (key.length === 1) {
    const correct = key === target[typed.length];
    
    if (correct) { STATE.correctKeystrokes++; playTypeSound(); }
    else { typingInput.classList.add("input-wrong"); playErrorSound(); }
  } else if (key === "Backspace" && typed.length) {
    if (typed.at(-1) === target[typed.length - 1]) STATE.correctKeystrokes--;
    playTypeSound();
  }
}

function handleSpace() {
  const typed = typingInput.value.trim();
  const target = STATE.wordsList[STATE.currentIndex] || "";
  const curEl = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
  
  if (!typed.length) return typingInput.classList.remove("input-wrong");
  const isCorrect = typed === target;

  if (isCorrect) {
    if (curEl) {
      curEl.classList.remove("current", "wrong");
      curEl.classList.add("correct");
      curEl.querySelectorAll("span").forEach(span => {
        if (!span.classList.contains('caret')) span.style.color = "var(--success)";
      });
    }
    STATE.currentIndex++;
    typingInput.value = "";

    if (STATE.mode === "timer") {
      renderWords(true);
    } else {
      document.querySelectorAll(".word").forEach(word => word.classList.toggle("current", +word.dataset.index === STATE.currentIndex));
    }
    updateCaret();
    typingInput.classList.remove("input-wrong");

    if (STATE.mode !== "timer" && STATE.currentIndex >= STATE.wordsList.length) {
      stopTimer();
      typingInput.blur();
      typingInput.disabled = true;
    }
  } else {
    playErrorSound();

    if (curEl) curEl.classList.add("wrong");
    typingInput.value += " ";
    typingInput.classList.add("input-wrong");
  }
  updateAccuracy(); updateWPM(); updateFooter();
  typingInput.focus();
}

/* ---------- Timer & Stats ---------- */
function startTimer() {
  if (STATE.started) return;
  STATE.started = true; STATE.startTime = Date.now();
  
  if (STATE.mode === "timer") STATE.timeLimit = STATE.activeTimerSeconds;
  STATE.timerInterval = setInterval(() => {
    STATE.elapsed = (Date.now() - STATE.startTime) / 1000 | 0;
  
    if (STATE.mode === "timer") {
      const left = Math.max(0, STATE.timeLimit - STATE.elapsed);
      timeId.textContent = left;       
  
      if (!left) stopTimer();
    } else timeId.textContent = STATE.elapsed;
    updateWPM();
  }, 250);
}

function stopTimer() {
  cleanUpTest();
  scoreboard?.forEach(el => el.classList.add("score-flash", "score-highlight"));
  typingInput.disabled = true; typingInput.blur();
  playWinningSound();
}

function cleanUpTest() {
  STATE.started = false; clearInterval(STATE.timerInterval);
  scoreboard?.forEach(el => el.classList.remove("score-flash", "score-highlight"));
  typingInput.classList.remove("input-wrong", "input-flash");
  wordsContainer.classList.remove("display-flash");
}

/* ---------- Restart & Helpers ---------- */
function restartTest() {
  cleanUpTest(); Object.assign(STATE, {
    started: false, startTime: 0, elapsed: 0, currentIndex: 0,
    correctKeystrokes: 0, totalKeystrokes: 0, wordsList: generateWords()
  });

  STATE.mode === "timer" ? renderWords(true) : renderWords();
  timeId.textContent = STATE.mode === "timer" ? STATE.activeTimerSeconds : 0;
  wpmId.textContent = 0; 
  accuracyId.textContent = 100;
  typingInput.value = ""; 
  typingInput.disabled = false; 
  typingInput.focus();
  updateFooter(); updateCaret();
}

function updateWPM() {
  const wpm = Math.max(STATE.elapsed / 60, 1 / 60);
  wpmId.textContent = Math.round((STATE.correctKeystrokes / CONFIG.lettersPerWPM) / wpm) || 0;
};

function updateAccuracy() {
  const accuracy = Math.round((STATE.correctKeystrokes / (STATE.totalKeystrokes || 1)) * 100);
  accuracyId.textContent = Math.max(1, Math.min(100, accuracy));
};

function updateFooter() {
  const el = wordsLeftId.closest("small");
  
  if (STATE.mode === "timer") el.classList.add("hidden-element");
  else {
    wordsLeftId.textContent = Math.max(0, STATE.wordsList.length - STATE.currentIndex);
    el.classList.remove("hidden-element");
  }
}

/* ---------- Event ---------- */
typingInput.addEventListener('input', onType);
typingInput.addEventListener('keydown', onKeyDown);
restartBtn.addEventListener('click', restartTest);

/* ---------- Load Data & Init ---------- */
async function loadWordData() {
  try { WORD_DATA = await (await fetch("Data/data.json")).json(); }
  catch (error) { console.error("Gagal memuat data:", error); }
}

window.addEventListener("DOMContentLoaded", async () => {
  loadPreferences();
  countSelect.value = STATE.setCount;
  STATE.activeWordCount = CONFIG.wordsCountOptions[STATE.setCount] ?? CONFIG.wordsCount;
  STATE.activeTimerSeconds = CONFIG.timerSecondsOptions[STATE.setCount] ?? CONFIG.timerSeconds;

  await loadWordData();
  STATE.wordsList = generateWords();
  STATE.mode === "timer" ? renderWords(true) : renderWords();
  timeId.textContent = STATE.mode === "timer" ? STATE.activeTimerSeconds : 0;
  typingInput.focus();
  modeLabel.textContent = MODE?.[STATE.mode] || STATE.mode;
  langBtn.textContent = STATE.language === "id" ? "🇮🇩 Bahasa" : "🇺🇸 English";
  updateCountSelectOptions(); updateFooter();
});
