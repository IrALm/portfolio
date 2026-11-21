// Menu mobile : le bouton burger ouvre la navigation et le bas de la barre latérale.

export function initMenu({ burger, panels }) {
  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.innerHTML = `<i class="fa-solid ${open ? 'fa-xmark' : 'fa-bars'}"></i>`;
    panels.forEach((panel) => panel.classList.toggle('open', open));
  }

  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));

  return { close: () => setOpen(false) };
}
