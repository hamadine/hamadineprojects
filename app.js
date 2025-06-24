let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;

const nomsLangues = {
  fr: "Français", en: "English", ar: "العربية", tz: "Tamazight", tr: "Türkçe", da: "Dansk",
  de: "Deutsch", nl: "Nederlands", sv: "Svenska", ru: "Русский", zh: "中文", cs: "Čeština",
  ha: "Hausa", es: "Español", it: "Italiano"
};

const phrasesMultilingues = {
  fr: /comment (on )?dit[- ]?on (.+?) en ([a-z]+)/i,
  en: /how (do )?you say (.+?) in ([a-z]+)/i,
  ar: /كيف (نقول|أقول|يقول) (.+?) (بال|في) ([a-z]+)/i
};

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function nettoyerTexte(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function chargerDonnees() {
  try {
    const histoireFile = langueInterface === 'ar' ? 'histoire-ar.json' : 'histoire.json';
    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get('data/' + histoireFile)
    ]);

    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;
    window.histoireDocs = histoireRes.data;

    if (!mots.length || !Object.keys(mots[0]).includes(langueTrad)) langueTrad = 'fr';
    if (!interfaceData[langueInterface]) langueInterface = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(mots[0]).filter(k => k !== 'cat' && k.length <= 3)],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (e) {
    console.error("❌ Erreur de chargement :", e);
    alert("Erreur de chargement des fichiers JSON.");
  }
}

function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  localStorage.setItem('motIndex', indexMot);

  const mot = mots[indexMot];
  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML =
    escapeHTML(mot[langueTrad] || '—') +
    (mot.cat ? ` <span style="color:#888;">(${escapeHTML(mot.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

function activerMicroEtComparer() {
  if (!('webkitSpeechRecognition' in window)) return alert("🎤 Non supporté.");

  const recognition = new webkitSpeechRecognition();
  recognition.lang = langueInterface + '-' + langueInterface.toUpperCase();
  recognition.onstart = () => afficherMessage('bot', "🎙️ Parlez maintenant...");
  recognition.onresult = (event) => {
    const result = nettoyerTexte(event.results[0][0].transcript);
    const motTrouve = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && nettoyerTexte(val) === result)
    );
    if (motTrouve) afficherMessage('bot', genererTraductions(motTrouve));
    else rechercherDansHistoire(result);
  };
  recognition.onerror = () => afficherMessage('bot', "❌ Erreur de reconnaissance.");
  recognition.start();
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = nettoyerTexte(input.value.trim());
  if (!message) return;
  afficherMessage('utilisateur', escapeHTML(input.value.trim()));
  input.value = '';

  const regex = phrasesMultilingues[langueInterface] || phrasesMultilingues['fr'];
  const match = message.match(regex);

  if (match) {
    const motCherche = nettoyerTexte(match[2].trim());
    const langueCible = match[3] || match[4] || 'fr';
    const entree = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && nettoyerTexte(val) === motCherche)
    );
    if (entree && entree[langueCible]) {
      const rep = `<strong>${escapeHTML(motCherche)}</strong> en ${nomsLangues[langueCible]} : <strong>${escapeHTML(entree[langueCible])}</strong><br>Mot Tadaksahak : <strong>${escapeHTML(entree.mot)}</strong>`;
      return afficherMessage('bot', rep);
    }
  }

  rechercherDansHistoire(message);
}

function rechercherDansHistoire(message) {
  const results = (window.histoireDocs || []).filter(doc =>
    nettoyerTexte(doc.titre).includes(message) ||
    nettoyerTexte(doc.contenu).includes(message) ||
    (doc.motsCles || []).some(m => nettoyerTexte(m).includes(message))
  );

  if (results.length) {
    const bloc = results.map(doc => {
      const titreSanit = doc.titre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, '-').toLowerCase();
      return `<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}<br><br><button onclick="jouerAudio('audio/${titreSanit}.mp3')">🔊 Écouter</button>`;
    }).join('<br><br>');
    afficherMessage('bot', bloc);
  } else {
    afficherMessage('bot', "❓ Mot inconnu.");
  }
}

function genererTraductions(motObj) {
  const lignes = [`<strong>Tadaksahak</strong>: ${escapeHTML(motObj.mot)}`];
  for (const [code, nom] of Object.entries(nomsLangues)) {
    if (motObj[code]) lignes.push(`<strong>${nom}</strong>: ${escapeHTML(motObj[code])}`);
  }
  return lignes.join('<br>') + (motObj.cat ? ` <em>(${escapeHTML(motObj.cat)})</em>` : '');
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (window.nomUtilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function jouerAudio(path) {
  const audio = new Audio(path);
  audio.play().catch(() => alert("⚠️ Audio indisponible."));
}

function initialiserMenusLangues() {
  ['Interface', 'Trad'].forEach(type => {
    const btn = document.getElementById(`btnLangue${type}`);
    const menu = document.getElementById(`menuLangue${type}`);
    btn.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        menu.innerHTML = Object.entries(nomsLangues).map(([code, nom]) => `
          <button class="langue-item" data-code="${code}">${nom}</button>
        `).join('');
        menu.querySelectorAll('button').forEach(b => {
          b.onclick = () => {
            const val = b.dataset.code;
            localStorage.setItem(type === 'Interface' ? 'langueInterface' : 'langueTrad', val);
            if (type === 'Interface') location.reload();
            else {
              langueTrad = val;
              btn.textContent = `Traduction : ${nomsLangues[val]} ⌄`;
              afficherMot(indexMot);
            }
            menu.hidden = true;
          };
        });
      }
    });
  });
}

function changerLangueInterface(code) {
  const data = interfaceData[code] || interfaceData['fr'];
  document.documentElement.lang = code;
  document.body.dir = code === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (data[key]) el.textContent = data[key];
  });

  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[code]} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad]} ⌄`;
  document.getElementById('chat-title').textContent = data.chatTitre || "Chat Tadaksahak";
  document.getElementById('botIntro').innerHTML = data.botIntro || "🤖 Salut, je suis Hamadine.";
  document.getElementById('btnEnvoyer').textContent = data.envoyer || "Envoyer";
  document.getElementById('searchBar').placeholder = data.searchPlaceholder || "Cherchez un mot...";
  window.nomUtilisateur = data.utilisateur || "Vous";
}

window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  document.getElementById('searchBar').addEventListener('input', () => {
    const query = nettoyerTexte(document.getElementById('searchBar').value.trim());
    if (!query) {
      mots = [...motsComplet];
      afficherMot(0);
      return;
    }
    const results = fuse.search(query);
    mots = results.map(r => r.item);
    mots.length ? afficherMot(0) : (
      document.getElementById('motTexte').textContent = "Aucun résultat",
      document.getElementById('definition').textContent = "",
      document.getElementById('compteur').textContent = "0 / 0"
    );
  });

  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', () => afficherMot(indexMot - 1));
  document.getElementById('btnNext').addEventListener('click', () => afficherMot(indexMot + 1));
  document.getElementById('btnPrononcer')?.addEventListener('click', activerMicroEtComparer);
});
