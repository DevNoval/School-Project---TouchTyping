/* ============================ script.js - Typing Test ============================ */

/* ---------- Utility ---------- */
function pickRandom(arr, n) {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/* ---------- Generate kata/quote ---------- */
function generateWords() {
  if (!WORD_DATA) return [];
  const isTimer = STATE.mode === "timer";
  const count = isTimer ? 999 : STATE.activeWordCount;

  if (STATE.mode === "words" || isTimer) {
    const key = STATE.language === "en" ? "english_words" : "indonesia_words";
    const list = WORD_DATA.words?.[key] ?? [];
    const out = [];
    
    while (out.length < count)
      out.push(...pickRandom(list, Math.min(list.length, count - out.length)));
    return out.slice(0, count);
  }
  const qkey = STATE.language === "en" ? "quotes_en" : "quotes_id";
  const quotes = WORD_DATA.quotes?.[qkey] ?? [];

  if (!quotes.length) return [];
  const candidates = quotes.filter(q => {
    const len = q.trim().split(/\s+/).length;
    return len >= CONFIG.quoteMinWords && len <= CONFIG.quoteMaxWords;
  });
  const chosen = (candidates.length ? candidates : quotes)
    [Math.floor(Math.random() * (candidates.length ? candidates.length : quotes.length))];
  const tokens = chosen.trim().split(/\s+/);

  if (tokens.length > CONFIG.quoteMaxWords) {
    const length = Math.min(CONFIG.quoteMaxWords, Math.max(CONFIG.quoteMinWords, tokens.length));
    const start = Math.floor(Math.random() * (tokens.length - length + 1));
    return tokens.slice(start, start + length);
  }
  return tokens;
}

/* ---------- Render kata dan caret ---------- */
function renderWords() {
  wordsContainer.innerHTML = '';
  STATE.wordsList.forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.dataset.index = i;
    
    for (const char of w) {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        span.appendChild(charSpan);
    }
    if (i === STATE.currentIndex) span.classList.add('current');
    wordsContainer.appendChild(span);
    wordsContainer.appendChild(document.createTextNode(' '));
  });
  updateCaret();
  updateFooter();
}

function renderTimerWords() {
  wordsContainer.innerHTML = '';
  const windowStart = STATE.currentIndex;
  const windowEnd = Math.min(STATE.wordsList.length, STATE.currentIndex + CONFIG.wordsCount);
  const slice = STATE.wordsList.slice(windowStart, windowEnd);

  slice.forEach((w, i) => {
    const idx = windowStart +i;
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    wordEl.dataset.index = idx;

    for (const char of w) {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        wordEl.appendChild(charSpan);
    }
    if (idx === STATE.currentIndex) wordEl.classList.add('current');
    wordsContainer.appendChild(wordEl);
    wordsContainer.appendChild(document.createTextNode(' '));
  });
  updateCaret();
}

function updateCaret() {
  document.querySelectorAll('.caret').forEach(c => c.remove());
  const current = document.querySelector('.word.current');

  if (!current) return;
  const typedLength = typingInput.value.length;
  const chars = Array.from(current.children).filter(n => n.tagName === "SPAN" && !n.classList.contains('caret')); // ambil span karakter
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');

  if (typedLength < chars.length) {
    current.insertBefore(caret, chars[typedLength]);
  } else {
    current.appendChild(caret);
  }
}

/* ---------- Timer & scoring ---------- */
function startTimer() {
  if (STATE.started) return;
  STATE.started = true;
  STATE.startTime = Date.now();
  if (STATE.mode === 'timer') {
    STATE.timeLimit = STATE.activeTimerSeconds;
  }
  STATE.timerInterval = setInterval(() => {
    STATE.elapsed = Math.floor((Date.now() - STATE.startTime) / 1000);
    if (STATE.mode === 'timer') {
      const remaining = Math.max(0, STATE.timeLimit - STATE.elapsed);
      timeId.textContent = remaining;
      if (remaining <= 0) {
        stopTimer();
        typingInput.blur();
      }
    } 
    else {
      timeId.textContent = STATE.elapsed;
    }
    updateWPM();
  }, 250);
}

