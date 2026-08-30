(function () {
  'use strict';

  var PAGES = ['accueil', 'parcours', 'projets', 'stack', 'contact'];
  var TITLE = 'Je conçois des systèmes back-end faits pour durer.';
  var PARA = "Développeur Back-end Java et concepteur d'architectures applicatives. Je construis des solutions robustes, scalables et centrées sur le domaine métier — actuellement chez Crédit Agricole Technologies et Services, en parallèle du Mastère Architecture des Logiciels à l'ESGI.";
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

  /* ── Theme ── */
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

  /* ── Mobile menu ── */
  function setMenuOpen(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.innerHTML = '<i class="fa-solid ' + (open ? 'fa-xmark' : 'fa-bars') + '"></i>';
    mainNav.classList.toggle('open', open);
    sidebarBottom.classList.toggle('open', open);
  }

  burger.addEventListener('click', function () {
    setMenuOpen(!mainNav.classList.contains('open'));
  });

  /* ── Typing animation ── */
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

  /* ── Routing ── */
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

  /* ── Init ── */
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
