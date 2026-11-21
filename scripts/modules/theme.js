// Bouton clair / sombre. Le thème initial est posé dans le <head> (avant l'affichage,
// pour éviter un flash) et porté par data-theme sur <html>.
import { store } from './dom.js';

export const THEME_KEY = 'portfolio-theme';

export function initTheme(button, label) {
  const root = document.documentElement;
  const isDark = () => root.dataset.theme === 'dark';
  const syncLabel = () => {
    label.textContent = isDark() ? 'Mode clair' : 'Mode sombre';
  };

  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set(THEME_KEY, next);
    syncLabel();
  });
  syncLabel();
}
