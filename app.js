(() => {
  const motsComplet = mots_final_489;
  const interfaceData = interface_langue;
  const histoireDocs = histoire;
  const audiosList = audios;
  const photosList = photos;
  const videosList = videos;
  const docsList = docs;
  const livresList = livres;
  const quizList = quiz;

  let mots = [...motsComplet], idx = parseInt(localStorage.getItem('motIndex')) || 0;
  const langueNav = navigator.language.slice(0,2);
  let langueInterface = localStorage.getItem('langueInterface') || (langueNav==='en'?'en':'fr');
  let langueTrad = localStorage.getItem('langueTrad') || 'fr';
  let fuse;
  const escapeHTML = str => str.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const nettoie = str=>str.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w\s]/g,"").toLowerCase();
  const logStatus = (txt,type='info')=>{
    const e = document.getElementById('messageStatus'); if(!e)return;
    e.textContent = txt; e.style.color = (type==='error'?'red':'green'); e.hidden=false;
  };
  const afficheMsgChat = (who,html)=>{
    const c = document.getElementById('chatWindow');
    const m = document.createElement('div');
    m.className = `message ${who}`;
    m.innerHTML = `<strong>${who==='bot'?interfaceData[langueInterface]?.bot||'Bot':'Vous'}:</strong> ${html}`;
    c.appendChild(m); c.scrollTop=c.scrollHeight;
    m.querySelectorAll('.btn-ecoute').forEach(b=>{
      b.onclick=()=>{
        new Audio(`audios/${b.dataset.key}.mp3`).play().catch(()=>{
          alert("⚠️ Audio non disponible.")
        });
      }
    });
  };
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.onglet-contenu').forEach(s=>s.hidden=true);
      btn.classList.add('active');
      const id = btn.dataset.tab;
      document.getElementById(id).hidden = false;
    };
  });
  fuse = new Fuse(mots, { keys:['mot','fr','en'], threshold:0.4 });
  const showMot = (n)=>{
    idx = Math.max(0,Math.min(mots.length-1,n));
    localStorage.setItem('motIndex',idx);
    const m = mots[idx];
    document.getElementById('motTexte').textContent = m.mot||'—';
    document.getElementById('definition').innerHTML = escapeHTML(m[langueTrad]||'—') + (m.cat?` <span style="color:#888">(${escapeHTML(m.cat)})</span>`:'');
    document.getElementById('compteur').textContent = `${idx+1}/${mots.length}`;
  };
  document.getElementById('btnPrev').onclick = ()=>showMot(idx-1);
  document.getElementById('btnNext').onclick = ()=>showMot(idx+1);
  document.getElementById('searchBar').oninput = e=>{
    const q = nettoie(e.target.value); mots = q? fuse.search(q).map(r=>r.item):[...motsComplet];
    mots.length? showMot(0) : (()=>{document.getElementById('motTexte').textContent="Aucun résultat";document.getElementById('definition').textContent="";document.getElementById('compteur').textContent="0/0";})();
  };
  showMot(idx);
  document.getElementById('btnEnvoyer').onclick = ()=>{
    const txt = document.getElementById('chatInput').value.trim(); if(!txt)return;
    document.getElementById('chatInput').value = '';
    afficheMsgChat('user',escapeHTML(txt));
    const c = nettoie(txt), bot=interfaceData[langueInterface]?.botIntelligence||{};
    if(bot.insultes?.some(i=>c.includes(nettoie(i)))) return afficheMsgChat('bot', bot.insulte || "🙏");
    if(bot.salutations_triggers?.some(t=>c.includes(nettoie(t)))) return afficheMsgChat('bot', bot.salutations[Math.floor(Math.random()*bot.salutations.length)]);
    for(const fq in bot.faq||{}) if(c.includes(nettoie(fq))) return afficheMsgChat('bot', bot.faq[fq]);
    const res = fuse.search(txt).slice(0,1);
    if(res.length) {
      const m=res[0].item;
      return afficheMsgChat('bot',`🔍 <strong>${m.mot}</strong><br>Français: <strong>${m.fr}</strong><br>Anglais: <strong>${m.en}</strong>`);
    }
    for(const t in bot.chatTriggers||{}) {
      if(c.includes(nettoie(t))) {
        const doc = histoireDocs.find(d=>nettoie(d.titre+d.contenu).includes(nettoie(t)));
        if(doc) {
          let out=`<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}<br><button class="btn-ecoute" data-key="${t}">🔊 Écouter</button>`;
          if(doc.image) out+=`<br><img src="${doc.image}">`;
          if(doc.video) out+=`<br><video controls src="${doc.video}">`;
          return afficheMsgChat('bot',out);
        }
        return afficheMsgChat('bot',`🔎 Rien sur «${t}».`);
      }
    }
    afficheMsgChat('bot', bot.incompréhension || "❓Je ne sais pas.");
  };
  const audC = document.getElementById('audioContainer');
  if(audC) audiosList.forEach(a=>{
    const b = document.createElement('button');
    b.textContent = `▶️ ${a.title}`;
    b.onclick = ()=>new Audio(a.src).play();
    audC.appendChild(b);
  });

  const photC = document.getElementById('photosContainer');
  if(photC) photosList.forEach(p=>photC.innerHTML+=`<img src="${p.src}" alt="${p.alt}">`);

  const vidC = document.getElementById('videosContainer');
  if(vidC) videosList.forEach(v=>vidC.innerHTML+=`<video controls data-date="${v.date}" src="${v.src}" title="${v.title}"></video>`);

  document.getElementById('filtreVideos')?.onchange = e=>{
    const ord = e.target.value==='ancien'?1:-1;
    Array.from(vidC.children).sort((a,b)=>(new Date(a.dataset.date)-new Date(b.dataset.date))*ord).forEach(n=>vidC.appendChild(n));
  };
  const docC = document.getElementById('rapportsContainer');
  if(docC) docsList.filter(d=>d.type!=='communique').forEach(d=>docC.innerHTML+=`<a href="${d.url}" target="_blank">${d.title}</a> (${d.date})<br>`);
  const actC = document.getElementById('newsContainer');
  if(actC) docsList.filter(d=>d.type==='communique').forEach(d=>{
    actC.innerHTML+=`<a href="${d.url}" target="_blank">${d.title}</a> (${d.date})<br>`;
  });

  const libC = document.getElementById('livresContainer');
  const filtreLivres = ()=>{
    const kw=document.getElementById('rechercheLivres').value.toLowerCase();
    const sel=document.getElementById('selectThemeLivres').value;
    libC.innerHTML = livresList.filter(l=> l.cat===sel && l.title.toLowerCase().includes(kw))
      .map(l=>`<a href="${l.url}" target="_blank">${l.title}</a><br>`).join('');
  };
  document.getElementById('rechercheLivres').oninput = filtreLivres;
  document.getElementById('selectThemeLivres').onchange = filtreLivres;
  filtreLivres();

  const quizC = document.getElementById('quizContainer');
  if(quizC) {
    let qi=0, score=0;
    const nextQ = ()=>{
      if(qi>=quizList.length) {
        quizC.innerHTML = `Votre score: ${score}/${quizList.length}`;
        return;
      }
      const q=quizList[qi];
      quizC.innerHTML = `<h3>${q.q}</h3>` + q.opts.map((o,i)=>`<button class="quizOpt" data-i="${i}">${o}</button>`).join('');
      quizC.querySelectorAll('.quizOpt').forEach(b=>{
        b.onclick=()=>{
          if(parseInt(b.dataset.i)===q.a) score++;
          qi++; nextQ();
        };
      });
    };
    nextQ();
  }

  logStatus("✅ Application prête.");
})();
