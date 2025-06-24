if (resultats.length) {
  const bloc = resultats.map(doc => {
    const titreSanit = doc.titre
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, '-').toLowerCase();

    const je teste audioPath = `audio/${titreSanit}.mp3`;

    return `
      <strong>${escapeHTML(doc.titre)}</strong><br>
      ${escapeHTML(doc.contenu)}<br><br>
      <button onclick="jouerAudio('${audioPath}')">🔊 Écouter en Tadaksahak</button>
    `;
  }).join('<br><br>');

  return afficherMessage('bot', bloc);
}


function jouerAudio(path) {
  const audio = new Audio(path);
  audio.play().catch(err => {
    alert("⚠️ Impossible de lire l'audio.");
    console.error("Audio error:", err);
  });
}
