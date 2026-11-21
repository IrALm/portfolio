// Onglets accessibles (architecture par étape) : clic, flèches gauche / droite, Début / Fin.

const KEY_TARGETS = {
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_, n) => n - 1,
};

function initTabList(list) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];

  function select(tab, focus) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (event) => {
      const target = KEY_TARGETS[event.key];
      if (!target) return;
      event.preventDefault();
      select(tabs[target(i, tabs.length)], true);
    });
  });
}

export function initTabs() {
  document.querySelectorAll('[role="tablist"]').forEach(initTabList);
}
