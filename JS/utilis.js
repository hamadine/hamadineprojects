export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function nettoyerTexte(str) {
  return str
    .normalize('NFD')                           // retire les accents
    .replace(/[\u0300-\u036f]/g, '')           // supprime diacritiques
    .replace(/[^a-zA-Z0-9\s]/g, '')            // caractères spéciaux
    .toLowerCase()
    .trim();
}
