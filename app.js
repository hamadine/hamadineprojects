document.addEventListener("DOMContentLoaded", () => {
  // Données globales
  const motsComplet = typeof mots_final_489 !== "undefined" ? mots_final_489 : [];
  const interfaceData = typeof interface_langue !== "undefined" ? interface_langue : {};
  const histoireDocs = typeof histoire !== "undefined" ? histoire : [];
  let mots = [...motsComplet];
  let idx = parseInt(localStorage.getItem('motIndex')) || 0;
  const langueTrad = localStorage.getItem('langueTrad') || 'fr';
  const langueInterface = localStorage.getItem('langueInterface') || navigator.language.slice(0,2) || 'fr';

  const escapeHTML = str => str.replace(/[&<>"']/g, c=> ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
  const nettoie = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^\w\s]/g,"").toLowerCase();

  // Onglets
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

  // Dictionnaire
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
    mots.length ? showMot(0) : (() => {
      document.getElementById('motTexte').textContent = "Aucun résultat";
      document.getElementById('definition').textContent = "";
      document.getElementById('compteur').textContent = "0/0";
    })();
  });
  if (mots.length) showMot(idx);

  // Chatbot
  const chatWindow = document.getElementById('chatWindow');
  function afficheMsg(user, html) {
    const div = document.createElement('div');
    div.className = `message ${user}`;
    const label = user==='bot' ? (interfaceData[langueInterface]?.bot || 'Bot') : 'Vous';
    div.innerHTML = `<strong>${label}:</strong> ${html}`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function reponseBot(txt) {
    const clean = nettoie(txt);
    const botInfo = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr']?.botIntelligence || {};
    // Insultes
    if ((botInfo.insultes||[]).some(i=>clean.includes(nettoie(i)))) {
      return botInfo.insulte || "🙏 Merci de rester poli.";
    }
    // Salutations
    if ((botInfo.salutations_triggers||[]).some(s=>clean.includes(nettoie(s)))) {
      return botInfo.salutations[Math.floor(Math.random()*(botInfo.salutations.length||1))] || "Bonjour !";
    }
    // FAQ
    for (const q in (botInfo.faq||{})) {
      if (clean.includes(nettoie(q))) return botInfo.faq[q];
    }
    // Traduction simple
    const m = motsComplet.find(m=> nettoie(m.mot)===clean || nettoie(m.fr)===clean );
    if (m) {
      return `Vous cherchez ? <strong>${m.mot}</strong> = ${escapeHTML(m[langueTrad]||m.fr)}${m.en?` / en anglais : ${escapeHTML(m.en)}`:''}`;
    }
    // Histoire / documents
    const hist = histoireDocs.find(h=>clean.includes(nettoie(h.titre)));
    if (hist) {
      let out = `<strong>${escapeHTML(hist.titre)}</strong><br>${escapeHTML(hist.contenu)}`;
      if (hist.image) out += `<br><img src="${hist.image}" alt="" style="max-width:100%;margin-top:5px;">`;
      if (hist.video) out += `<br><video controls width="100%" style="margin-top:5px;"><source src="${hist.video}" type="video/mp4"></video>`;
      return out;
    }
    return `🤖 Je ne sais pas répondre précisément. Essayez plutôt un mot du dictionnaire ou parcourez les onglets 📖 📚 📄.`;
  }

  document.getElementById('btnEnvoyer')?.addEventListener('click', ()=>{
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = "";
    afficheMsg('user', escapeHTML(txt));
    const rep = reponseBot(txt);
    afficheMsg('bot', rep);
  });

  // Bouton Chat flottant
  document.getElementById('toggleChatBot')?.addEventListener('click', ()=>{
    document.querySelector('.tab-btn[data-tab="chat"]')?.click();
    window.scrollTo({ top: document.getElementById('chat').offsetTop, behavior: 'smooth' });
  });

  console.log("✅ app.js chargé avec succès.");
});
