/* ==================== setting.js ==================== */

const MODE = {
    words: 'Kata acak',
    quote: 'Kutipan',
    timer: 'Timer',
}

/* ---------- Simpan preferensi ---------- */
function savePreferences() {
  localStorage.setItem("typing_prefs", JSON.stringify({
    language: STATE.language,
    mode: STATE.mode,
    theme: document.body.classList.contains("theme-dark") ? "dark" : "light",
    audio: STATE.audio ? "on" : "off",
    setCount: STATE.setCount,
    fontSize: STATE.fontSize
  }));
}

/* ---------- Muat preferensi ---------- */
function loadPreferences() {
  const data = localStorage.getItem("typing_prefs");
  if (!data) return;
  try {
    const preferences = JSON.parse(data);
    const { language, mode, setCount, theme, audio } = preferences;

    STATE.language = language ?? STATE.language;
    STATE.mode = mode ?? STATE.mode;
    STATE.setCount = setCount ?? STATE.setCount;

    const isDark = theme === "dark";
    document.body.classList.toggle("theme-dark", isDark);
    themeBtn.textContent = isDark ? "🌙" : "☀️";
    
    STATE.audio = audio === "on";
    audioBtn.textContent = STATE.audio ? "🔊" : "🔇";

    langBtn.textContent = STATE.language === "id" ? "🇮🇩 Bahasa" : "🇺🇸 English";
    if (modeSelect) modeSelect.value = STATE.mode;
    if (modeLabel) modeLabel.textContent = MODE[STATE.mode] || STATE.mode;

    if(fontSize) fontSize.value = STATE.font;
    
  } catch (error) {
    console.error("Gagal load preferences:", error);
  }
}

/* ---------- Audio ---------- */
function playTypeSound() {
  if (!STATE.audio) return;
  const sound = typeSound.cloneNode();
  sound.play().catch(()=>{});
}

function playErrorSound() {
  if (!STATE.audio) return;
  const sound = errorSound.cloneNode();
  sound.play().catch(() => {});
}

function playWinningSound() {
  if (!STATE.audio) return;
  const sound = winningSound.cloneNode();
  sound.play().catch(() => {});
}

/* ---------- Controls Tambahan: Mengupdate Opsi Hitungan ---------- */
function updateCountSelectOptions() {
  const isTimerMode = STATE.mode === 'timer';
  const isQuoteMode = STATE.mode === 'quote';
  const optionsMap = isTimerMode ? CONFIG.timerSecondsOptions : CONFIG.wordsCountOptions;

  countSelect.disabled = isQuoteMode;
  if (isQuoteMode) {
    countSelect.innerHTML = '<option value="" disabled selected>N/A</option>';
    return;
  }
  countSelect.innerHTML = ''; 

  for (const [value, label] of Object.entries(optionsMap)) {
    const option = document.createElement('option');
    option.value = value;
    if (isTimerMode) {
      option.textContent = label + ' detik';
    } 
    else {
      option.textContent = label + ' kata';
    } 
    if (value === STATE.setCount) {
        option.selected = true;
        STATE.activeWordCount = CONFIG.wordsCountOptions[value] ?? CONFIG.wordsCount;
        STATE.activeTimerSeconds = CONFIG.timerSecondsOptions[value] ?? CONFIG.timerSeconds;
    }
    countSelect.appendChild(option);
  }
}

/* ---------- Panel Pengaturan ---------- */
function loadSettings() {
  themeBtn.value = CONFIG.theme;
  langBtn.value = STATE.language;
  audioBtn.value = STATE.audio ?? true;
  modeSelect.value = STATE.mode;
  fontSize.value = STATE.font;
}

/* ---------- Control Events ---------- */
function toggleTheme() {
  document.body.classList.toggle('theme-dark');
  themeBtn.textContent = document.body.classList.contains('theme-dark') ? '🌙' : '☀️';
  savePreferences();
}

function toggleLanguage() {
  STATE.language = STATE.language === 'id' ? 'en' : 'id';
  langBtn.textContent = STATE.language === 'id' ? '🇮🇩 Bahasa' : '🇺🇸 English';
  restartTest();
  savePreferences();
}

function toggleSound() {
  STATE.audio = !STATE.audio;
  audioBtn.textContent = STATE.audio ? "🔊" : "🔇";
  savePreferences();
}

function toggleCountSelect(e) {
  const selectedOption = e.target.value;
  STATE.setCount = selectedOption;
  STATE.activeWordCount = CONFIG.wordsCountOptions[selectedOption] ?? CONFIG.wordsCount;
  STATE.activeTimerSeconds = CONFIG.timerSecondsOptions[selectedOption] ?? CONFIG.timerSeconds;

  restartTest();
  savePreferences();
}

function toggleFontSize(size) {
  document.body.classList.remove("font-small", "font-medium", "font-large");
  document.body.classList.add(`font-${size}`);
  savePreferences();
}

function toggleHelpModal() {
  if (helpModal.classList.contains('hidden')) {
    helpModal.style.display = 'block'
    setTimeout(() => {
      helpModal.classList.remove('hidden');
    }, 10); 
  }
  else {
    helpModal.classList.add('hidden');
    setTimeout(() => {
      helpModal.style.display = 'none';
    }, 350);
  }
}

modeSelect.addEventListener('change', (e) => {
  STATE.mode = e.target.value;
  modeLabel.textContent = MODE[STATE.mode] || STATE.mode;

  updateCountSelectOptions();
  updateFooter();
  restartTest();
  savePreferences();
});

fontSize.addEventListener('change', (e) => {
  STATE.font = e.target.value;

  toggleFontSize();
  savePreferences();
})

settingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  settingsPanel.classList.toggle("show");
});

/* ---------- Event Binding ---------- */
themeBtn.addEventListener('click', toggleTheme);
langBtn.addEventListener('click', toggleLanguage);
audioBtn.addEventListener('click', toggleSound);
helpBtn.addEventListener('click', toggleHelpModal);
countSelect.addEventListener('change', toggleCountSelect);
