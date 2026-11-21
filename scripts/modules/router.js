// Navigation entre les vues : #<vue>, ou #projets/<projet> pour un projet précis.
// Sans ancre, on rouvre la dernière vue consultée.
import { store } from './dom.js';

const PAGE_KEY = 'portfolio-page';

export function initRouter({ projects, menu, typing }) {
  const views = document.querySelectorAll('.view');
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = [...views].map((view) => view.dataset.view);
  let active = null;

  function parseHash() {
    const [page, project] = location.hash.slice(1).split('/');
    return {
      page: pages.includes(page) ? page : null,
      project: page === 'projets' && projects.slugs.includes(project) ? project : null,
    };
  }

  function go(page, { skipScroll = false } = {}) {
    active = page;
    views.forEach((view) => view.classList.toggle('active', view.dataset.view === page));
    navLinks.forEach((link) => link.classList.toggle('active', link.dataset.page === page));
    store.set(PAGE_KEY, page);

    if (!skipScroll) window.scrollTo(0, 0);
    menu.close();
    // La barre des projets n'a de largeur qu'une fois la vue Projets affichée.
    if (page === 'projets') projects.revealActiveTab(false);
    if (page === 'accueil') typing.start();
    else typing.stop();
  }

  // Un lien vers la vue déjà affichée ne change pas l'ancre : on rejoue la vue directement.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-page]');
    if (!link) return;
    event.preventDefault();
    const page = link.dataset.page;
    if (parseHash().page === page) go(page);
    else location.hash = page;
  });

  window.addEventListener('hashchange', () => {
    const target = parseHash();
    if (!target.page) return;
    const samePage = target.page === active;
    const fromPager = Boolean(document.activeElement?.closest('.project-pager'));
    if (!samePage) go(target.page);
    if (target.page === 'projets') {
      projects.show(target.project || projects.current, {
        scroll: samePage,
        focus: samePage && fromPager,
        syncHash: !target.project,
      });
    }
  });

  // Démarrage
  const target = parseHash();
  let initial = target.page;
  if (!initial) {
    const saved = store.get(PAGE_KEY);
    initial = pages.includes(saved) ? saved : 'accueil';
    history.replaceState(null, '', `#${initial}`);
  }
  projects.show(target.project || projects.slugs[0], { instant: true, syncHash: initial === 'projets' });
  go(initial, { skipScroll: true });
}
