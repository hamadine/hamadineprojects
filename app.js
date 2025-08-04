document.addEventListener("DOMContentLoaded", () => {
  const motsComplet = typeof mots_final_489 !== "undefined" ? mots_final_489 : [];
  const interfaceData = typeof interface_langue !== "undefined" ? interface_langue : {};
  const histoireDocs = typeof histoire !== "undefined" ? histoire : [];
  const audioData = typeof audios !== "undefined" ? audios : [];
  let mots = [...motsComplet];
  let idx = parseInt(localStorage.getItem('motIndex')) || 0;
  const langueTrad = localStorage.getItem('langueTrad') || 'fr';
  const langueInterface = localStorage.getItem('langueInterface') || (navigator.language ? navigator.language.slice(0,2) : 'fr');

  const escapeHTML = str => str ? str.replace(/[&<>"']/g, c=> ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c])) : '';
  const nettoie = str => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w\s]/g,"").toLowerCase() : '';

  // Onglets navigation
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.onglet-contenu').forEach(s=>s.hidden=true);
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).hidden = false;
    };
  });

  document.querySelectorAll('[data-tab-link]').forEach(link=>{
    link.onclick = e => {
      e.preventDefault();
      const id = link.getAttribute('data-tab-link');
      document.querySelector(`.tab-btn[data-tab="${id}"]`)?.click();
    };
  });

  let fuse = (typeof Fuse !== "undefined" && motsComplet.length)
    ? new Fuse(motsComplet, { keys:['mot','fr','en'], threshold:0.4 })
    : null;

  function showMot(i) {
    idx = Math.max(0, Math.min(mots.length-1, i));
    localStorage.setItem('motIndex', idx);
    const m = mots[idx];
    document.getElementById('motTexte').textContent = m?.mot || '—';
    document.getElementById('definition').innerHTML =
      escapeHTML(m?.[langueTrad] || m?.fr || '—') +
      (m?.cat ? ` <span style="color:#888">(${escapeHTML(m.cat)})</span>` : '');
    document.getElementById('compteur').textContent = `${idx+1}/${mots.length}`;
  }

  document.getElementById('btnPrev')?.addEventListener('click', ()=>showMot(idx-1));
  document.getElementById('btnNext')?.addEventListener('click', ()=>showMot(idx+1));

  document.getElementById('searchBar')?.addEventListener('input', e=>{
    const q = nettoie(e.target.value);
    mots = q && fuse ? fuse.search(q).map(r=>r.item) : [...motsComplet];
    if (mots.length) {
      showMot(0);
    } else {
      document.getElementById('motTexte').textContent = "Aucun résultat";
      document.getElementById('definition').textContent = "";
      document.getElementById('compteur').textContent = "0/0";
    }
  });

  if (mots.length) showMot(idx);
// Bot intelligent
  let historiqueConversation = [];

  function afficheMsg(user, html) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;
    const div = document.createElement('div');
    div.className = `message ${user}`;
    const label = user==='bot' ? (interfaceData[langueInterface]?.utilisateur || 'Bot') : 'Vous';
    div.innerHTML = `<strong>${label}:</strong> ${html}`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    historiqueConversation.push({user, html});
    if (historiqueConversation.length > 20) historiqueConversation.shift();
  }

  function reponseBot(txt) {
    const clean = nettoie(txt);
    const botInfo = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr']?.botIntelligence || {};
    if ((botInfo.salutations_triggers||[]).some(s=>clean.includes(nettoie(s)))) {
      return botInfo.salutations[Math.floor(Math.random()*(botInfo.salutations.length||1))] || "Bonjour !";
    }
    if ((botInfo.insultes||[]).some(i=>clean.includes(nettoie(i)))) {
      return botInfo.insulte || "🙏 Merci de rester poli.";
    }
    for (const q in (botInfo.faq||{})) {
      if (clean.includes(nettoie(q))) return botInfo.faq[q];
    }
    return interfaceData[langueInterface]?.incompréhension || "❓ Je ne comprends pas encore ce mot.";
  }

  function traiterSaisie() {
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = "";
    afficheMsg('user', escapeHTML(txt));
    const rep = reponseBot(txt);
    afficheMsg('bot', rep);
  }

  document.getElementById('btnEnvoyer')?.addEventListener('click', traiterSaisie);
  document.getElementById('chatInput')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      traiterSaisie();
    }
  });

  // Album audio
  const audioContainer = document.getElementById('audioContainer');
  if (audioContainer && audioData.length) {
    audioData.forEach(album => {
      const div = document.createElement('div');
      div.className = 'album';
      div.innerHTML = `<h3>${album.album}</h3><ul>${album.pistes.map(p =>
        `<li><strong>${p.title}</strong><br><audio controls src="${p.src}"></audio></li>`
      ).join('')}</ul>`;
      audioContainer.appendChild(div);
    });
  }

  document.getElementById('toggleChatBot')?.addEventListener('click', ()=>{
    document.querySelector('.tab-btn[data-tab="chat"]')?.click();
    window.scrollTo({ top: document.getElementById('chat').offsetTop, behavior: 'smooth' });
  });

  console.log("✅ app.js unifié chargé.");
});
