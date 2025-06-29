let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;

const langueNavigateur = navigator.language.slice(0,2) || 'fr';
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

function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);}

async function chargerDonnees(){
  try {
    const fichierH = langueInterface==='ar'?'histoire-ar.json':'histoire.json';
    const [mRes,iRes,hRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get(`data/${fichierH}`)
    ]);
    motsComplet = mRes.data; mots = [...motsComplet];
    interfaceData = iRes.data; window.histoireDocs = hRes.data;
    if(!interfaceData[langueInterface]) langueInterface='fr';
    if(!Object.keys(mots[0]||{}).includes(langueTrad)) langueTrad='fr';
    changerLangueInterface(langueInterface);
    initialiserMenusLangues();
    fuse = new Fuse(mots,{keys:['mot',...Object.keys(mots[0]).filter(k=>k!=='cat'&&k.length<=3)],threshold:0.4});
    indexMot = parseInt(localStorage.getItem('motIndex'))||0;
    afficherMot(indexMot);
  } catch(e){
    console.error("Erreur chargement:",e);
    alert("Erreur de chargement des fichiers JSON. Vérifie /data/");
  }
}

function afficherMot(i= indexMot){
  if(!mots.length)return;
  indexMot = Math.max(0,Math.min(mots.length-1,i));
  localStorage.setItem('motIndex',indexMot);
  const m = mots[indexMot];
  document.getElementById('motTexte').textContent = m.mot||'—';
  document.getElementById('definition').innerHTML = escapeHTML(m[langueTrad]||'—') + (m.cat?` <span style="color:#888;">(${escapeHTML(m.cat)})</span>`:'');
  document.getElementById('compteur').textContent = `${indexMot+1} / ${mots.length}`;
}

function genererTraductions(m){
  const l=[`<strong>Tadaksahak</strong>: ${escapeHTML(m.mot)}`];
  for(const [c,n] of Object.entries(nomsLangues))
    if(m[c])l.push(`<strong>${n}</strong>: ${escapeHTML(m[c])}`);
  return l.join('<br>') + (m.cat?` <em>(${escapeHTML(m.cat)})</em>`:'');
}

function jouerAudio(path){
  const audio=new Audio();
  audio.src=path;
  audio.onerror=()=>afficherMessage('bot',`⚠️ Audio indisponible : <code>${path}</code>`);
  audio.oncanplaythrough=()=>audio.play().catch(e=>{
    console.error("Erreur lecture:",e);
    afficherMessage('bot',"⚠️ Impossible de lire l'audio.");
  });
}

function activerMicroEtComparer(){
  if(!('webkitSpeechRecognition' in window)){alert("🎤 Non pris en charge.");return;}
  const rec= new webkitSpeechRecognition();
  rec.lang='fr-FR';
  rec.onstart=()=>afficherMessage('bot',"🎙️ Parlez...");
  rec.onresult=(e)=>{
    const txt=e.results[0][0].transcript.trim().toLowerCase();
    const m=motsComplet.find(o=>Object.values(o).some(v=>typeof v==='string' && v.toLowerCase()===txt));
    if(m)afficherMessage('bot',genererTraductions(m));
    else rechercherDansHistoire(txt);
  };
  rec.onerror=()=>afficherMessage('bot',"❌ Erreur reconnaissance.");
  rec.start();
}

function rechercherDansHistoire(msg){
  const r=(window.histoireDocs||[]).filter(d=>
    (d.titre&&d.titre.toLowerCase().includes(msg))||
    (d.contenu&&d.contenu.toLowerCase().includes(msg))||
    (d.motsCles||[]).some(k=>msg.includes(k.toLowerCase()))
  );
  if(r.length){
    const bloc=r.map(d=>{
      const id=d.titre.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,'-').toLowerCase();
      return `<strong>${escapeHTML(d.titre)}</strong><br>${escapeHTML(d.contenu)}<br><button onclick="jouerAudio('audio/${id}.mp3')">🔊 Écouter</button>`;
    }).join('<br><br>');
    afficherMessage('bot',bloc);
  } else afficherMessage('bot',"❓ Je ne comprends pas.");
}

