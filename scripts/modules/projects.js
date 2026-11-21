// Page Projets : un projet affiché à la fois, barre défilable en haut, précédent / suivant en bas.
import { scrollEdges } from './dom.js';

export function initProjects() {
  const pages = [...document.querySelectorAll('.project-page')];
  const slugs = pages.map((page) => page.dataset.project);
  const wrap = document.getElementById('projectNavWrap');
  const nav = document.getElementById('projectNav');
  const links = nav.querySelectorAll('.project-nav-link');
  const arrows = wrap.querySelectorAll('.project-nav-arrow');
  const prev = document.getElementById('projectPrev');
  const next = document.getElementById('projectNext');
  const count = document.getElementById('projectCount');
  let current = null;

  // Flèches et bords fondus selon ce qui reste à voir dans la barre.
  function updateArrows() {
    const { canLeft, canRight } = scrollEdges(nav);
    wrap.classList.toggle('can-left', canLeft);
    wrap.classList.toggle('can-right', canRight);
    arrows.forEach((arrow) => {
      arrow.hidden = arrow.dataset.dir === '-1' ? !canLeft : !canRight;
    });
  }

  // Fait apparaître le projet affiché dans la barre s'il est hors de la zone visible.
  function revealActiveTab(smooth) {
    const link = nav.querySelector('[aria-current="page"]');
    if (!nav.clientWidth || !link) return;
    const margin = 48;
    const left = link.offsetLeft;
    const right = left + link.offsetWidth;
    let target = null;
    if (left < nav.scrollLeft + margin) target = left - margin;
    else if (right > nav.scrollLeft + nav.clientWidth - margin) target = right - nav.clientWidth + margin;
    if (target !== null) nav.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' });
    updateArrows();
  }

  function setPagerLink(link, page) {
    link.hidden = !page;
    if (!page) return;
    link.href = `#projets/${page.dataset.project}`;
    link.querySelector('.project-pager-name').textContent = page.dataset.label;
  }

  // Options : instant (pas d'animation), syncHash (réécrit l'URL), scroll (remonte en haut
  // des projets), focus (place le focus sur le projet, après un clic sur précédent / suivant).
  function show(slug, { instant = false, syncHash = false, scroll = false, focus = false } = {}) {
    let index = slugs.indexOf(slug);
    if (index === -1) index = 0;
    slug = slugs[index];
    const changed = slug !== current;

    pages.forEach((page, i) => {
      const active = i === index;
      // Une vidéo YouTube en cours de lecture s'arrête quand on quitte son projet :
      // réaffecter la source recharge le lecteur.
      if (!active && changed && !instant && !page.hidden) {
        page.querySelectorAll('iframe').forEach((frame) => frame.setAttribute('src', frame.getAttribute('src')));
      }
      page.hidden = !active;
      page.classList.toggle('is-entering', active && changed && !instant);
    });
    links.forEach((link) => {
      if (link.dataset.project === slug) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    setPagerLink(prev, pages[index - 1]);
    setPagerLink(next, pages[index + 1]);
    count.textContent = `${index + 1} / ${slugs.length}`;

    current = slug;
    if (syncHash) history.replaceState(null, '', `#projets/${slug}`);

    // Retour en haut des projets si l'on avait défilé plus bas (bouton « suivant » par exemple).
    if (scroll) {
      const top = nav.getBoundingClientRect().top + window.scrollY - 32;
      if (window.scrollY > top) window.scrollTo(0, top);
    }
    if (focus) pages[index].focus({ preventScroll: true });
    revealActiveTab(!instant);
  }

  nav.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => {
      nav.scrollBy({ left: Number(arrow.dataset.dir) * nav.clientWidth * 0.75, behavior: 'smooth' });
    });
  });

  return {
    slugs,
    show,
    revealActiveTab,
    get current() {
      return current;
    },
  };
}
