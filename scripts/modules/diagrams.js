// Schémas d'architecture plus larges que l'écran (mobile) : fondu du côté coupé, flèches,
// indication « Glisser » et bouton « Agrandir » qui ouvre le schéma en plein écran.
import { el, scrollEdges } from './dom.js';

// Une seule fenêtre plein écran, partagée : le schéma y est déplacé puis remis à sa place
// (le déplacer plutôt que le copier évite les identifiants SVG en double).
function createFullscreen() {
  const dialog = el('dialog', 'archi-dialog');
  dialog.setAttribute('aria-labelledby', 'archiDialogTitle');
  dialog.innerHTML = `
    <div class="archi-dialog-head">
      <span class="archi-dialog-title" id="archiDialogTitle"></span>
      <button type="button" class="archi-dialog-close">Fermer ✕</button>
    </div>
    <p class="archi-dialog-tip">Tournez le téléphone vers la gauche ↺ pour lire le schéma. Zoom possible avec deux doigts.</p>
    <div class="archi archi-dialog-body"></div>`;
  const body = dialog.querySelector('.archi-dialog-body');
  const title = dialog.querySelector('.archi-dialog-title');
  const placeholder = document.createComment('schéma');
  let shown = null;

  dialog.querySelector('.archi-dialog-close').addEventListener('click', () => dialog.close());
  // Un clic sur le fond (hors du contenu) ferme aussi la fenêtre.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!shown) return;
    placeholder.replaceWith(shown.svg);
    shown.opener.focus();
    shown = null;
  });
  document.body.append(dialog);

  return function open(svg, opener) {
    title.textContent = svg.querySelector('title')?.textContent ?? 'Schéma';
    svg.replaceWith(placeholder);
    body.append(svg);
    shown = { svg, opener };
    dialog.showModal();
    body.scrollLeft = 0;
  };
}

function enhance(scroller, openFullscreen) {
  const svg = scroller.querySelector('svg');
  if (!svg) return;

  const wrap = el('div', 'archi-viewport');
  scroller.before(wrap);
  wrap.append(scroller);

  // Les flèches doublent le geste de glisser : inutiles au clavier et aux lecteurs d'écran.
  function arrow(dir, label) {
    const button = el('button', `archi-arrow archi-arrow--${dir < 0 ? 'prev' : 'next'}`);
    button.type = 'button';
    button.setAttribute('aria-hidden', 'true');
    button.tabIndex = -1;
    button.textContent = label;
    button.hidden = true;
    button.addEventListener('click', () => {
      scroller.scrollBy({ left: dir * scroller.clientWidth * 0.7, behavior: 'smooth' });
    });
    wrap.append(button);
    return button;
  }
  const prev = arrow(-1, '‹');
  const next = arrow(1, '›');

  const bar = el('div', 'archi-tools');
  bar.hidden = true;
  bar.innerHTML =
    '<span class="archi-hint">Glisser pour voir la suite →</span>' +
    '<button type="button" class="archi-zoom">Agrandir ⤢</button>';
  wrap.after(bar);
  const hint = bar.querySelector('.archi-hint');
  const zoom = bar.querySelector('.archi-zoom');
  zoom.addEventListener('click', () => openFullscreen(svg, zoom));

  function update() {
    if (!scroller.clientWidth) return; // onglet ou projet masqué
    if (!scroller.contains(svg)) return; // schéma ouvert en plein écran
    const { canLeft, canRight } = scrollEdges(scroller);
    wrap.classList.toggle('can-left', canLeft);
    wrap.classList.toggle('can-right', canRight);
    prev.hidden = !canLeft;
    next.hidden = !canRight;
    bar.hidden = !(canLeft || canRight);
    hint.textContent = canRight ? 'Glisser pour voir la suite →' : '← Glisser pour revenir';
  }

  scroller.addEventListener('scroll', update, { passive: true });
  // Se déclenche aussi quand le schéma devient visible (changement de projet ou d'onglet).
  new ResizeObserver(update).observe(scroller);
  update();
}

export function initDiagrams() {
  const scrollers = document.querySelectorAll('.archi-scroll');
  if (!scrollers.length) return;
  let openFullscreen = null;
  const openLazily = (svg, opener) => {
    openFullscreen ??= createFullscreen();
    openFullscreen(svg, opener);
  };
  scrollers.forEach((scroller) => enhance(scroller, openLazily));
}
