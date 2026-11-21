// Blocs de texte des projets (fonctionnalités, ingénierie…) : aperçu fixe des premières
// lignes avec un fondu en bas et « Lire la suite » sous le texte. Un bloc assez court
// pour tenir dans l'aperçu s'affiche en entier, sans bouton.
import { el, scrollBackTo } from './dom.js';

let count = 0;

function createPreview(list) {
  const head = list.previousElementSibling;
  const box = el('div', 'preview');
  box.id = `preview-${++count}`;
  list.before(box);
  box.append(list);

  const button = el('button', 'preview-toggle');
  button.type = 'button';
  button.setAttribute('aria-controls', box.id);
  box.after(button);

  let open = false;
  let limit = 0;

  function render() {
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Réduire ↑' : 'Lire la suite ↓';
    box.classList.toggle('is-open', open);
  }

  function measure() {
    if (open || !box.clientWidth) return;
    // Hauteur de l'aperçu lue tant qu'elle est active ; une fois le bloc affiché en entier
    // elle vaut « none », d'où la valeur mémorisée (sinon la mesure oscillerait).
    const maxHeight = parseFloat(getComputedStyle(box).maxHeight);
    if (Number.isFinite(maxHeight)) limit = maxHeight;
    if (!limit) return;
    const fits = list.offsetHeight <= limit + 1;
    box.classList.toggle('preview--fits', fits);
    button.hidden = fits;
  }

  button.addEventListener('click', () => {
    open = !open;
    render();
    if (!open) scrollBackTo(head, 24);
  });
  render();
  new ResizeObserver(measure).observe(box);
}

export function initPreviews() {
  document.querySelectorAll('.project-page .featured-block-title + .spec-list').forEach(createPreview);
}
