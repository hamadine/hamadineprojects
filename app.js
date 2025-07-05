let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
const langueNavigateur = navigator.language.slice(0, 2);
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || (langueNavigateur === 'en' ? 'en' : 'fr');
let fuse;

function afficherLog(msg, type = 'info') {
  const el = document.getElementById('messageStatus');
  if (!el) return;
  el.style.color = type === 'error' ? 'red' : 'green';
  el.textContent = msg;
  el.hidden = false;
}

function chargerJSON(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`Erreur HTTP ${r.status}`);
    return r.json();
  });
}

async function chargerDonnees() {
  try {
    afficherLog("Chargement des données...");
    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      chargerJSON('data/mots.json'),
      chargerJSON('data/interface-langue.json'),
      chargerJSON(`data/${langueInterface === 'en' ? 'histoire-en.json' : 'histoire.json'}`)
    ]);

    motsComplet = motsRes;
    mots = [...motsComplet];
    interfaceData = interfaceRes;
    window.histoireDocs = histoireRes;

    if (!Object.keys(mots[0]).includes(langueTrad)) langueTrad = 'fr';
    if (!interfaceData[langueInterface]) langueInterface = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

    fuse = new Fuse(mots, {
      keys: ['mot', 'fr', 'en'],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (e) {
    afficherLog("Erreur : " + e.message, 'error');
    console.error(e);
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

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const messageBrut = input.value.trim();
  const message = nettoyerTexte(messageBrut);
  if (!message) return;

  afficherMessage('utilisateur', escapeHTML(messageBrut));
  input.value = '';

  const motsSimilaires = fuse.search(message).slice(0, 3);
  if (motsSimilaires.length) {
    const mot = motsSimilaires[0].item;
    const rep = `🔍 Résultat le plus proche : <strong>${mot.mot}</strong><br>Français : <strong>${mot.fr}</strong><br>Anglais : <strong>${mot.en}</strong>`;
    return afficherMessage('bot', rep);
  }

  rechercherDansHistoire(message);
}

function rechercherDansHistoire(message) {
  const texteNettoye = message;
  const langue = langueInterface;
  const triggers = interfaceData[langue]?.chatTriggers || {};
  const phrases = interfaceData[langue]?.chatPhrases || {};

  // 1. Trigger exact
  for (const [trigger, clePhrase] of Object.entries(triggers)) {
    if (texteNettoye.includes(nettoyerTexte(trigger))) {
      const reponseIntro = phrases[clePhrase] || `🔎 Voici ce que j’ai trouvé à propos de "${trigger}" :`;
      const match = (window.histoireDocs || []).find(doc =>
        nettoyerTexte(doc.titre + doc.contenu).includes(nettoyerTexte(trigger))
      );
      if (match) {
        const contenu = `
          <strong>${escapeHTML(match.titre)}</strong><br>
          ${escapeHTML(match.contenu)}
          <br><button class="btn-icon btn-ecouter" data-audio="${trigger}">🔊 Écouter en Tadaksahak</button>
        `;
        return afficherMessage('bot', contenu);
      } else {
        return afficherMessage('bot', reponseIntro + "<br>❗ Aucun contenu disponible pour l’instant.");
      }
    }
  }

  // 2. Recherche fallback dans histoireDocs
  const resultats = (window.histoireDocs || []).filter(doc => {
    const titre = nettoyerTexte(doc.titre);
    const contenu = nettoyerTexte(doc.contenu);
    return titre.includes(texteNettoye) || contenu.includes(texteNettoye);
  });

  if (resultats.length) {
    const bloc = resultats.map(doc =>
      `<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}`
    ).join('<hr>');
    return afficherMessage('bot', bloc);
  }

  afficherMessage('bot', interfaceData[langue]?.incompréhension || "❓ Je n’ai pas compris ce mot. Tu peux réessayer ?");
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (window.nomUtilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Lecture audio si bouton présent
  msg.querySelectorAll('.btn-ecouter').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.audio;
      const audio = new Audio(`audios/${key}.mp3`);
      audio.play().catch(err => {
        console.warn("Erreur de lecture audio :", err);
        alert("⚠️ Audio introuvable ou non pris en charge.");
      });
    });
  });
}

function nettoyerTexte(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, "").toLowerCase();
}

const nomsLangues = { fr: "Français", en: "English" };

function initialiserMenusLangues() {
  ['Interface', 'Trad'].forEach(type => {
    const btn = document.getElementById(`btnLangue${type}`);
    const menu = document.getElementById(`menuLangue${type}`);
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        menu.innerHTML = Object.entries(nomsLangues).map(([code, nom]) =>
          `<button class="langue-item" data-code="${code}">${nom}</button>`
        ).join('');
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
  const data = interfaceData[code] || interfaceData.fr;
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
  afficherLog("🔄 Initialisation...");
  chargerDonnees();

  document.getElementById('searchBar').addEventListener('input', () => {
    const query = nettoyerTexte(document.getElementById('searchBar').value.trim());
    mots = query ? fuse.search(query).map(r => r.item) : [...motsComplet];
    if (mots.length) afficherMot(0);
    else {
      document.getElementById('motTexte').textContent = "Aucun résultat";
      document.getElementById('definition').textContent = "";
      document.getElementById('compteur').textContent = "0 / 0";
    }
  });

  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', () => afficherMot(indexMot - 1));
  document.getElementById('btnNext').addEventListener('click', () => afficherMot(indexMot + 1));

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
      });
      document.querySelectorAll('.onglet-contenu').forEach(tab => tab.hidden = true);
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      const tabId = btn.dataset.tab;
      const tabContent = document.getElementById(tabId);
      if (tabContent) tabContent.hidden = false;
      else console.warn(`⚠️ Onglet introuvable : ${tabId}`);
    });
  });
});
