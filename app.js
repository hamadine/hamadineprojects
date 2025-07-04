let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;
let fuse;

function afficherLog(msg, type = 'info') {
  const el = document.getElementById('messageStatus');
  if (!el) return;
  el.style.color = type === 'error' ? 'red' : 'green';
  el.textContent = msg;
  el.hidden = false;
}

function chargerJSON(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
      else reject(new Error(`Erreur HTTP ${xhr.status} pour ${url}`));
    };
    xhr.onerror = () => reject(new Error(`Erreur réseau : ${url}`));
    xhr.send();
  });
}

async function chargerDonnees() {
  try {
    afficherLog("🔄 Chargement de mots.json...");
    const motsRes = await chargerJSON('data/mots.json');

    afficherLog("🔄 Chargement de interface-langue.json...");
    const interfaceRes = await chargerJSON('data/interface-langue.json');
    afficherLog("✅ interface-langue.json chargé.");

    const histoireFile = langueInterface === 'ar' ? 'histoire-ar.json' : 'histoire.json';
    afficherLog(`🔄 Chargement de ${histoireFile}...`);
    const histoireRes = await chargerJSON(`data/${histoireFile}`);
    afficherLog(`✅ ${histoireFile} chargé.`);

    motsComplet = motsRes;
    mots = [...motsComplet];
    interfaceData = interfaceRes;
    window.histoireDocs = histoireRes;

    if (!Object.keys(mots[0] || {}).includes(langueTrad)) langueTrad = 'fr';
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
    afficherLog("❌ Échec du chargement JSON : " + e.message, 'error');
    console.error("❌ Erreur de chargement :", e);
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

function nettoyerTexte(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

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

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const brut = input.value.trim();
  const message = nettoyerTexte(brut);
  if (!message) return;
  afficherMessage('utilisateur', escapeHTML(brut));
  input.value = '';

  const regex = phrasesMultilingues[langueInterface] || phrasesMultilingues.fr;
  const match = brut.match(regex);

  if (match) {
    const motCherche = nettoyerTexte(match[2].trim());
    const langueCible = (match[3] || match[4] || 'fr').slice(0, 2);
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
  afficherLog("🔄 Initialisation de l'application...");

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
  document.getElementById('btnPrononcer')?.addEventListener('click', activerMicroEtComparer);

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
    });
  });
});
