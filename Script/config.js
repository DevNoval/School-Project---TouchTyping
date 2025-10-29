/* ============================ config.js ============================ */

/* ---------- Konfigurasi & State ---------- */
const CONFIG = {
  wordsCount: 25, // Default
  wordsCountOptions: {'option1':10, 'option2':25, 'option3':50},

  timerSeconds: 30, // Default
  timerSecondsOptions: {'option1':15, 'option2':30, 'option3':60},

  quoteMinWords: 10,
  quoteMaxWords: 20,
  lettersPerWPM: 5,
};

const STATE = {
  language: 'id',            // 'id' or 'en'
  mode: 'quotes',            // words | quotes | timer
  setCount: 'option2',       // option1 | option2 | option3
  audio: false,              // on or off
  wordsList: [],             // array kata aktif
  currentIndex: 0,           // indeks kata saat ini
  font: 'medium',            // small | medium | large
  started: false,
  startTime: null,
  timerInterval: null,
  elapsed: 0,                // detik
  correctKeystrokes: 0,      // jumlah karakter benar (diakumulasi saat kata selesai)
  totalKeystrokes: 0,        // jumlah total keystrokes (dihitung dari event input user)
  typoPlayed: false,
  timeLimit: null,
  activeWordCount: CONFIG.wordsCountOptions['option2'],
  activeTimerSeconds: CONFIG.timerSecondsOptions['option2'],
};

let WORD_DATA = null;
let typeSound = new Audio("Audio/pop.mp3")
let winningSound= new Audio("Audio/winning8bit.mp3")
let errorSound = new Audio("Audio/spaceBarClick.mp3")

/* ---------- DOM refs ---------- */
const wordsContainer = document.getElementById('wordsContainer');
const typingInput = document.getElementById('typingInput');
const restartBtn = document.getElementById('restartBtn');
const wpmId = document.getElementById('wpm');
const timeId = document.getElementById('time');
const accuracyId = document.getElementById('accuracy');
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
const modeSelect = document.getElementById('modeSelect');
const modeLabel = document.getElementById('modeLabel');
const wordsLeftId = document.getElementById('wordsLeft');
const audioBtn = document.getElementById('audioBtn');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const countSelect = document.getElementById('countSelect');
const fontSize = document.getElementById('fontSize');
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsPanel");
const scoreboard = document.querySelectorAll('.score-item');
