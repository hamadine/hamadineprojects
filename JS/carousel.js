export function initCarousel() {
  const slides = document.querySelectorAll('#carousel-histoire .slide');
  let idx = 0;

  if (!slides.length) return;

  slides[idx].classList.add('actif');

  window.changerSlide = function (dir) {
    slides[idx].classList.remove('actif');
    idx = (idx + dir + slides.length) % slides.length;
    slides[idx].classList.add('actif');
  };

  setInterval(() => changerSlide(1), 8000);
}