function envoyerMessage(){
  const inp=document.getElementById('chatInput');
  const msg=inp.value.trim().toLowerCase();
  if(!msg)return;
  afficherMessage('utilisateur', escapeHTML(msg));
  inp.value='';
  const data=interfaceData[langueInterface]?.botIntelligence||interfaceData['fr'].botIntelligence;
  if(!data)return afficherMessage('bot',"Pas de réponses pour le moment.");
  const regex=phrasesMultilingues[langueInterface]||phrasesMultilingues['fr'];
  const m=msg.match(regex);
  if(m){
    const motCherche=m[2].trim();
    const lc=m[3]||m[4]||'fr';
    const ent=motsComplet.find(o=>Object.values(o).some(v=>typeof v==='string' && v.toLowerCase()===motCherche));
    if(ent && ent[lc]){
      return afficherMessage('bot', `<strong>${escapeHTML(motCherche)}</strong> en ${nomsLangues[lc]} : <strong>${escapeHTML(ent[lc])}</strong><br>Mot Tadaksahak : <strong>${escapeHTML(ent.mot)}</strong>`);
    }
    return afficherMessage('bot', data.inconnu||"Je ne comprends pas.");
  }
  const exacts=motsComplet.filter(o=>Object.values(o).some(v=>typeof v==='string' && v.toLowerCase()===msg));
  if(exacts.length)return afficherMessage('bot', exacts.map(genererTraductions).join('<br><br>'));
  rechercherDansHistoire(msg);
}

function afficherMessage(t,c){
  const cb=document.getElementById('chatWindow');
  const m=document.createElement('div');
  m.className=`message ${t}`;
  m.innerHTML=`<strong>${t==='utilisateur'?(window.nomUtilisateur||'Vous'):'Bot'}:</strong> ${c}`;
  cb.appendChild(m); cb.scrollTop=cb.scrollHeight;
}

function initCarousel(){
  const slides=document.querySelectorAll('#carousel-histoire .slide');
  let idx=0;
  if(!slides.length)return;
  slides[idx].classList.add('actif');
  window.changerSlide=(dir)=>{
    slides[idx].classList.remove('actif');
    idx=(idx+dir+slides.length)%slides.length;
    slides[idx].classList.add('actif');
  };
  setInterval(()=>changerSlide(1),8000);
}

function initTabs(){
  const btns=document.querySelectorAll('.tab-btn');
  const secs=document.querySelectorAll('.tab');
  function act(id){
    btns.forEach(b=>b.classList.remove('active'));
    secs.forEach(s=>s.classList.remove('active'));
    const b=[...btns].find(x=>x.dataset.tab===id);
    const s=document.getElementById(id);
    if(b&&s){b.classList.add('active');s.classList.add('active');localStorage.setItem('ongletActif',id);history.replaceState(null,'',`#${id}`);}
  }
  btns.forEach(b=>b.addEventListener('click',()=>act(b.dataset.tab)));
  const h=window.location.hash?.slice(1);
  act(h||localStorage.getItem('ongletActif')||'dictionnaire');
}

