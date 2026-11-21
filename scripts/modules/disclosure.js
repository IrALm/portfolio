// Blocs dépliables simples (page Stack) : un bouton affiche ou masque la zone qu'il contrôle.
// Ses deux libellés sont donnés par data-labels="fermé|ouvert".
import { scrollBackTo } from './dom.js';

function initDisclosure(button) {
  const region = document.getElementById(button.getAttribute('aria-controls'));
  const labels = (button.dataset.labels || '').split('|');
  if (!region || labels.length !== 2) return;

  button.addEventListener('click', () => {
    const open = region.hidden;
    region.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = labels[open ? 1 : 0];
    // Le bouton passe sous la zone dépliée pour qu'on puisse la refermer en fin de lecture.
    if (open) {
      region.after(button);
    } else {
      region.before(button);
      scrollBackTo(button, 120);
    }
    button.focus({ preventScroll: true });
  });
}

export function initDisclosures() {
  document.querySelectorAll('.stack-more-toggle').forEach(initDisclosure);
}
