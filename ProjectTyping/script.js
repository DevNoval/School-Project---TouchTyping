const paragraphs = [
  "Belajar mengetik dengan cepat memerlukan latihan dan fokus yang konsisten setiap hari.",
  "Matahari terbit di ufuk timur membawa harapan baru bagi semua makhluk di bumi.",
  "Teknologi berkembang sangat pesat dan mempengaruhi hampir seluruh aspek kehidupan manusia.",
  "Olahraga teratur dapat menjaga kesehatan tubuh dan pikiran tetap bugar.",
  "Membaca buku setiap hari dapat menambah wawasan dan memperluas kosakata."
];

const testTextElement = document.getElementById("test-text");
const inputArea = document.getElementById("input-area");
const timerDisplay = document.getElementById("timer");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const restartBtn = document.getElementById("restart");
const themeBtn = document.getElementById("toggle-theme");

let testText = "";
let startTime, timerInterval;

// Fungsi pilih paragraf acak
function getRandomParagraph() {
  const randomIndex = Math.floor(Math.random() * paragraphs.length);
  return paragraphs[randomIndex];
}

// Fungsi menampilkan paragraf dengan span per huruf
function displayParagraph(paragraph) {
  testTextElement.innerHTML = "";
  paragraph.split("").forEach(char => {
    const span = document.createElement("span");
    span.innerText = char;
    testTextElement.appendChild(span);
  });
}

// Mulai tes
function startTest() {
  startTime = new Date();
  timerInterval = setInterval(updateTimer, 1000);
}

// Update timer
function updateTimer() {
  const currentTime = new Date();
  const elapsed = Math.floor((currentTime - startTime) / 1000);
  timerDisplay.textContent = elapsed;
}

// Hitung hasil
function calculateResults() {
  clearInterval(timerInterval);
  const elapsed = Math.floor((new Date() - startTime) / 1000) / 60; // menit
  const typed = inputArea.value;
  const wordsTyped = typed.trim().split(/\s+/).length;

  const wpm = Math.round(wordsTyped / elapsed);
  wpmDisplay.textContent = wpm;

  // hitung akurasi
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === testText[i]) correct++;
  }
  const accuracy = Math.round((correct / testText.length) * 100);
  accuracyDisplay.textContent = accuracy;
}

// Event ketika user mengetik
inputArea.addEventListener("input", () => {
  const typedChars = inputArea.value.split("");
  const spanArray = testTextElement.querySelectorAll("span");

  if (!startTime) {
    startTest();
  }

  spanArray.forEach((span, index) => {
    const char = typedChars[index];
    if (char == null) {
      span.classList.remove("correct", "incorrect");
    } else if (char === span.innerText) {
      span.classList.add("correct");
      span.classList.remove("incorrect");
    } else {
      span.classList.add("incorrect");
      span.classList.remove("correct");
    }
  });

  if (inputArea.value.length >= testText.length) {
    calculateResults();
  }
});

// Tombol restart
restartBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  inputArea.value = "";
  startTime = null;
  timerDisplay.textContent = "0";
  wpmDisplay.textContent = "0";
  accuracyDisplay.textContent = "0";
  
  // Pilih paragraf baru & tampilkan
  testText = getRandomParagraph();
  displayParagraph(testText);
});

// Inisialisasi awal
testText = getRandomParagraph();
displayParagraph(testText);

// Load tema dari localStorage (jika ada)
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeBtn.textContent = "☀️ Light Mode";
}

// Event toggle tema
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Ubah teks tombol
  if (document.body.classList.contains("dark-mode")) {
    themeBtn.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    themeBtn.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
});