function stopTimer() {
  if (!STATE.started && !STATE.timerInterval) {
    return;
  }
  cleanUpTest();

  if (scoreboard) {
    scoreboard.forEach(scoreboard => {
      scoreboard.classList.add('score-highlight');
      scoreboard.classList.add('score-flash');
    });
  }
  if (typingInput && wordsContainer) {
    typingInput.classList.add('input-flash');
    wordsContainer.classList.add('display-flash');
    playWinningSound(); 
  }
}

function cleanUpTest() {
  STATE.started = false;
  if (STATE.timerInterval) clearInterval(STATE.timerInterval);
  STATE.timerInterval = null;
  if (scoreboard) {
    scoreboard.forEach(scoreboard =>{
      scoreboard.classList.remove('score-highlight');
      scoreboard.classList.remove('score-flash')
    });
  }
  if (typingInput && wordsContainer) {
    typingInput.classList.remove('input-flash');
    typingInput.classList.remove('input-wrong');
    wordsContainer.classList.remove('display-flash');
  }
}

/* WPM & accuracy */
function updateWPM() {
  const minutes = Math.max((STATE.elapsed || 0) / 60, 1/60);
  const wpm = Math.round((STATE.correctKeystrokes / CONFIG.lettersPerWPM) / minutes) || 0;
  wpmId.textContent = wpm;
}

function updateAccuracy() {
  const total = STATE.totalKeystrokes || 1;
  const accuracy = Math.max(1, Math.min(100, Math.round((STATE.correctKeystrokes / total) * 100)));
  accuracyId.textContent = accuracy;
}

/* ---------- Input handling ---------- */
function updateCurrentWordDisplay(typed) {
  const curEl = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
  if (!curEl) return;
  const target = STATE.wordsList[STATE.currentIndex] || '';
  const charSpans = Array.from(curEl.children).filter(n => n.tagName === "SPAN" && !n.classList.contains('caret'));

  for (let i = 0; i < target.length; i++) {
    const chSpan = charSpans[i];
    if (i < typed.length) {
      if (typed[i] === target[i]) chSpan.style.color = 'var(--success)';
      else chSpan.style.color = 'var(--danger)';
    } else {
      chSpan.style.color = ''; 
    }
  }
  updateCaret();
  updateAccuracy();
  updateWPM();
}

function onType(e) {
  const val = typingInput.value;
  if (!STATE.started && val.length) startTimer();
  if (e.isTrusted) STATE.totalKeystrokes++;

  updateCurrentWordDisplay(val);
  updateInputStyle(val);

  const target = STATE.wordsList[STATE.currentIndex] || "";
  const isWrong = [...val].some((c, i) => c !== target[i]);
  typingInput.classList.toggle("input-wrong", isWrong);
  const curEl = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
  if (curEl && !val.length) {
    curEl.classList.remove("wrong");
    typingInput.classList.remove("input-wrong");
  }
}

function inputHandling() {
  const typed = typingInput.value.trim();
  const target = STATE.wordsList[STATE.currentIndex] || "";
  const curEl = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
  if (!typed.length) return typingInput.classList.remove("input-wrong");
  const isCorrect = typed === target;
  if (isCorrect) {
    if (curEl) {
      curEl.classList.remove("current", "wrong");
      curEl.classList.add("correct");
      curEl.querySelectorAll("span:not(.caret)").forEach(s => s.style.color = "var(--success)");
    }
    STATE.currentIndex++;
    typingInput.value = "";
    STATE.mode === "timer" ? renderTimerWords() : (() => {
      document.querySelectorAll(".word").forEach(w => w.classList.remove("current"));
      document.querySelector(`.word[data-index="${STATE.currentIndex}"]`)?.classList.add("current");
    })();
    updateCaret();

    typingInput.classList.remove("input-wrong");
    if (STATE.mode !== "timer" && STATE.currentIndex >= STATE.wordsList.length) {
      stopTimer();
      typingInput.blur();
    }
  } 
  else {
    curEl?.classList.add("wrong");
    typingInput.value += " ";
    typingInput.classList.add("input-wrong");
  }
  updateAccuracy();
  updateWPM();
  updateFooter();
  typingInput.focus();
}

function updateInputStyle(typed) {
  const target = STATE.wordsList[STATE.currentIndex] || '';
  let isWrong = false;

  for (let i = 0; i < typed.length; i++) {
    if (i >= target.length || typed[i] !== target[i]) {
      isWrong = true;
      break;
    }
  }
  if (isWrong) {
    typingInput.classList.add('input-wrong');
  } 
  else {
    typingInput.classList.remove('input-wrong');
  }
}

