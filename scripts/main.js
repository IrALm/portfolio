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

  // Navigation entre les pages (#page, ou #projets/<projet> pour un projet précis)
  var activePage = null;

  function parseHash() {
    var parts = (location.hash || '').replace('#', '').split('/');
    var page = PAGES.indexOf(parts[0]) !== -1 ? parts[0] : null;
    var project = page === 'projets' && PROJECTS.indexOf(parts[1]) !== -1 ? parts[1] : null;
    return { page: page, project: project };
  }

  function currentPageFromHash() {
    return parseHash().page;
  }

  // Projets : un projet affiché à la fois, barre en haut et précédent/suivant en bas
  var projectPages = Array.prototype.slice.call(document.querySelectorAll('.project-page'));
  var PROJECTS = projectPages.map(function (p) { return p.getAttribute('data-project'); });
  var projectNav = document.getElementById('projectNav');
  var projectNavLinks = document.querySelectorAll('.project-nav-link');
  var projectPrev = document.getElementById('projectPrev');
  var projectNext = document.getElementById('projectNext');
  var projectCount = document.getElementById('projectCount');
  var currentProject = PROJECTS[0];
  var projectNavWrap = document.getElementById('projectNavWrap');
  var projectNavArrows = document.querySelectorAll('.project-nav-arrow');

  // Barre des projets défilable : flèches et bords fondus selon ce qui reste à voir.
  function updateProjectNavArrows() {
    if (!projectNav || !projectNavWrap) return;
    var canLeft = projectNav.scrollLeft > 2;
    var canRight = projectNav.scrollLeft + projectNav.clientWidth < projectNav.scrollWidth - 2;
    projectNavWrap.classList.toggle('can-left', canLeft);
    projectNavWrap.classList.toggle('can-right', canRight);
    projectNavArrows.forEach(function (b) {
      b.hidden = b.getAttribute('data-dir') === '-1' ? !canLeft : !canRight;
    });
  }

  // Fait apparaître le projet affiché dans la barre s'il est hors de la zone visible.
  function revealActiveProjectTab(smooth) {
    if (!projectNav || !projectNav.clientWidth) return;
    var link = projectNav.querySelector('[aria-current="page"]');
    if (!link) return;
    var margin = 48;
    var left = link.offsetLeft;
    var right = left + link.offsetWidth;
    var target = null;
    if (left < projectNav.scrollLeft + margin) target = left - margin;
    else if (right > projectNav.scrollLeft + projectNav.clientWidth - margin) target = right - projectNav.clientWidth + margin;
    if (target !== null) projectNav.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' });
    updateProjectNavArrows();
  }

  if (projectNav) {
    projectNav.addEventListener('scroll', updateProjectNavArrows, { passive: true });
    window.addEventListener('resize', updateProjectNavArrows);
    projectNavArrows.forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        projectNav.scrollBy({ left: dir * projectNav.clientWidth * 0.75, behavior: 'smooth' });
      });
    });
  }

  function setPagerLink(link, page) {
    if (!link) return;
    link.hidden = !page;
    if (!page) return;
    link.href = '#projets/' + page.getAttribute('data-project');
    link.querySelector('.project-pager-name').textContent = page.getAttribute('data-label');
  }

  function showProject(slug, opts) {
    opts = opts || {};
    var index = PROJECTS.indexOf(slug);
    if (index === -1) { index = 0; slug = PROJECTS[0]; }
    var changed = slug !== currentProject;

    projectPages.forEach(function (p, i) {
      var active = i === index;
      // Une vidéo YouTube en cours de lecture s'arrête quand on quitte son projet.
      if (!active && changed && !opts.instant && !p.hidden) {
        p.querySelectorAll('iframe').forEach(function (f) { f.src = f.src; });
      }
      p.hidden = !active;
      p.classList.toggle('is-entering', active && changed && !opts.instant);
    });
    projectNavLinks.forEach(function (l) {
      if (l.getAttribute('data-project') === slug) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    });
    setPagerLink(projectPrev, projectPages[index - 1]);
    setPagerLink(projectNext, projectPages[index + 1]);
    if (projectCount) projectCount.textContent = (index + 1) + ' / ' + PROJECTS.length;

    currentProject = slug;
    if (opts.syncHash) history.replaceState(null, '', '#projets/' + slug);

    // Retour en haut des projets si l'on avait défilé plus bas (bouton « suivant » par exemple).
    if (opts.scroll && projectNav) {
      var top = projectNav.getBoundingClientRect().top + window.pageYOffset - 32;
      if (window.pageYOffset > top) window.scrollTo(0, top);
    }
    if (opts.focus) projectPages[index].focus({ preventScroll: true });
    revealActiveProjectTab(!opts.instant);
  }

  function go(page, opts) {
    opts = opts || {};
    var replay = page === 'accueil';
    activePage = page;

    views.forEach(function (v) {
      v.classList.toggle('active', v.getAttribute('data-view') === page);
    });
    navLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-page') === page);
    });

    try { localStorage.setItem('portfolio-page', page); } catch (e) {}

    if (!opts.skipScroll) window.scrollTo(0, 0);
    setMenuOpen(false);
    // La barre n'a de largeur qu'une fois la vue Projets affichée.
    if (page === 'projets') revealActiveProjectTab(false);

    if (replay && !opts.skipTyping) startTyping();
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    var page = link.getAttribute('data-page');
    if (currentPageFromHash() === page) {
      go(page);
    } else {
      location.hash = page;
    }
  });

  window.addEventListener('hashchange', function () {
    var target = parseHash();
    if (!target.page) return;
    var samePage = target.page === activePage;
    var fromPager = document.activeElement && document.activeElement.closest &&
      document.activeElement.closest('.project-pager');
    if (!samePage) go(target.page);
    if (target.page === 'projets') {
      showProject(target.project || currentProject, {
        scroll: samePage,
        focus: samePage && !!fromPager,
        syncHash: !target.project
      });
    }
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

  // Schémas d'architecture plus larges que l'écran (mobile) : fondu du côté coupé,
  // flèches, indication « Glisser » et bouton « Agrandir » qui ouvre le schéma en plein écran.
  (function () {
    var scrollers = document.querySelectorAll('.archi-scroll');
    if (!scrollers.length) return;

    // Une seule fenêtre plein écran, partagée : le schéma y est déplacé puis remis à sa place
    // (le déplacer plutôt que le copier évite les identifiants SVG en double).
    var dialog = null;
    var dialogBody = null;
    var dialogTitle = null;
    var placeholder = document.createComment('schéma');
    var shown = null;

    function buildDialog() {
      dialog = document.createElement('dialog');
      dialog.className = 'archi-dialog';
      dialog.setAttribute('aria-labelledby', 'archiDialogTitle');
      dialog.innerHTML =
        '<div class="archi-dialog-head">' +
          '<span class="archi-dialog-title" id="archiDialogTitle"></span>' +
          '<button type="button" class="archi-dialog-close">Fermer ✕</button>' +
        '</div>' +
        '<p class="archi-dialog-tip">Tournez le téléphone vers la gauche ↺ pour lire le schéma. Zoom possible avec deux doigts.</p>' +
        '<div class="archi archi-dialog-body"></div>';
      dialogBody = dialog.querySelector('.archi-dialog-body');
      dialogTitle = dialog.querySelector('.archi-dialog-title');
      dialog.querySelector('.archi-dialog-close').addEventListener('click', function () { dialog.close(); });
      // Un clic sur le fond (hors du contenu) ferme aussi la fenêtre.
      dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
      dialog.addEventListener('close', function () {
        if (shown) { placeholder.replaceWith(shown.svg); shown.opener.focus(); shown = null; }
      });
      document.body.appendChild(dialog);
    }

    function openDialog(svg, opener) {
      if (!dialog) buildDialog();
      if (typeof dialog.showModal !== 'function') return;
      var t = svg.querySelector('title');
      dialogTitle.textContent = t ? t.textContent : 'Schéma';
      svg.replaceWith(placeholder);
      dialogBody.appendChild(svg);
      shown = { svg: svg, opener: opener };
      dialog.showModal();
      dialogBody.scrollLeft = 0;
    }

    scrollers.forEach(function (scroller) {
      var svg = scroller.querySelector('svg');
      if (!svg) return;

      var wrap = document.createElement('div');
      wrap.className = 'archi-viewport';
      scroller.parentNode.insertBefore(wrap, scroller);
      wrap.appendChild(scroller);

      function arrow(dir, label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'archi-arrow archi-arrow--' + (dir < 0 ? 'prev' : 'next');
        b.setAttribute('aria-hidden', 'true');
        b.tabIndex = -1;
        b.textContent = label;
        b.hidden = true;
        b.addEventListener('click', function () {
          scroller.scrollBy({ left: dir * scroller.clientWidth * 0.7, behavior: 'smooth' });
        });
        wrap.appendChild(b);
        return b;
      }
      var prev = arrow(-1, '‹');
      var next = arrow(1, '›');

      var bar = document.createElement('div');
      bar.className = 'archi-tools';
      bar.hidden = true;
      bar.innerHTML = '<span class="archi-hint">Glisser pour voir la suite →</span>' +
        '<button type="button" class="archi-zoom">Agrandir ⤢</button>';
      wrap.after(bar);
      var hint = bar.querySelector('.archi-hint');
      var zoom = bar.querySelector('.archi-zoom');
      zoom.addEventListener('click', function () { openDialog(svg, zoom); });

      function update() {
        if (!scroller.clientWidth) return; // onglet ou projet masqué
        if (!scroller.contains(svg)) return; // schéma ouvert en plein écran
        var canLeft = scroller.scrollLeft > 2;
        var canRight = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 2;
        wrap.classList.toggle('can-left', canLeft);
        wrap.classList.toggle('can-right', canRight);
        prev.hidden = !canLeft;
        next.hidden = !canRight;
        bar.hidden = !(canLeft || canRight);
        hint.textContent = canRight ? 'Glisser pour voir la suite →' : '← Glisser pour revenir';
      }

      scroller.addEventListener('scroll', update, { passive: true });
      // Se déclenche aussi quand le schéma devient visible (changement de projet ou d'onglet).
      if ('ResizeObserver' in window) new ResizeObserver(update).observe(scroller);
      else window.addEventListener('resize', update);
      update();
    });
  })();

  // Blocs réduits des projets : en mode réduit, le texte (fonctionnalités, ingénierie…)
  // défile lentement vers le haut et les captures défilent en bandeau ; « Déplier »
  // fige le bloc et l'affiche en entier. Le défilement s'arrête au survol et au focus,
  // et ne démarre pas si le système demande de réduire les animations.
  (function () {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SPEED = { y: 16, x: 36 }; // pixels par seconde
    var reels = [];
    var count = 0;

    function el(tag, className) {
      var e = document.createElement(tag);
      if (className) e.className = className;
      return e;
    }

    // La copie sert uniquement à boucler sans à-coup : invisible pour les lecteurs d'écran et le clavier.
    function muteCopy(copy) {
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('a, button').forEach(function (n) { n.setAttribute('tabindex', '-1'); });
      copy.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    }

    function measure(s) {
      if (s.open) return;
      var fits = s.axis === 'y'
        ? s.content.offsetHeight <= parseFloat(getComputedStyle(s.el).maxHeight)
        : s.content.offsetWidth <= s.el.clientWidth;
      s.fits = fits;
      s.el.classList.toggle('reel--fits', fits);
      if (fits) { s.offset = 0; s.track.style.transform = ''; }
      if (s.axis === 'y') s.btn.hidden = fits;
    }

    function setOpen(s, open) {
      s.open = open;
      s.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      s.btn.textContent = open ? s.labels[1] : s.labels[0];
      s.apply(open);
      if (!open) {
        measure(s);
        // Revenir au titre du bloc s'il est passé au-dessus de l'écran.
        var top = s.head.getBoundingClientRect().top;
        if (top < 0) window.scrollBy(0, top - 24);
      }
    }

    function createReel(axis, content, head, labels, apply) {
      var s = { axis: axis, content: content, head: head, labels: labels, offset: 0,
        open: false, fits: false, paused: false, inView: false, loaded: false };
      s.el = el('div', 'reel reel--' + axis + (reduceMotion ? ' reel--static' : ''));
      s.el.id = 'reel-' + (++count);
      s.track = el('div', 'reel-track');
      s.copy = el('div', 'reel-copy');
      s.copy.appendChild(content);
      var clone = s.copy.cloneNode(true);
      clone.classList.add('reel-clone');
      muteCopy(clone);
      s.track.appendChild(s.copy);
      s.track.appendChild(clone);
      s.el.appendChild(s.track);

      s.btn = el('button', 'reel-toggle');
      s.btn.type = 'button';
      s.btn.setAttribute('aria-controls', s.el.id);
      s.apply = apply || function (open) {
        s.el.classList.toggle('is-open', open);
        if (open) s.track.style.transform = '';
      };
      head.classList.add('reel-head');
      head.appendChild(s.btn);
      s.btn.addEventListener('click', function () { setOpen(s, !s.open); });
      s.btn.setAttribute('aria-expanded', 'false');
      s.btn.textContent = labels[0];

      function pause() { s.paused = true; }
      function resume() { s.paused = false; }
      s.el.addEventListener('mouseenter', pause);
      s.el.addEventListener('mouseleave', resume);
      s.el.addEventListener('focusin', pause);
      s.el.addEventListener('focusout', resume);

      reels.push(s);
      return s;
    }

    // Texte : chaque liste « libellé / description » qui suit un titre de bloc.
    document.querySelectorAll('.project-page .featured-block-title + .spec-list').forEach(function (list) {
      var head = list.previousElementSibling;
      var placeholder = el('div');
      list.parentNode.insertBefore(placeholder, list);
      var s = createReel('y', list, head, ['Déplier ↓', 'Réduire ↑']);
      placeholder.replaceWith(s.el);
    });

    // Captures : tous les groupes d'une colonne réunis dans un bandeau ; « Tout afficher » rend les groupes.
    document.querySelectorAll('.project-page .featured-grid > div').forEach(function (col) {
      var groups = Array.prototype.slice.call(col.querySelectorAll(':scope > .kitchup-group'));
      if (!groups.length) return;

      var items = el('div', 'reel-items');
      var total = 0;
      groups.forEach(function (g) {
        var groupTitle = g.querySelector('.kitchup-group-title');
        var label = groupTitle ? groupTitle.textContent : '';
        g.querySelectorAll('figure').forEach(function (fig) {
          var link = fig.querySelector('a');
          var img = fig.querySelector('img');
          var cap = fig.querySelector('figcaption');
          if (!link || !img) return;
          var a = el('a', 'reel-shot');
          a.href = link.getAttribute('href');
          a.target = '_blank';
          a.rel = 'noopener';
          var frame = el('span', 'reel-shot-frame');
          var im = el('img');
          im.src = img.getAttribute('src');
          im.alt = img.alt;
          im.loading = 'lazy';
          im.decoding = 'async';
          frame.appendChild(im);
          var c = el('span', 'reel-cap');
          var gl = el('span', 'reel-group');
          gl.textContent = label;
          c.appendChild(gl);
          c.appendChild(document.createTextNode(cap ? cap.textContent : ''));
          a.appendChild(frame);
          a.appendChild(c);
          items.appendChild(a);
          total++;
        });
      });

      var head = el('div', 'featured-block-title gallery-head');
      head.textContent = 'CAPTURES · ' + total;
      var full = el('div', 'gallery-full');
      full.hidden = true;
      groups[0].parentNode.insertBefore(head, groups[0]);
      groups.forEach(function (g) { full.appendChild(g); });

      var s = createReel('x', items, head, ['Tout afficher ↓', 'Réduire ↑'], function (open) {
        s.el.hidden = open;
        full.hidden = !open;
      });
      head.after(s.el);
      s.el.after(full);
      full.id = s.el.id + '-full';
      s.btn.setAttribute('aria-controls', s.el.id + ' ' + full.id);
    });

    if (!reels.length) return;

    // Les captures ne se chargent qu'une fois le bandeau à l'écran, puis toutes d'un coup
    // pour qu'elles soient prêtes avant d'entrer dans la zone visible.
    var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var s = reels.filter(function (r) { return r.el === entry.target; })[0];
        if (!s) return;
        s.inView = entry.isIntersecting;
        if (!s.inView) return;
        if (!s.loaded && s.axis === 'x') {
          s.el.querySelectorAll('img').forEach(function (i) { i.loading = 'eager'; });
          s.loaded = true;
        }
        measure(s);
      });
    }, { rootMargin: '200px 0px' }) : null;

    reels.forEach(function (s) {
      if (observer) observer.observe(s.el); else { s.inView = true; measure(s); }
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { reels.forEach(function (s) { if (s.inView) measure(s); }); }, 150);
    });

    // Les images qui finissent de charger changent la largeur du bandeau.
    document.addEventListener('load', function (e) {
      if (e.target.tagName !== 'IMG') return;
      reels.forEach(function (s) { if (s.axis === 'x' && s.inView && s.el.contains(e.target)) measure(s); });
    }, true);

    if (reduceMotion) return;

    var last = 0;
    function tick(t) {
      var dt = last ? Math.min(64, t - last) : 0;
      last = t;
      reels.forEach(function (s) {
        if (s.open || s.fits || s.paused || !s.inView) return;
        var length = s.axis === 'y' ? s.copy.offsetHeight : s.copy.offsetWidth;
        if (!length) return;
        s.offset = (s.offset + SPEED[s.axis] * dt / 1000) % length;
        var d = -s.offset.toFixed(2);
        s.track.style.transform = s.axis === 'y' ? 'translate3d(0,' + d + 'px,0)' : 'translate3d(' + d + 'px,0,0)';
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

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
    var target = parseHash();
    var initial = target.page;
    if (!initial) {
      try { initial = localStorage.getItem('portfolio-page'); } catch (e) {}
      if (PAGES.indexOf(initial) === -1) initial = 'accueil';
      history.replaceState(null, '', '#' + initial);
    }
    currentProject = null;
    showProject(target.project || PROJECTS[0], { instant: true, syncHash: initial === 'projets' });
    go(initial, { skipScroll: true, skipTyping: true });
    if (initial === 'accueil') startTyping();
  })();
})();
