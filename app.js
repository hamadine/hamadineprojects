// app.js — Version complète avec audio et quiz 🎧🧩

import Fuse from 'fuse.js';

const DEFAULT_LANG = 'fr';

let motsComplet = [], mots = [], interfaceData = {}, histoireDocs = [];
let indexMot = 0, langueInterface, langueTrad, fuse;

// --- UTILITAIRES ---
const escapeHTML = s => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const normalise = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, "").toLowerCase();
const logStatus = (msg, err = false) => {
  const el = document.getElementById('messageStatus');
  if (el) el.hidden = false, el.textContent = msg, el.style.color = err ? 'red' : 'green';
};

// --- DICO ---
function showMot(i = indexMot) {
  if (!mots.length) return;
  indexMot = Math.min(Math.max(0, i), mots.length - 1);
  localStorage.setItem('motIndex', indexMot);
  const m = mots[indexMot];
  document.getElementById('motTexte').textContent = m.mot;
  document.getElementById('definition').innerHTML =
    escapeHTML(m[langueTrad] || '') + (m.cat ? ` <span class="cat">(${escapeHTML(m.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}
document.getElementById('btnPlay')?.addEventListener('click', _ => {
  const m = mots[indexMot];
  if (m.audio) new Audio(`audios/${m.audio}`).play();
});
document.getElementById('btnPrononcer')?.addEventListener('click', _ => {
  const text = mots[indexMot]?.mot;
  if (text && 'speechSynthesis' in window) {
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
});

// --- CHAT BOT ---
function postMessage(who, content) { /* identique à version précédente */ }
async function chatSend() { /* identique à version précédente */ }

// --- QUIZ ---
let quizIndex = 0, quizScore = 0, quizQuestions = [];
function startQuiz() {
  quizQuestions = motsComplet.slice(0, 10).map(m => ({
    question: `Quelle est la traduction en français de "${m.mot}" ?`,
    answer: m.fr
  }));
  quizScore = 0;
  quizIndex = 0;
  showQuizQuestion();
}
function showQuizQuestion() {
  const qDiv = document.getElementById('quizQuestion');
  const oDiv = document.getElementById('quizOptions');
  const scoreDiv = document.getElementById('quizScore');
  if (quizIndex >= quizQuestions.length) {
    qDiv.textContent = "Quiz terminé !";
    oDiv.innerHTML = `<p>Votre score : ${quizScore} / ${quizQuestions.length}</p>`;
    return;
  }
  const q = quizQuestions[quizIndex];
  qDiv.textContent = q.question;
  const opts = [q.answer, ...motsComplet.slice(quizIndex + 1, quizIndex + 4).map(m => m.fr)]
    .sort(() => Math.random() - 0.5);
  oDiv.innerHTML = opts.map(o => `<button class="quiz-opt">${escapeHTML(o)}</button>`).join('');
  scoreDiv.textContent = `Score : ${quizScore}`;
  oDiv.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.onclick = () => {
      if (btn.textContent === q.answer) quizScore++;
      quizIndex++;
      showQuizQuestion();
    };
  });
}

// --- INIT et liaison DOM ---
async function initApp() {
  try {
    logStatus("Chargement...");
    langueInterface = localStorage.getItem('langueInterface') || DEFAULT_LANG;
    langueTrad = localStorage.getItem('langueTrad') || DEFAULT_LANG;

    [motsComplet, interfaceData, histoireDocs] = await Promise.all([
      fetch('data/mots_final_489.json').then(r=>r.json()),
      fetch('data/interface-langue.json').then(r=>r.json()),
      fetch(`data/histoire-${langueInterface}.json`).then(r=>r.json())
    ]);
    fuse = new Fuse(motsComplet, { keys: ['mot', 'fr', 'en'], threshold: 0.4 });
    mots = [...motsComplet];
    showMot(+localStorage.getItem('motIndex') || 0);

    document.getElementById('searchBar').oninput = e => {
      const q = normalise(e.target.value);
      mots = q ? fuse.search(q).map(r=>r.item) : [...motsComplet];
      showMot(0);
    };

    document.getElementById('btnPrev').onclick = _ => showMot(indexMot - 1);
    document.getElementById('btnNext').onclick = _ => showMot(indexMot + 1);
    document.getElementById('btnEnvoyer').onclick = chatSend;

    // Quiz controls
    document.getElementById('startQuiz')?.addEventListener('click', startQuiz);

    logStatus("✅ Prêt !");
  } catch (e) {
    console.error(e);
    logStatus(e.message, true);
  }
}
document.addEventListener('DOMContentLoaded', initApp);