function onKeyDown(e) {
  const target = STATE.wordsList[STATE.currentIndex] || '';
  const typed = typingInput.value;
  const key = e.key;
  const isTypingChar = key.length === 1 && key !== ' ';
  const willBeCorrect = isTypingChar && (key === target[typed.length]) && (typed.length < target.length);
  const willBeTypo = isTypingChar && !willBeCorrect; // Jika bukan spasi dan bukan karakter benar berikutnya

  if (willBeCorrect) {
      STATE.correctKeystrokes++;
      if (STATE.audio) playTypeSound(); 
  } 
  else if (willBeTypo) {
      typingInput.classList.add('input-wrong');
      if (STATE.audio) {
          playErrorSound(); // 🔊 Bunyi error diputar di sini
      }
  } 
  else if (key === 'Backspace' && typed.length > 0) {
      if (typed.length <= target.length && typed[typed.length - 1] === target[typed.length - 1]) {
          STATE.correctKeystrokes--;
      }
      if (STATE.audio) playTypeSound(); // Bunyi normal saat Backspace
  }
  if (e.key === ' ') {
    e.preventDefault(); // cegah masuknya spasi ke input
    inputHandling();
    return;
  }
}

/* ---------- Controls Restart ---------- */
function restartTest() {
  cleanUpTest();
  STATE.started = false;
  STATE.startTime = null;
  STATE.elapsed = 0;
  STATE.currentIndex = 0;
  STATE.correctKeystrokes = 0;
  STATE.totalKeystrokes = 0;
  STATE.wordsList = generateWords();

  if (STATE.mode === 'timer') {
    renderTimerWords();
    timeId.textContent = STATE.activeTimerSeconds;
  } 
  else {
    renderWords();
    timeId.textContent = '0';
  }
  typingInput.value = '';
  wpmId.textContent = '0';
  accuracyId.textContent = '100';
  typingInput.focus();

  updateFooter();
  updateCaret();
}

/* ---------- Helpers ---------- */
function updateFooter() {
  const wordsLeftElement = wordsLeftId.closest('small'); // Asumsi 'Kata tersisa' berada di dalam elemen <small>
  if(STATE.mode === 'timer') {
    wordsLeftElement.classList.add('hidden-element');
  } 
  else{
    wordsLeftId.textContent = Math.max(0, STATE.wordsList.length - STATE.currentIndex);
    wordsLeftElement.classList.remove('hidden-element');
  }
}

/* ---------- Event binding ---------- */
typingInput.addEventListener('input', onType);
typingInput.addEventListener('keydown', onKeyDown);
restartBtn.addEventListener('click', restartTest);

/* ---------- Load json ---------- */
async function loadWordData() {
  try {
    const response = await fetch('/Data/data.json');
    if (!response.ok) throw new Error('Gagal fetch data.json: ' + response.status);
    WORD_DATA = await response.json();
  } 
  catch (error) {
    console.error('Error memuat data.json:', error);
  }
}

/* ---------- Initializers ---------- */
window.addEventListener('DOMContentLoaded', async () => {
  loadPreferences();
  if (countSelect) countSelect.value = STATE.setCount;
  STATE.activeWordCount = CONFIG.wordsCountOptions[STATE.setCount] ?? CONFIG.wordsCount
  STATE.activeTimerSeconds = CONFIG.timerSecondsOptions[STATE.setCount] ?? CONFIG.timerSeconds

  await loadWordData();           // ambil words.json
  STATE.wordsList = generateWords();
  if (STATE.mode === 'timer') {
    renderTimerWords();
    timeId.textContent = STATE.activeTimerSeconds;
  } 
  else {
    renderWords();
    timeId.textContent = '0';
  }
  typingInput.focus();
  modeLabel.textContent = STATE.mode === 'timer' ? 'Timer' : STATE.mode === 'words'? 'Kutipan' : 'Kata Acak';
  langBtn.textContent = STATE.language === 'id' ? '🇮🇩 Bahasa' : '🇺🇸 English';

  updateCountSelectOptions();
  updateFooter();
});
