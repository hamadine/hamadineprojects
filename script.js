let mots = [];
let index = 0;
let langue = "fr";
let uiLangue = "fr";
let lectureActive = false;
let autoLectureTimeout;

// 🌍 Dictionnaire multilingue pour l'interface
const UI_LABELS = {
  fr: {
    searchPlaceholder: "Chercher un mot...",
    audio: "▶️ Écouter",
    replay: "⟳ Rejouer",
    autoplay: "▶️ Lecture auto",
    previous: "◀️ Précédent",
    next: "Suivant ▶️",
    botWelcome: "Bot : Bonjour, je m'appelle Hamadine. Quel mot cherchez-vous ?",
    notFound: "Mot non trouvé",
    chatPlaceholder: "Écris ta question...",
    send: "Envoyer"
  },
  en: {
    searchPlaceholder: "Search a word...",
    audio: "▶️ Listen",
    replay: "⟳ Replay",
    autoplay: "▶️ Autoplay",
    previous: "◀️ Previous",
    next: "Next ▶️",
    botWelcome: "Bot: Hello, I’m Hamadine. What word are you looking for?",
    notFound: "Word not found",
    chatPlaceholder: "Type your question...",
    send: "Send"
  },
  ar: {
    searchPlaceholder: "ابحث عن كلمة...",
    audio: "▶️ استمع",
    replay: "⟳ إعادة",
    autoplay: "▶️ تشغيل تلقائي",
    previous: "◀️ السابق",
    next: "التالي ▶️",
    botWelcome: "البوت: مرحبًا، أنا حمادين. ما الكلمة التي تبحث عنها؟",
    notFound: "الكلمة غير موجودة",
    chatPlaceholder: "اكتب سؤالك...",
    send: "إرسال"
  },
  ru: {
    searchPlaceholder: "Искать слово...",
    audio: "▶️ Прослушать",
    replay: "⟳ Повтор",
    autoplay: "▶️ Автовоспроизведение",
    previous: "◀️ Назад",
    next: "Вперёд ▶️",
    botWelcome: "Бот: Привет, я Хамадин. Какое слово вы ищете?",
    notFound: "Слово не найдено",
    chatPlaceholder: "Напишите ваш вопрос...",
    send: "Отправить"
  }
};

fetch("data/mots.json")
  .then(res => res.json())
  .then(data => {
    mots = data;

    if (!mots.some(m => m.tz)) {
      const tzBtn = document.querySelector('[onclick*="tz"]');
      if (tzBtn) tzBtn.style.display = "none";
    }

    afficherMot();
    mettreAJourInterface();
  })
  .catch(e => {
    document.getElementById("motTexte").innerText = "❌ Fichier mots.json introuvable";
    document.getElementById("definition").innerText = "";
    document.getElementById("compteur").innerText = "";
  });

function mettreAJourInterface() {
  const labels = UI_LABELS[uiLangue];

  document.getElementById("searchBar").placeholder = labels.searchPlaceholder;
  document.querySelector("#audioButtons button:nth-child(1)").innerText = labels.audio;
  document.querySelector("#audioButtons button:nth-child(2)").innerText = labels.replay;
  document.querySelector("#audioButtons button:nth-child(3)").innerText = labels.autoplay;
  document.querySelector("#navigation button:nth-child(1)").innerText = labels.previous;
  document.querySelector("#navigation button:nth-child(2)").innerText = labels.next;
  document.getElementById("chatInput").placeholder = labels.chatPlaceholder;
  document.querySelector("button[onclick='envoyerMessage()']").innerText = labels.send;
}

function changerLangueInterface(lang) {
  if (UI_LABELS[lang]) {
    uiLangue = lang;
    mettreAJourInterface();
  }
}

// ... (le reste de ton code reste identique)

// Ajout à la fin de `window.onload` :
window.onload = () => {
  const chatWindow = document.getElementById("chatWindow");
  const accueil = document.createElement("div");
  accueil.textContent = UI_LABELS[uiLangue].botWelcome;
  chatWindow.appendChild(accueil);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}; good evening
