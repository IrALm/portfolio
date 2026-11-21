// Captures des projets : tous les groupes d'une colonne réunis dans un bandeau qui défile
// en continu ; « Tout afficher » rend la galerie complète. Le bandeau s'arrête au survol
// et au focus, et ne démarre pas si le système demande de réduire les animations.
import { el, prefersReducedMotion, scrollBackTo } from './dom.js';

const SPEED = 36; // pixels par seconde
const LABELS = { closed: 'Tout afficher ↓', open: 'Réduire ↑' };

let count = 0;

// La copie sert uniquement à boucler sans à-coup : invisible pour les lecteurs d'écran et le clavier.
function muteCopy(copy) {
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a, button').forEach((node) => node.setAttribute('tabindex', '-1'));
  copy.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
}

// Vignette du bandeau construite à partir d'une <figure> de la galerie.
function createShot(figure, groupLabel) {
  const link = figure.querySelector('a');
  const img = figure.querySelector('img');
  if (!link || !img) return null;
  const href = link.getAttribute('href');

  const shot = el('a', 'reel-shot');
  shot.href = href;
  shot.target = '_blank';
  shot.rel = 'noopener';

  const frame = el('span', 'reel-shot-frame');
  const thumb = el('img');
  // Miniature WebP (tools/optimiser-images.py) ; à défaut, l'image de la galerie.
  const fallback = img.getAttribute('src');
  thumb.src = href.replace(/^images\//, 'images/thumbs/').replace(/\.(jpe?g|png)$/i, '.webp');
  thumb.addEventListener('error', () => (thumb.src = fallback), { once: true });
  thumb.alt = img.alt;
  thumb.loading = 'lazy';
  thumb.decoding = 'async';
  frame.append(thumb);

  const caption = el('span', 'reel-cap');
  const group = el('span', 'reel-group');
  group.textContent = groupLabel;
  caption.append(group, figure.querySelector('figcaption')?.textContent ?? '');

  shot.append(frame, caption);
  return shot;
}

function createReel(groups, reduceMotion) {
  const items = el('div', 'reel-items');
  for (const group of groups) {
    const label = group.querySelector('.kitchup-group-title')?.textContent ?? '';
    for (const figure of group.querySelectorAll('figure')) {
      const shot = createShot(figure, label);
      if (shot) items.append(shot);
    }
  }

  const reel = { content: items, offset: 0, open: false, fits: false, paused: false, inView: false, loaded: false };
  reel.el = el('div', `reel reel--x${reduceMotion ? ' reel--static' : ''}`);
  reel.el.id = `reel-${++count}`;
  reel.track = el('div', 'reel-track');
  reel.copy = el('div', 'reel-copy');
  reel.copy.append(items);
  const clone = reel.copy.cloneNode(true);
  clone.classList.add('reel-clone');
  muteCopy(clone);
  reel.track.append(reel.copy, clone);
  reel.el.append(reel.track);

  const head = el('div', 'featured-block-title gallery-head reel-head');
  head.textContent = `CAPTURES · ${items.children.length}`;
  const full = el('div', 'gallery-full');
  full.id = `${reel.el.id}-full`;
  full.hidden = true;
  groups[0].before(head);
  full.append(...groups);
  head.after(reel.el);
  reel.el.after(full);

  const button = el('button', 'reel-toggle');
  button.type = 'button';
  button.setAttribute('aria-controls', `${reel.el.id} ${full.id}`);
  button.setAttribute('aria-expanded', 'false');
  button.textContent = LABELS.closed;
  head.append(button);

  button.addEventListener('click', () => {
    reel.open = !reel.open;
    button.setAttribute('aria-expanded', String(reel.open));
    button.textContent = reel.open ? LABELS.open : LABELS.closed;
    reel.el.hidden = reel.open;
    full.hidden = !reel.open;
    if (!reel.open) {
      measure(reel);
      scrollBackTo(head, 24);
    }
  });

  const pause = () => (reel.paused = true);
  const resume = () => (reel.paused = false);
  reel.el.addEventListener('mouseenter', pause);
  reel.el.addEventListener('mouseleave', resume);
  reel.el.addEventListener('focusin', pause);
  reel.el.addEventListener('focusout', resume);

  return reel;
}

// Un bandeau qui tient dans la largeur ne défile pas.
function measure(reel) {
  if (reel.open) return;
  reel.fits = reel.content.offsetWidth <= reel.el.clientWidth;
  reel.el.classList.toggle('reel--fits', reel.fits);
  if (reel.fits) {
    reel.offset = 0;
    reel.track.style.transform = '';
  }
}

function animate(reels) {
  let last = 0;
  function tick(time) {
    const dt = last ? Math.min(64, time - last) : 0;
    last = time;
    for (const reel of reels) {
      if (reel.open || reel.fits || reel.paused || !reel.inView) continue;
      const length = reel.copy.offsetWidth;
      if (!length) continue;
      reel.offset = (reel.offset + (SPEED * dt) / 1000) % length;
      reel.track.style.transform = `translate3d(${-reel.offset.toFixed(2)}px,0,0)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function initReels() {
  const reduceMotion = prefersReducedMotion();
  const reels = [];
  document.querySelectorAll('.project-page .featured-grid > div').forEach((column) => {
    const groups = [...column.querySelectorAll(':scope > .kitchup-group')];
    if (groups.length) reels.push(createReel(groups, reduceMotion));
  });
  if (!reels.length) return;

  // Les captures ne se chargent qu'une fois le bandeau à l'écran, puis toutes d'un coup
  // pour qu'elles soient prêtes avant d'entrer dans la zone visible.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const reel = reels.find((r) => r.el === entry.target);
        reel.inView = entry.isIntersecting;
        if (!reel.inView) continue;
        if (!reel.loaded) {
          reel.el.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
          reel.loaded = true;
        }
        measure(reel);
      }
    },
    { rootMargin: '200px 0px' },
  );
  reels.forEach((reel) => observer.observe(reel.el));

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => reels.filter((r) => r.inView).forEach(measure), 150);
  });

  // Les images qui finissent de charger changent la largeur du bandeau.
  document.addEventListener(
    'load',
    (event) => {
      if (event.target.tagName !== 'IMG') return;
      reels.filter((r) => r.inView && r.el.contains(event.target)).forEach(measure);
    },
    true,
  );

  if (!reduceMotion) animate(reels);
}
