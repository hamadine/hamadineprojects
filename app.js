let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;

const nomsLangues = {
  fr: "Français", en: "English", ar: "العربية", tz: "Tamazight",
  tr: "Türkçe", da: "Dansk", de: "Deutsch", nl: "Nederlands",
  sv: "Svenska", ru: "Русский", zh: "中文", cs: "Čeština",
  ha: "Hausa", es: "Español", it: "Italiano"
};

const phrasesMultilingues = {
  fr: /comment (on )?dit[- ]?on (.+?) en ([a-z]+)/i,
  en: /how (do )?you say (.+?) in ([a-z]+)/i,
  ar: /كيف (نقول|أقول|يقول) (.+?) (بال|في) ([a-z]+)/i
};

let fuse = null;

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function nettoyerTexte(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function chargerDonnees() {
  try {
    const histoireFile = langueInterface === 'ar' ? 'histoire-ar.json' : 'histoire.json';
    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get(`data/${histoireFile}`)
    ]);

    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;
    window.histoireDocs = histoireRes.data;

    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!Object.keys(mots[0] || {}).includes(langueTrad)) langueTrad = 'fr';

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
 function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const brut = input.value.trim();
  const message = nettoyerTexte(brut);
  if (!message) return;
  afficherMessage('utilisateur', escapeHTML(brut));
  input.value = '';

  const data = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  const { salutations = [], salutations_triggers = [],
          remerciements = [], insultes = [], insulte = "Merci de rester respectueux.",
          faq = {}, inconnu = "Je ne comprends pas." } = data;

  // 1. Réponses contextuelles
  if (salutations_triggers.some(t => message.includes(nettoyerTexte(t)))) {
    return afficherMessage('bot', salutations[Math.floor(Math.random() * salutations.length)] || salutations[0]);
  }
  if (remerciements.some(t => message.includes(nettoyerTexte(t)))) {
    return afficherMessage('bot', remerciements[Math.floor(Math.random() * remerciements.length)]);
  }
  if (insultes.some(t => message.includes(nettoyerTexte(t)))) {
    return afficherMessage('bot', insulte);
  }
  for (const question in faq) {
    if (message.includes(nettoyerTexte(question))) {
      return afficherMessage('bot', faq[question]);
    }
  }

  // 2. Phrases multilingues de traduction
  const regex = phrasesMultilingues[langueInterface] || phrasesMultilingues['fr'];
  const match = brut.match(regex);
  if (match) {
    const motCherche = nettoyerTexte(match[2].trim());
    const langueCible = (match[3] || match[4] || 'fr').substring(0, 2);
    const entree = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && nettoyerTexte(val) === motCherche)
    );
    if (entree && entree[langueCible]) {
      return afficherMessage('bot',
        `<strong>${escapeHTML(motCherche)}</strong> en ${nomsLangues[langueCible]} : <strong>${escapeHTML(entree[langueCible])}</strong><br>Mot Tadaksahak : <strong>${escapeHTML(entree.mot)}</strong>`
      );
    } else {
      return afficherMessage('bot', inconnu);
    }
  }

  // 3. Mot exact
  const exacts = motsComplet.filter(m =>
    Object.values(m).some(val => typeof val === 'string' && nettoyerTexte(val) === message)
  );
  if (exacts.length) {
    const réponses = exacts.map(m => genererTraductions(m)).join('<br><br>');
    return afficherMessage('bot', réponses);
  }

  // 4. Historique
  const resultats = (window.histoireDocs || []).filter(doc => {
    const msg = message;
    return (doc.titre && nettoyerTexte(doc.titre).includes(msg)) ||
           (doc.contenu && nettoyerTexte(doc.contenu).includes(msg)) ||
           (doc.motsCles || []).some(m => nettoyerTexte(m).includes(msg));
  });

  if (resultats.length) {
    const bloc = resultats.map(doc => {
      const titreSanit = doc.titre.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, '-').toLowerCase();
      const audioPath = `audio/${titreSanit}.mp3`;
      return `<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}<br><br>
              <button onclick="jouerAudio('${audioPath}')">🔊 Écouter en Tadaksahak</button>`;
    }).join('<br><br>');
    return afficherMessage('bot', bloc);
  }

  afficherMessage('bot', inconnu);
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (window.nomUtilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function activerMicroEtComparer() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("🎤 Reconnaissance vocale non disponible sur ce navigateur.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = langueInterface + '-' + langueInterface.toUpperCase();

  recognition.onstart = () => afficherMessage('bot', "🎙️ Parlez maintenant...");
  recognition.onresult = (event) => {
    const result = nettoyerTexte(event.results[0][0].transcript);
    const motTrouve = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && nettoyerTexte(val) === result)
    );
    motTrouve
      ? afficherMessage('bot', genererTraductions(motTrouve))
      : rechercherDansHistoire(result);
  };
  recognition.onerror = () => afficherMessage('bot', "❌ Erreur de reconnaissance.");
  recognition.start();
}

function jouerAudio(path) {
  const audio = new Audio(path);
  audio.play().catch(() => alert("⚠️ Impossible de lire l'audio."));
}

function genererTraductions(motObj) {
  const lignes = [`<strong>Tadaksahak</strong>: ${escapeHTML(motObj.mot)}`];
  for (const [code, nom] of Object.entries(nomsLangues)) {
    if (motObj[code]) lignes.push(`<strong>${nom}</strong>: ${escapeHTML(motObj[code])}`);
  }
  return lignes.join('<br>') + (motObj.cat ? ` <em>(${escapeHTML(motObj.cat)})</em>` : '');
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
  langueInterface = code;
  document.documentElement.lang = code;
  document.body.dir = code === 'ar' ? 'rtl' : 'ltr';

  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[code]} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad]} ⌄`;

  document.title = data.titrePrincipal || "Tadaksahak Dictionary";
  document.getElementById('titrePrincipal').textContent = data.titrePrincipal || "Tadaksahak Dictionary";
  document.getElementById('textePresentation').textContent = data.presentation || "";
  document.getElementById('searchBar').placeholder = data.searchPlaceholder || "Cherchez un mot...";
  document.getElementById('btnEnvoyer').textContent = data.envoyer || "Envoyer";
  document.getElementById('chat-title').textContent = data.chatTitre || "Chat Tadaksahak";
  document.getElementById('botIntro').innerHTML = data.botIntro || "";
  document.getElementById('footerText').textContent = data.footerText || "";
  window.nomUtilisateur = data.utilisateur || "Vous";
}

window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();

  document.getElementById('searchBar').addEventListener('input', debounce(() => {
    const query = nettoyerTexte(document.getElementById('searchBar').value.trim());
    if (!query) {
      mots = [...motsComplet];
      afficherMot(0);
      return;
    }
    const resultats = fuse.search(query);
    mots = resultats.map(r => r.item);
    mots.length ? afficherMot(0) : (
      document.getElementById('motTexte').textContent = "Aucun résultat",
      document.getElementById('definition').textContent = "",
      document.getElementById('compteur').textContent = "0 / 0"
    );
  }));

  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', () => afficherMot(indexMot - 1));
  document.getElementById('btnNext').addEventListener('click', () => afficherMot(indexMot + 1));
  document.getElementById('btnPrononcer')?.addEventListener('click', activerMicroEtComparer);
});
