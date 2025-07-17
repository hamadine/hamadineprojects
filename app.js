// app.js — version unifiée et améliorée
import Fuse from 'fuse.js';

let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
const navLang = navigator.language.slice(0,2);
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || (navLang === 'en' ? 'en' : 'fr');
let fuse;

const escapeHTML = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"’":"&#039;"}[c]||c));

const log = (msg, type='info') => {
  const el = document.getElementById('messageStatus');
  if (!el) return;
  el.style.color = type==='error' ? '#c00' : '#0a0';
  el.textContent = msg;
  el.hidden = false;
};

const chargerJSON = async url => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const afficherMot = i => {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, i));
  localStorage.setItem('motIndex', indexMot);
  const m = mots[indexMot];
  document.getElementById('motTexte').textContent = m.mot || '—';
  document.getElementById('definition').innerHTML =
    escapeHTML(m[langueTrad]||'—') + (m.cat?` <span class="cat">(${escapeHTML(m.cat)})</span>`:'');
  document.getElementById('compteur').textContent = `${indexMot+1} / ${mots.length}`;
};

const envoyerMessage = () => {
  const inp = document.getElementById('chatInput');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = '';
  afficherChat('utilisateur', escapeHTML(txt));

  const clean = txt.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
                      .replace(/[^\w\s]/gi,"").toLowerCase();
  const bot = interfaceData[langueInterface]?.botIntelligence || {};

  if (bot.insultes?.some(i=>clean.includes(i))) return afficherChat('bot', bot.insulte);
  if (bot.salutations_triggers?.some(t=>clean.includes(t))) {
    return afficherChat('bot', bot.salutations[Math.floor(Math.random()*bot.salutations.length)]);
  }
  for (let q in bot.faq||{}) if (clean.includes(q)) {
    return afficherChat('bot', bot.faq[q]);
  }

  const res = fuse.search(txt, {limit:1});
  if (res.length) {
    const m = res[0].item;
    return afficherChat(
      'bot',
      `🔍 <strong>${m.mot}</strong><br>Français : <strong>${m.fr}</strong><br>Anglais : <strong>${m.en}</strong>`
    );
  }

  rechercherMultimedia(clean);
};

const afficherChat = (type, contenu) => {
  const box = document.getElementById('chatWindow');
  const d = document.createElement('div');
  d.className = `message ${type}`;
  d.innerHTML = `<strong>${type==='utilisateur' ? 'Vous' : 'Bot'}:</strong> ${contenu}`;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
  d.querySelectorAll('.btn-ecouter').forEach(btn => {
    btn.onclick = () => new Audio(`audios/${btn.dataset.audio}.mp3`).play().catch(()=>alert("Audio non trouvé"));
  });
};

const rechercherMultimedia = clean => {
  const trig = interfaceData[langueInterface]?.chatTriggers || {};
  const phr = interfaceData[langueInterface]?.chatPhrases || {};

  for (let [t,k] of Object.entries(trig)) {
    if (clean.includes(t)) {
      const intro = phr[k] || `Voici ce que j’ai trouvé…`;
      const m = window.histoireDocs.find(h => (h.titre + h.contenu).normalize("NFD")
        .toLowerCase().includes(t));
      if (m) {
        let html = `<strong>${m.titre}</strong><p>${m.contenu}</p>`;
        if (m.image) html += `<img src="${m.image}" alt="" />`;
        if (m.video) html += `<video controls src="${m.video}"></video>`;
        html += `<button class="btn-ecouter" data-audio="${t}">🔊 Écouter</button>`;
        return afficherChat('bot', html);
      }
      return afficherChat('bot', intro + "<br>❗ Aucun contenu.");
    }
  }

  afficherChat('bot', interfaceData[langueInterface]?.incompréhension || "❓ Je ne comprends pas.");
};

const initialiserLangues = () => {
  const names = {fr:'Français',en:'English',ar:'العربية'};
  const keys = Object.keys(mots[0]).filter(k=>!['mot','cat'].includes(k));
  ['Interface','Trad'].forEach(type => {
    const btn = document.getElementById(`btnLangue${type}`);
    const menu = document.getElementById(`menuLangue${type}`);
    if (!btn || !menu) return;
    btn.onclick = () => {
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        menu.innerHTML = Object.entries(names)
          .filter(([c])=> type==='Interface' || keys.includes(c))
          .map(([c,n])=>`<button data-code="${c}">${n}</button>`).join('');
        menu.querySelectorAll('button').forEach(b=>{
          b.onclick = () => {
            const v=b.dataset.code;
            localStorage.setItem(type==='Interface'?'langueInterface':'langueTrad',v);
            if (type==='Interface') location.reload();
            else {
              langueTrad=v; afficherMot(indexMot);
            }
            menu.hidden=true;
          };
        });
      }
    };
  });
};

const changerInterface = code => {
  const data = interfaceData[code] || interfaceData.fr;
  document.documentElement.lang=code;
  document.body.dir=code==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (data[key]) el.textContent = data[key];
  });
};

const init = async () => {
  log("Chargement...");
  const hist = langueInterface==='fr'?'data/histoire.json':`data/histoire-${langueInterface}.json`;
  [motsComplet, interfaceData, window.histoireDocs] = await Promise.all([
    chargerJSON('data/mots_final_489.json'),
    chargerJSON('data/interface-langue.json'),
    chargerJSON(hist)
  ]);
  if (!motsComplet.length) return log("Fichier vide", 'error');

  if (!interfaceData[langueInterface]) langueInterface='fr';
  if (!Object.keys(motsComplet[0]).includes(langueTrad)) langueTrad='fr';

  changerInterface(langueInterface);
  initialiserLangues();

  fuse = new Fuse(motsComplet, {keys:['mot','fr','en'], threshold:0.4});
  mots=[...motsComplet];
  indexMot = parseInt(localStorage.getItem('motIndex'))||0;
  afficherMot(indexMot);
  log("✅ Prêt");

  document.getElementById('btnPrev').onclick = ()=>afficherMot(indexMot-1);
  document.getElementById('btnNext').onclick = ()=>afficherMot(indexMot+1);
  document.getElementById('btnEnvoyer').onclick = envoyerMessage;

  document.getElementById('searchBar').oninput = e => {
    const q = e.target.value.trim();
    mots = q ? fuse.search(q).map(r=>r.item) : [...motsComplet];
    mots.length ? afficherMot(0) : log("Aucun résultat", 'error');
  };
};

window.addEventListener('DOMContentLoaded', init);