function initSubtabs(){
  document.querySelectorAll('nav.subtabs>.subtab-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const p=btn.closest('.ressource-section')||btn.closest('.livre-bloc')||document;
      const id=btn.dataset.subtab;
      p.querySelectorAll('.subtab-btn').forEach(b=>b.classList.remove('active'));
      p.querySelectorAll('.subtab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      const tgt=p.querySelector(`#${id}`);
      if(tgt)tgt.classList.add('active');
      localStorage.setItem(`subtab-${p.id||'subtab'}`,id);
    });
  });
  document.querySelectorAll('.ressource-section,.livre-bloc').forEach(sec=>{
    const zone=sec.id||'subtab',id=localStorage.getItem(`subtab-${zone}`);
    if(!id)return;
    const b=sec.querySelector(`.subtab-btn[data-subtab="${id}"]`);
    const c=sec.querySelector(`#${id}`);
    if(b&&c){sec.querySelectorAll('.subtab-btn').forEach(x=>x.classList.remove('active'));sec.querySelectorAll('.subtab-content').forEach(x=>x.classList.remove('active'));b.classList.add('active');c.classList.add('active');}
  });
  window.openSubtab=(e,tid)=>{
    const s=document.getElementById('idaksahak-emancipation');
    if(!s)return;
    s.querySelectorAll('.subtab-content').forEach(x=>x.classList.remove('active'));
    s.querySelectorAll('.subtab-btn').forEach(x=>x.classList.remove('active'));
    document.getElementById(tid)?.classList.add('active');
    e.currentTarget?.classList.add('active');
  };
}

function initialiserMenusLangues(){
  const bi=document.getElementById('btnLangueInterface');
  const bt=document.getElementById('btnLangueTrad');
  bi.addEventListener('click',()=>{
    const m=document.getElementById('menuLangueInterface');
    m.hidden=!m.hidden;
    if(!m.hidden)genererMenu('menuLangueInterface',c=>{
      changerLangueInterface(c);
      bi.textContent=`Interface : ${nomsLangues[c]} ⌄`;
    });
  });
  bt.addEventListener('click',()=>{
    const m=document.getElementById('menuLangueTrad');
    m.hidden=!m.hidden;
    if(!m.hidden)genererMenu('menuLangueTrad',c=>{
      langueTrad=c; localStorage.setItem('langueTrad',c);
      bt.textContent=`Traduction : ${nomsLangues[c]} ⌄`;
      afficherMot(indexMot);
    });
  });
}

function genererMenu(id,cb){
  const m=document.getElementById(id);
  m.innerHTML='';
  Object.entries(nomsLangues).forEach(([c,n])=>{
    const b=document.createElement('button');
    b.textContent=n; b.className='langue-item'; b.dataset.code=c;
    b.onclick=()=>{cb(c);m.hidden=true;};
    m.appendChild(b);
  });
}

function changerLangueInterface(c){
  langueInterface=c; localStorage.setItem('langueInterface',c);
  document.documentElement.lang=c;
  document.body.dir=(c==='ar')?'rtl':'ltr';
  const t=interfaceData[c]||interfaceData['fr'];
  document.title=t.titrePrincipal;
  document.getElementById('titrePrincipal').textContent=t.titrePrincipal;
  document.getElementById('textePresentation').textContent=t.presentation;
  document.getElementById('searchBar').placeholder=t.searchPlaceholder;
  document.getElementById('btnEnvoyer').textContent=t.envoyer;
  document.getElementById('chat-title').textContent=t.chatTitre;
  document.getElementById('botIntro').innerHTML=t.botIntro;
  document.getElementById('footerText').textContent=t.footerText;
  document.getElementById('btnLangueInterface').textContent=`Interface : ${nomsLangues[c]} ⌄`;
  document.getElementById('btnLangueTrad').textContent=`Traduction : ${nomsLangues[langueTrad]} ⌄`;
  window.nomUtilisateur = t.utilisateur || "Vous";
}

window.addEventListener('DOMContentLoaded', ()=>{
  chargerDonnees();
  initTabs();
  initSubtabs();
  initCarousel();
  document.getElementById('searchBar')?.addEventListener('input',()=>{...});
  document.getElementById('btnPrononcer')?.addEventListener('click', activerMicroEtComparer);
  document.getElementById('btnEnvoyer')?.addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev')?.addEventListener('click', ()=>afficherMot(indexMot-1));
  document.getElementById('btnNext')?.addEventListener('click', ()=>afficherMot(indexMot+1));
});
