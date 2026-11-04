(function () {
  'use strict';

  var PAGES = ['accueil', 'parcours', 'projets', 'stack', 'contact'];
  var TITLE = 'Je conçois des systèmes back-end faits pour durer.';
  var PARA = "Je suis développeur back-end Java et je m'intéresse surtout à l'architecture logicielle. Je suis en alternance chez Crédit Agricole Technologies et Services, en parallèle de mon Mastère Architecture des Logiciels à l'ESGI.";
  var TOTAL = TITLE.length + PARA.length;
  var TITLE_MS = 900;
  var PARA_MS = 1600;
  var TICK_MS = 16;

  var root = document.documentElement;
  var views = document.querySelectorAll('.view');
  var navLinks = document.querySelectorAll('.nav-link');
  var burger = document.getElementById('burger');
  var mainNav = document.getElementById('mainNav');
  var sidebarBottom = document.getElementById('sidebarBottom');
  var themeToggle = document.getElementById('themeToggle');
  var themeLabel = document.getElementById('themeLabel');

  var titleEl = document.querySelector('#typedTitle .typed-text');
  var titleCaret = document.querySelector('#typedTitle .caret');
  var paraEl = document.querySelector('#typedPara .typed-text');
  var paraCaret = document.querySelector('#typedPara .caret');

  var typingTimer = null;

  // Thème
  function syncThemeLabel() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeLabel.textContent = dark ? 'Mode clair' : 'Mode sombre';
  }

  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('portfolio-theme', next); } catch (e) {}
    syncThemeLabel();
  }

  themeToggle.addEventListener('click', toggleTheme);
  syncThemeLabel();

  // Menu mobile
  function setMenuOpen(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.innerHTML = '<i class="fa-solid ' + (open ? 'fa-xmark' : 'fa-bars') + '"></i>';
    mainNav.classList.toggle('open', open);
    sidebarBottom.classList.toggle('open', open);
  }

  burger.addEventListener('click', function () {
    setMenuOpen(!mainNav.classList.contains('open'));
  });

  // Animation du texte d'accueil
  function stopTyping() {
    if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
  }

  function renderTyped(n) {
    var titleChars = Math.min(n, TITLE.length);
    var paraChars = Math.max(0, n - TITLE.length);
    titleEl.textContent = TITLE.slice(0, titleChars);
    paraEl.textContent = PARA.slice(0, paraChars);
    titleCaret.style.display = n < TITLE.length ? '' : 'none';
    paraCaret.style.display = (n >= TITLE.length && n < TOTAL) ? '' : 'none';
  }

  function startTyping() {
    stopTyping();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { renderTyped(TOTAL); return; }

    renderTyped(0);
    var start = (window.performance && performance.now) ? performance.now() : Date.now();

    typingTimer = setInterval(function () {
      var now = (window.performance && performance.now) ? performance.now() : Date.now();
      var elapsed = now - start;
      var target;
      if (elapsed <= TITLE_MS) {
        target = Math.round(TITLE.length * (elapsed / TITLE_MS));
      } else {
        target = TITLE.length + Math.round(PARA.length * Math.min(1, (elapsed - TITLE_MS) / PARA_MS));
      }
      target = Math.max(0, Math.min(TOTAL, target));
      renderTyped(target);
      if (target >= TOTAL) stopTyping();
    }, TICK_MS);
  }

  // Navigation entre les pages
  function currentPageFromHash() {
    var hash = (location.hash || '').replace('#', '');
    return PAGES.indexOf(hash) !== -1 ? hash : null;
  }

  function go(page, opts) {
    opts = opts || {};
    var replay = page === 'accueil';

    views.forEach(function (v) {
      v.classList.toggle('active', v.getAttribute('data-view') === page);
    });
    navLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-page') === page);
    });

    try { localStorage.setItem('portfolio-page', page); } catch (e) {}

    if (!opts.skipScroll) window.scrollTo(0, 0);
    setMenuOpen(false);

    if (replay && !opts.skipTyping) startTyping();
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    var page = link.getAttribute('data-page');
    if (location.hash.replace('#', '') === page) {
      go(page);
    } else {
      location.hash = page;
    }
  });

  window.addEventListener('hashchange', function () {
    var page = currentPageFromHash();
    if (page) go(page);
  });

  window.addEventListener('beforeunload', stopTyping);

  // Onglets (architecture par étape) : clic, flèches gauche/droite, Début/Fin
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        t.setAttribute('tabindex', active ? '0' : '-1');
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  // Vidéos YouTube ouvertes en local (file://) : le navigateur n'envoie aucune
  // origine et YouTube refuse la lecture (« Erreur 153 »). On remplace alors
  // chaque lecteur par sa miniature, qui ouvre la vidéo sur YouTube. En ligne
  // ou via un serveur local, rien ne change.
  if (location.protocol === 'file:') {
    document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(function (frame) {
      var id = frame.src.split('/embed/')[1].split(/[?&#]/)[0];
      var link = document.createElement('a');
      link.className = 'video-poster';
      link.href = 'https://youtu.be/' + id;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', (frame.title || 'Vidéo') + ' : regarder sur YouTube');
      var img = document.createElement('img');
      img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
      img.alt = '';
      img.loading = 'lazy';
      var play = document.createElement('span');
      play.className = 'video-poster-play';
      play.setAttribute('aria-hidden', 'true');
      link.appendChild(img);
      link.appendChild(play);
      frame.replaceWith(link);
    });
  }

  // Démarrage
  (function init() {
    var initial = currentPageFromHash();
    if (!initial) {
      try { initial = localStorage.getItem('portfolio-page'); } catch (e) {}
      if (PAGES.indexOf(initial) === -1) initial = 'accueil';
      history.replaceState(null, '', '#' + initial);
    }
    go(initial, { skipScroll: true, skipTyping: true });
    if (initial === 'accueil') startTyping();
  })();
})();
