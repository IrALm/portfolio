// Petits utilitaires DOM partagés par les modules.

export function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Après la fermeture d'un bloc déplié, ramène son titre à l'écran s'il est passé au-dessus.
export function scrollBackTo(element, gap) {
  const top = element.getBoundingClientRect().top;
  if (top < 0) window.scrollBy(0, top - gap);
}

// Pour un conteneur défilant horizontalement : reste-t-il du contenu caché à gauche, à droite ?
export function scrollEdges(scroller) {
  return {
    canLeft: scroller.scrollLeft > 2,
    canRight: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 2,
  };
}

// localStorage peut être indisponible (navigation privée, stockage bloqué) : le site
// fonctionne alors simplement sans mémoriser les préférences.
export const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Stockage indisponible : préférence non mémorisée.
    }
  },
};
