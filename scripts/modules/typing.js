// Animation « machine à écrire » du titre et du texte d'accueil.
// Le texte complet est dans le HTML (lisible sans JS et par les moteurs de recherche) ;
// le script le mémorise puis le réécrit progressivement.
import { prefersReducedMotion } from './dom.js';

const TITLE_MS = 900;
const PARA_MS = 1600;

function readBlock(block) {
  const text = block.querySelector('.typed-text');
  return { block, text, caret: block.querySelector('.caret'), full: text.textContent };
}

export function createTyping(titleBlock, paraBlock) {
  const title = readBlock(titleBlock);
  const para = readBlock(paraBlock);
  const total = title.full.length + para.full.length;
  let frame = null;

  function render(count) {
    title.text.textContent = title.full.slice(0, count);
    para.text.textContent = para.full.slice(0, Math.max(0, count - title.full.length));
    title.caret.hidden = count >= title.full.length;
    para.caret.hidden = count < title.full.length || count >= total;
  }

  // Nombre de caractères visibles après `elapsed` ms : le titre, puis le paragraphe.
  function charsAt(elapsed) {
    if (elapsed <= TITLE_MS) return Math.round((title.full.length * elapsed) / TITLE_MS);
    const progress = Math.min(1, (elapsed - TITLE_MS) / PARA_MS);
    return title.full.length + Math.round(para.full.length * progress);
  }

  function reveal() {
    title.block.classList.add('is-revealed');
    para.block.classList.add('is-revealed');
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  }

  function start() {
    stop();
    if (prefersReducedMotion()) {
      render(total);
      reveal();
      return;
    }
    render(0);
    reveal();
    const startedAt = performance.now();
    const step = (now) => {
      const count = Math.min(total, charsAt(Math.max(0, now - startedAt)));
      render(count);
      frame = count < total ? requestAnimationFrame(step) : null;
    };
    frame = requestAnimationFrame(step);
  }

  return { start, stop };
}
