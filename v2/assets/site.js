/* ChalkMap website v2 — shell runtime: section registry, language, smooth scroll, header. Loads FIRST. */
(function () {
  var CM = window.CM = window.CM || {};
  var sections = [];
  var langListeners = [];
  CM.register = function (name, init) { sections.push({ name: name, init: init }); };
  CM.sections = sections;

  var TITLES = { en: 'ChalkMap: The hub for outdoor bouldering', ja: 'ChalkMap: 外岩ボルダリングのハブ' };
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  document.documentElement.classList.add('js');
  if (reduced) document.documentElement.classList.add('reduced');

  function setLang(lang) {
    document.documentElement.lang = lang;
    document.body.setAttribute('data-lang', lang);
    var els = document.querySelectorAll('[data-en]');
    for (var i = 0; i < els.length; i++) {
      var t = els[i].getAttribute('data-' + lang);
      if (t !== null) els[i].textContent = t;
    }
    var imgs = document.querySelectorAll('img[data-src-en]');
    for (var j = 0; j < imgs.length; j++) {
      var s = imgs[j].getAttribute('data-src-' + lang);
      if (s) imgs[j].src = s;
    }
    var alts = document.querySelectorAll('[data-alt-en]');
    for (var k = 0; k < alts.length; k++) {
      var a = alts[k].getAttribute('data-alt-' + lang);
      if (a !== null) alts[k].setAttribute('alt', a);
    }
    var label = document.getElementById('langLabel');
    if (label) label.textContent = (lang === 'en') ? '日本語' : 'EN';
    document.title = TITLES[lang] || TITLES.en;
    try { localStorage.setItem('cmLang', lang); } catch (e) {}
    for (var m = 0; m < langListeners.length; m++) { try { langListeners[m](lang); } catch (e) {} }
    if (window.ScrollTrigger) { setTimeout(function () { window.ScrollTrigger.refresh(); }, 60); }
  }
  CM.setLang = setLang;
  CM.getLang = function () { return document.body.getAttribute('data-lang') || 'en'; };

  function initLang() {
    var params = new URLSearchParams(location.search);
    var saved = null;
    try { saved = localStorage.getItem('cmLang'); } catch (e) {}
    var nav = (navigator.language || '').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en';
    var lang = params.get('lang') === 'ja' ? 'ja' : params.get('lang') === 'en' ? 'en' : (saved || nav);
    setLang(lang);
    var toggle = document.getElementById('langToggle');
    if (toggle) toggle.addEventListener('click', function () { setLang(CM.getLang() === 'en' ? 'ja' : 'en'); });
  }

  function initHeader() {
    var header = document.querySelector('.site-header');
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    function onScroll() { if (header) header.classList.toggle('is-solid', (window.scrollY || 0) > 24); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', function () {
        var open = navLinks.classList.toggle('active');
        navToggle.classList.toggle('active', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      var links = navLinks.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) links[i].addEventListener('click', function () {
        navLinks.classList.remove('active'); navToggle.classList.remove('active'); navToggle.setAttribute('aria-expanded', 'false');
      });
    }
  }

  function initScroll() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST) return null;
    gsap.registerPlugin(ST);
    var lenis = null;
    if (!reduced && window.Lenis) {
      try {
        lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
        lenis.on('scroll', ST.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
        // in-page anchors through Lenis
        document.addEventListener('click', function (e) {
          var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
          if (!a) return;
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var el = document.querySelector(id);
          if (!el) return;
          e.preventDefault();
          lenis.scrollTo(el, { offset: -64, duration: 1.1 });
        });
      } catch (e) { lenis = null; }
    }
    return { gsap: gsap, ScrollTrigger: ST, lenis: lenis };
  }

  function boot() {
    initLang();
    initHeader();
    var env = initScroll();
    var ctx = {
      gsap: env && env.gsap, ScrollTrigger: env && env.ScrollTrigger, lenis: env && env.lenis,
      reduced: reduced || !env, lang: CM.getLang(),
      onLang: function (fn) { langListeners.push(fn); }
    };
    CM.ctx = ctx;
    for (var i = 0; i < sections.length; i++) {
      try { sections[i].init(ctx); } catch (e) { if (window.console) console.error('section ' + sections[i].name, e); }
    }
    if (ctx.ScrollTrigger) {
      var refresh = function () { ctx.ScrollTrigger.refresh(); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      window.addEventListener('load', function () { setTimeout(refresh, 120); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ---- hero ---- */
(function () {
  'use strict';

  function init(ctx) {
    var section = document.getElementById('hero');
    if (!section) return;

    var gsap = ctx && ctx.gsap;
    var ScrollTrigger = ctx && ctx.ScrollTrigger;
    var reduced = !!(ctx && ctx.reduced);

    var media = section.querySelector('.hero-media');
    var img = section.querySelector('.hero-photo img');
    var dim = section.querySelector('.hero-dim');
    var featurePath = section.querySelector('#hero-line-egoisuto');
    var featureHold = section.querySelector('#hero-hold-egoisuto');
    var caption = section.querySelector('.hero-caption-chip');
    var secondaryGroup = section.querySelector('.hero-lines-secondary');
    var secondaryEls = secondaryGroup
      ? secondaryGroup.querySelectorAll('.hero-line, .hero-hold')
      : [];
    var textTargets = [
      section.querySelector('.hero-eyebrow'),
      section.querySelector('.hero-headline'),
      section.querySelector('.hero-sub'),
      section.querySelector('.hero-lead'),
      section.querySelector('.hero-cta'),
      section.querySelector('.hero-meta')
    ].filter(Boolean);
    var textEls = section.querySelectorAll('.hero-text');

    // Position the caption chip precisely over the feature hold using the
    // SVG's own coordinate transform, so it tracks correctly at every
    // breakpoint/crop. Falls back to the CSS-authored percentage position
    // (already set in hero.css) if anything here is unsupported.
    function positionCaption() {
      if (!featureHold || !caption || !media) return;
      try {
        var svg = featureHold.ownerSVGElement;
        if (!svg || typeof svg.createSVGPoint !== 'function') return;
        var ctm = typeof featureHold.getScreenCTM === 'function'
          ? featureHold.getScreenCTM()
          : null;
        if (!ctm) return;
        var pt = svg.createSVGPoint();
        pt.x = parseFloat(featureHold.getAttribute('cx')) || 0;
        pt.y = parseFloat(featureHold.getAttribute('cy')) || 0;
        var screenPt = pt.matrixTransform(ctm);
        var hostRect = media.getBoundingClientRect();
        var x = screenPt.x - hostRect.left;
        var y = screenPt.y - hostRect.top;
        if (isFinite(x) && isFinite(y)) {
          var vw = window.innerWidth || 0; var vh = window.innerHeight || 0;
          var offscreen = (x < 24 || x > vw - 24 || y < 24 || y > vh - 24);
          caption.style.visibility = offscreen ? 'hidden' : '';
          caption.style.left = Math.max(8, Math.min(vw - 8, x)) + 'px';
          caption.style.top = Math.max(8, Math.min(vh - 8, y)) + 'px';
          caption.style.transform = 'translate(var(--s4), calc(-1 * var(--s3)))';
        }
      } catch (e) {
        /* keep CSS fallback position */
      }
    }

    positionCaption();
    window.addEventListener('resize', positionCaption);

    if (typeof ctx.onLang === 'function') {
      try {
        ctx.onLang(function () {
          positionCaption();
        });
      } catch (e) {
        /* noop */
      }
    }

    // Reduced motion (or no gsap): leave the static, fully-drawn layout
    // that hero.css already renders by default. Nothing to animate.
    if (reduced || !gsap) return;

    // Page-load entrance stagger (independent of scroll).
    if (textEls && textEls.length) {
      try {
        gsap.set(textEls, { opacity: 0, y: 24 });
        gsap.to(textEls, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.08,
          delay: 0.15
        });
      } catch (e) {
        /* noop */
      }
    }

    if (!ScrollTrigger || typeof gsap.matchMedia !== 'function') return;

    var mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', function () {
      var len = 0;
      if (featurePath && typeof featurePath.getTotalLength === 'function') {
        try {
          len = featurePath.getTotalLength();
          gsap.set(featurePath, { strokeDasharray: len, strokeDashoffset: len });
        } catch (e) {
          len = 0;
        }
      }
      if (featureHold) gsap.set(featureHold, { opacity: 0, scale: 0.6 });
      if (caption) gsap.set(caption, { opacity: 0, y: 8 });
      if (secondaryEls.length) gsap.set(secondaryEls, { opacity: 0.85 });
      if (img) gsap.set(img, { scale: 1.06, transformOrigin: 'center center' });
      if (dim) gsap.set(dim, { opacity: 0 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () {
            return '+=' + Math.round(window.innerHeight * 0.8);
          },
          scrub: true,
          pin: true,
          anticipatePin: 1
        }
      });

      if (img) tl.to(img, { scale: 1, ease: 'none', duration: 1 }, 0);
      if (dim) tl.to(dim, { opacity: 0.35, ease: 'none', duration: 1 }, 0);
      if (textEls.length) tl.to(textEls, { y: -40, ease: 'none', duration: 1 }, 0);
      if (len) {
        tl.to(featurePath, { strokeDashoffset: 0, ease: 'none', duration: 0.6 }, 0);
      }
      if (featureHold) {
        tl.to(featureHold, { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.1 }, 0.6);
      }
      if (caption) {
        tl.to(caption, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.1 }, 0.7);
      }
      if (secondaryEls.length) {
        tl.to(secondaryEls, { opacity: 0.35, ease: 'none', duration: 0.2 }, 0.8);
      }

      return function cleanup() {
        tl.kill();
      };
    });

    mm.add('(max-width: 899.98px)', function () {
      var len = 0;
      if (featurePath && typeof featurePath.getTotalLength === 'function') {
        try {
          len = featurePath.getTotalLength();
          gsap.set(featurePath, { strokeDasharray: len, strokeDashoffset: len });
        } catch (e) {
          len = 0;
        }
      }
      if (featureHold) gsap.set(featureHold, { opacity: 0, scale: 0.6 });
      if (caption) gsap.set(caption, { opacity: 0, y: 8 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      if (len) {
        tl.to(featurePath, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' });
      }
      if (featureHold) {
        tl.to(featureHold, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3');
      }
      if (caption) {
        tl.to(caption, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
      }

      return function cleanup() {
        tl.kill();
      };
    });
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('hero', init);
  }
})();

/* ---- map ---- */
(function () {
  'use strict';

  // Japan bbox used to project crag lat/lng onto the map card (matches BUILD-SPEC §5 "map").
  var BBOX = { lngMin: 129.5, lngMax: 145.8, latMin: 31.0, latMax: 45.5 }; var FR = { l: 0.170, r: 0.804, t: 0.046, b: 0.968 }; // calibrated to japan-map.png silhouette

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function escAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function project(lat, lng) {
    var x = (FR.l + ((lng - BBOX.lngMin) / (BBOX.lngMax - BBOX.lngMin)) * (FR.r - FR.l)) * 100;
    var y = (FR.t + ((BBOX.latMax - lat) / (BBOX.latMax - BBOX.latMin)) * (FR.b - FR.t)) * 100;
    return { x: x, y: y };
  }

  function buildPinsMarkup(crags) {
    var html = '';
    for (var i = 0; i < crags.length; i++) {
      var c = crags[i] || {};
      var p = project(Number(c.lat), Number(c.lng));
      if (isNaN(p.x) || isNaN(p.y)) continue;
      html +=
        '<div class="map-pin' + (i === 0 ? ' map-pin--active' : '') + '" data-map-pin data-crag-index="' + i + '" ' +
        'style="left:' + p.x.toFixed(2) + '%;top:' + p.y.toFixed(2) + '%">' +
        '<span class="map-pin-marker"><span class="map-pin-halo" aria-hidden="true"></span><span class="map-pin-dot" aria-hidden="true"></span></span>' +
        '<span class="map-pin-label" data-en="' + escAttr(c.name_romaji) + '" data-ja="' + escAttr(c.name_ja) + '"></span>' +
        '</div>';
    }
    return html;
  }

  function init(ctx) {
    ctx = ctx || {};
    var section = document.querySelector('.section-map');
    if (!section) return;

    var gsap = ctx.gsap;
    var ScrollTrigger = ctx.ScrollTrigger;
    var reduced = !!ctx.reduced;

    var pinsContainer = section.querySelector('[data-map-pins]');
    var steps = toArray(section.querySelectorAll('[data-map-step]'));
    var observer = null;

    function currentLang() {
      if (ctx.lang) return ctx.lang;
      try {
        return (document.body && document.body.getAttribute('data-lang')) || 'en';
      } catch (e) {
        return 'en';
      }
    }

    function applyLangToPins() {
      if (!pinsContainer) return;
      var lang = currentLang();
      var labels = toArray(pinsContainer.querySelectorAll('[data-en][data-ja]'));
      labels.forEach(function (el) {
        var val = lang === 'ja' ? el.getAttribute('data-ja') : el.getAttribute('data-en');
        if (val != null) el.textContent = val;
      });
    }

    function setupPinObserver() {
      if (!pinsContainer || !steps.length) return;
      if (typeof window.IntersectionObserver !== 'function') return;
      if (observer) {
        try { observer.disconnect(); } catch (e) {}
      }
      var pins = toArray(pinsContainer.querySelectorAll('[data-map-pin]'));
      if (!pins.length) return;

      observer = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var idx = entry.target.getAttribute('data-crag-index');
          pins.forEach(function (pin) {
            var isActive = pin.getAttribute('data-crag-index') === idx;
            pin.classList.toggle('map-pin--active', isActive);
          });
        });
      }, { root: null, rootMargin: '-45% 0px -45% 0px', threshold: 0 });

      steps.forEach(function (step) { observer.observe(step); });
    }

    function refreshPinsFromData() {
      if (!pinsContainer || typeof window.fetch !== 'function') return;
      window.fetch('assets/data/crags.json')
        .then(function (res) {
          if (!res || !res.ok) throw new Error('crags.json fetch failed');
          return res.json();
        })
        .then(function (data) {
          if (!Array.isArray(data) || !data.length) return;
          var markup = buildPinsMarkup(data);
          if (!markup) return;
          pinsContainer.innerHTML = markup;
          applyLangToPins();
          setupPinObserver();
        })
        .catch(function () {
          // keep the static fallback pins already in the DOM
        });
    }

    // scroll-driven photo reveals + header reveal (skipped entirely under reduced motion:
    // the CSS-authored static layout is already fully visible and complete).
    if (!reduced && gsap && ScrollTrigger) {
      steps.forEach(function (step) {
        var photo = step.querySelector('[data-map-photo]');
        if (!photo) return;
        gsap.set(photo, { clipPath: 'inset(8% 8% 8% 8%)', opacity: 0.4 });
        gsap.to(photo, {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 78%',
            toggleActions: 'play none none reverse'
          }
        });
      });

      var header = section.querySelector('[data-map-header]');
      if (header && header.children && header.children.length) {
        var headerItems = toArray(header.children);
        gsap.set(headerItems, { y: 20, opacity: 0 });
        gsap.to(headerItems, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: header,
            start: 'top 82%'
          }
        });
      }
    }

    setupPinObserver();
    refreshPinsFromData();

    if (typeof ctx.onLang === 'function') {
      ctx.onLang(function () { applyLangToPins(); });
    }
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('map', init);
  }
})();

/* ---- phone ---- */
/* phone.js — BUILD-SPEC §5 "phone" choreography. */
(function () {
  'use strict';

  function init(ctx) {
    ctx = ctx || {};
    var gsap = ctx.gsap;
    var ScrollTrigger = ctx.ScrollTrigger;
    var reduced = !!ctx.reduced;

    var root = document.querySelector('.section-phone');
    if (!root) return;

    // Reduced motion: leave the CSS static layout exactly as authored.
    if (reduced || !gsap) return;

    var pinTarget = root.querySelector('[data-phone-pin]');
    var frame = root.querySelector('[data-phone-frame]');
    var shots = toArray(root.querySelectorAll('[data-phone-shot]'));
    var caps = toArray(root.querySelectorAll('[data-phone-cap]'));
    var mobileItems = toArray(root.querySelectorAll('[data-phone-mobile-item]'));

    if (typeof gsap.matchMedia !== 'function') return;
    var mm = gsap.matchMedia();

    // ---- Desktop: pinned frame, screenshots slide through, captions light up ----
    mm.add('(min-width: 900px)', function () {
      if (!pinTarget || !frame || shots.length < 3 || caps.length < 3) {
        return function () {};
      }

      gsap.set(frame, { transformPerspective: 1000, rotateY: 12 });
      gsap.set(shots[0], { yPercent: 0, opacity: 1 });
      gsap.set(shots[1], { yPercent: 100, opacity: 1 });
      gsap.set(shots[2], { yPercent: 100, opacity: 1 });
      gsap.set(caps[0], { opacity: 1 });
      gsap.set(caps[1], { opacity: 0.45 });
      gsap.set(caps[2], { opacity: 0.45 });

      var tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: pinTarget,
          start: 'top top',
          end: '+=250%',
          scrub: 1,
          pin: pinTarget,
          anticipatePin: 1
        }
      });

      // entry tilt
      tl.to(frame, { rotateY: 0, duration: 0.1 }, 0);

      // shot 1 -> shot 2
      tl.to(shots[0], { yPercent: -100, duration: 0.1 }, 0.34);
      tl.to(shots[1], { yPercent: 0, duration: 0.1 }, 0.34);
      tl.to(caps[0], { opacity: 0.45, duration: 0.08 }, 0.34);
      tl.to(caps[1], { opacity: 1, duration: 0.08 }, 0.34);

      // shot 2 -> shot 3
      tl.to(shots[1], { yPercent: -100, duration: 0.1 }, 0.67);
      tl.to(shots[2], { yPercent: 0, duration: 0.1 }, 0.67);
      tl.to(caps[1], { opacity: 0.45, duration: 0.08 }, 0.67);
      tl.to(caps[2], { opacity: 1, duration: 0.08 }, 0.67);

      return function () {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      };
    });

    // ---- Mobile: no pin, three small frames reveal one at a time ----
    mm.add('(max-width: 899.98px)', function () {
      if (!mobileItems.length) return function () {};

      var triggers = [];

      mobileItems.forEach(function (item) {
        gsap.set(item, { y: 24, opacity: 0 });

        triggers.push(
          ScrollTrigger.create({
            trigger: item,
            start: 'top 85%',
            onEnter: function () { reveal(item); },
            onEnterBack: function () { reveal(item); }
          })
        );
      });

      function reveal(item) {
        gsap.to(item, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' });
      }

      return function () {
        triggers.forEach(function (t) { t.kill(); });
      };
    });
  }

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList || []);
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('phone', init);
  }
})();

/* ---- features ---- */
(function () {
  'use strict';

  function init(ctx) {
    var section = document.querySelector('.section-features');
    if (!section) return;

    var gsap = ctx && ctx.gsap;
    var ScrollTrigger = ctx && ctx.ScrollTrigger;
    var reduced = !!(ctx && ctx.reduced);

    animateStats(section, gsap, ScrollTrigger, reduced);
    revealCards(section, gsap, ScrollTrigger, reduced);
  }

  function animateStats(section, gsap, ScrollTrigger, reduced) {
    var statsEl = section.querySelector('[data-features-stats]');
    if (!statsEl) return;

    var valueEls = statsEl.querySelectorAll('.stat-value[data-stat]');
    if (!valueEls.length) return;

    fetch('assets/data/stats.json')
      .then(function (res) {
        if (!res || !res.ok) throw new Error('stats fetch failed');
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        for (var i = 0; i < valueEls.length; i++) {
          setStat(valueEls[i], data, gsap, ScrollTrigger, reduced, statsEl);
        }
      })
      .catch(function () {
        /* leave the "0" placeholders already in the markup */
      });
  }

  function setStat(el, data, gsap, ScrollTrigger, reduced, statsEl) {
    var key = el.getAttribute('data-stat');
    if (!key) return;
    var target = Number(data[key]);
    if (!isFinite(target)) return;

    if (reduced || !gsap) {
      el.textContent = String(Math.round(target));
      return;
    }

    var counter = { val: 0 };
    var tweenVars = {
      val: target,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: function () {
        el.textContent = String(Math.round(counter.val));
      }
    };

    if (ScrollTrigger) {
      tweenVars.scrollTrigger = {
        trigger: statsEl,
        start: 'top 80%',
        once: true
      };
    }

    gsap.to(counter, tweenVars);
  }

  function revealCards(section, gsap, ScrollTrigger, reduced) {
    var cards = section.querySelectorAll('.feature-card');
    if (!cards.length) return;

    if (reduced || !gsap) {
      return; // static layout already visible via CSS defaults
    }

    for (var i = 0; i < cards.length; i++) {
      revealCard(cards[i], gsap, ScrollTrigger);
    }
  }

  function revealCard(card, gsap, ScrollTrigger) {
    var vars = {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    };

    if (ScrollTrigger) {
      vars.scrollTrigger = {
        trigger: card,
        start: 'top 85%',
        once: true
      };
    }

    gsap.fromTo(card, { opacity: 0, y: 24 }, vars);
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('features', init);
  }
})();

/* ---- lines ---- */
(function () {
  'use strict';

  function buildPath(points, w, h) {
    if (!points || !points.length) return '';
    var d = 'M' + (points[0].x * w).toFixed(2) + ',' + (points[0].y * h).toFixed(2);
    for (var k = 1; k < points.length; k++) {
      var prev = points[k - 1];
      var cur = points[k];
      var c1 = prev.cp2 ? { x: prev.cp2.x * w, y: prev.cp2.y * h } : { x: prev.x * w, y: prev.y * h };
      var c2 = cur.cp1 ? { x: cur.cp1.x * w, y: cur.cp1.y * h } : { x: cur.x * w, y: cur.y * h };
      d += ' C' + c1.x.toFixed(2) + ',' + c1.y.toFixed(2) + ' ' +
        c2.x.toFixed(2) + ',' + c2.y.toFixed(2) + ' ' +
        (cur.x * w).toFixed(2) + ',' + (cur.y * h).toFixed(2);
    }
    return d;
  }

  function svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function init(ctx) {
    var section = document.getElementById('lines');
    if (!section) return;

    var stage = section.querySelector('.lines-stage');
    var svg = section.querySelector('.lines-svg');
    var labelsWrap = section.querySelector('.lines-labels');
    var parallax = section.querySelector('.lines-parallax');
    var header = section.querySelector('.lines-header');
    if (!stage || !svg || !labelsWrap || !parallax) return;

    var gsap = ctx && ctx.gsap;
    var ScrollTrigger = ctx && ctx.ScrollTrigger;
    var reduced = !!(ctx && ctx.reduced);
    var lang = (ctx && ctx.lang) || 'en';

    // header reveal (independent of line data — must work even if fetch fails)
    var headerNodes = header
      ? [].slice.call(header.querySelectorAll('.lines-eyebrow, .lines-heading, .lines-lead'))
      : [];

    if (gsap && !reduced && headerNodes.length) {
      gsap.set(headerNodes, { opacity: 0, y: 24 });
      gsap.to(headerNodes, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          once: true
        }
      });
    }

    fetch('assets/data/lines.json')
      .then(function (res) {
        if (!res.ok) throw new Error('lines.json ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var set = data && data.lines;
        if (!set || !set.problems || !set.problems.length) return;

        var w = set.w || 4032;
        var h = set.h || 3024;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        var strokeW = w * 0.0045;
        var holdR = w * 0.009;

        var pathEls = [];
        var labelEls = [];

        set.problems.forEach(function (problem) {
          var d = buildPath(problem.points, w, h);
          if (!d) return;

          var path = svgEl('path');
          path.setAttribute('class', 'line-path');
          path.setAttribute('d', d);
          path.setAttribute('stroke-width', strokeW.toFixed(2));
          svg.appendChild(path);
          pathEls.push(path);

          var holds = problem.starting_holds || [];
          for (var i = 0; i < holds.length; i++) {
            var hold = holds[i];
            if (!hold) continue;
            var circle = svgEl('circle');
            circle.setAttribute('class', 'line-hold');
            circle.setAttribute('cx', (hold.x * w).toFixed(2));
            circle.setAttribute('cy', (hold.y * h).toFixed(2));
            circle.setAttribute('r', holdR.toFixed(2));
            circle.setAttribute('stroke-width', strokeW.toFixed(2));
            svg.appendChild(circle);
          }

          var anchor = holds[0] || (problem.points && problem.points[0]);
          if (anchor) {
            var label = document.createElement('div');
            label.className = 'line-label';
            label.style.left = (anchor.x * 100).toFixed(3) + '%';
            label.style.top = (anchor.y * 100).toFixed(3) + '%';
            label.setAttribute('data-en', problem.name_romaji || '');
            label.setAttribute('data-ja', problem.name_ja || '');
            label.textContent = lang === 'ja' ? (problem.name_ja || '') : (problem.name_romaji || '');
            labelsWrap.appendChild(label);
            labelEls.push(label);
          }
        });

        if (!pathEls.length) return;

        if (reduced || !gsap) {
          // static, fully drawn, labels visible — no dash animation needed
          return;
        }

        // measure lengths once attached to the DOM
        var lengths = pathEls.map(function (p) {
          return p.getTotalLength();
        });

        pathEls.forEach(function (p, i) {
          p.style.strokeDasharray = lengths[i];
          p.style.strokeDashoffset = lengths[i];
        });
        gsap.set(labelEls, { opacity: 0, y: 6 });

        var play = function () {
          var tl = gsap.timeline();
          pathEls.forEach(function (p, i) {
            var t = i * 0.15;
            tl.to(p, { strokeDashoffset: 0, duration: 1, ease: 'power2.out' }, t);
            if (labelEls[i]) {
              tl.to(labelEls[i], { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, t + 0.6);
            }
          });
        };

        if (ScrollTrigger) {
          ScrollTrigger.create({
            trigger: stage,
            start: 'top 78%',
            once: true,
            onEnter: play
          });
        } else {
          play();
        }
      })
      .catch(function () {
        // JSON missing/unreachable — photo + header still render sensibly without the overlay
      });

    // slow parallax on the photo layer, independent of the line data fetch
    if (gsap && ScrollTrigger && !reduced) {
      gsap.fromTo(
        parallax,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: stage,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    }

    if (ctx && typeof ctx.onLang === 'function') {
      ctx.onLang(function (newLang) {
        lang = newLang;
        var labels = labelsWrap.querySelectorAll('.line-label');
        for (var i = 0; i < labels.length; i++) {
          var el = labels[i];
          el.textContent = newLang === 'ja'
            ? (el.getAttribute('data-ja') || '')
            : (el.getAttribute('data-en') || '');
        }
      });
    }
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('lines', init);
  }
})();

/* ---- establishers ---- */
(function () {
  'use strict';

  function init(ctx) {
    var section = document.getElementById('establishers');
    if (!section) return;

    var gsap = ctx && ctx.gsap;
    var ScrollTrigger = ctx && ctx.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;

    // Reduced motion: leave the static layout exactly as authored, no hiding, no animating.
    if (ctx.reduced) return;

    var headerWrap = section.querySelector('.establishers-header');
    var headerEls = section.querySelectorAll('.establishers-header .eyebrow, .establishers-header h2, .establishers-intro');
    var vlabel = section.querySelector('.establishers-vlabel');
    var photos = section.querySelectorAll('.establishers-photo');
    var promiseWrap = section.querySelector('.promise-grid');
    var promiseItems = section.querySelectorAll('.promise-item');
    var mannersWrap = section.querySelector('.establishers-manners');
    var mannersEls = mannersWrap
      ? mannersWrap.querySelectorAll('h3, .establishers-manners-lead, .establishers-manners > p')
      : [];
    var mannersListWrap = section.querySelector('.establishers-manners-list');
    var mannersListItems = section.querySelectorAll('.establishers-manners-list li');
    var mannersNote = section.querySelector('.establishers-manners-note');

    function revealGroup(els, trigger, opts) {
      if (!els || !els.length || !trigger) return;
      opts = opts || {};
      gsap.set(els, { opacity: 0, y: opts.y || 24 });
      ScrollTrigger.create({
        trigger: trigger,
        start: opts.start || 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: opts.duration || 0.95,
            ease: opts.ease || 'power2.out',
            stagger: opts.stagger || 0,
            delay: opts.delay || 0
          });
        }
      });
    }

    // Header: eyebrow, headline, intro paragraph.
    revealGroup(headerEls, headerWrap, { y: 24, duration: 1.0, stagger: 0.12 });

    // Vertical rail label: slow fade, no movement (it is sticky already).
    if (vlabel) {
      gsap.set(vlabel, { opacity: 0 });
      ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        once: true,
        onEnter: function () {
          gsap.to(vlabel, { opacity: 0.85, duration: 1.1, ease: 'power2.out' });
        }
      });
    }

    // Offset photo pair: slowest reveal on the page, staggered.
    photos.forEach(function (photo, i) {
      gsap.set(photo, { opacity: 0, y: 32 });
      ScrollTrigger.create({
        trigger: photo,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(photo, { opacity: 1, y: 0, duration: 1.05, ease: 'power3.out', delay: i * 0.15 });
        }
      });
    });

    // Four promise blocks.
    revealGroup(promiseItems, promiseWrap, { y: 24, duration: 0.95, stagger: 0.1 });

    // Manners block heading / intro / lead line.
    revealGroup(mannersEls, mannersWrap, { y: 24, duration: 0.95, stagger: 0.1 });

    // Manners bullet list.
    revealGroup(mannersListItems, mannersListWrap, { y: 16, duration: 0.75, stagger: 0.08, delay: 0.2 });

    // Reporting note, last to settle.
    if (mannersNote) {
      gsap.set(mannersNote, { opacity: 0, y: 12 });
      ScrollTrigger.create({
        trigger: mannersNote,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.to(mannersNote, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.5 });
        }
      });
    }

    // JA/EN text length differs enough to shift section height; recompute trigger positions.
    if (ctx.onLang && typeof ctx.onLang === 'function') {
      ctx.onLang(function () {
        if (ScrollTrigger && typeof ScrollTrigger.refresh === 'function') {
          ScrollTrigger.refresh();
        }
      });
    }
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('establishers', init);
  }
})();

/* ---- tail ---- */
(function () {
  'use strict';

  function init(ctx) {
    var section = document.getElementById('tail');
    if (!section) return;

    var gsap = ctx && ctx.gsap;
    var ScrollTrigger = ctx && ctx.ScrollTrigger;
    var reduced = !!(ctx && ctx.reduced);
    var mm = (gsap && typeof gsap.matchMedia === 'function') ? gsap.matchMedia() : null;

    initSteps(section, gsap, ScrollTrigger, reduced, mm);
    initFaq(section, gsap, reduced, ctx);

    if (ctx && typeof ctx.onLang === 'function') {
      ctx.onLang(function () {
        // JA/EN text length differs; recompute any open FAQ answer height.
        recomputeOpenFaq(section);
      });
    }
  }

  /* -------------------------------------------------------------- steps -- */

  function initSteps(section, gsap, ScrollTrigger, reduced, mm) {
    var row = section.querySelector('[data-steps-row]');
    var fill = section.querySelector('[data-steps-fill]');
    if (!row || !fill) return;

    if (reduced || !gsap) {
      // Static complete layout: the connecting rule reads as finished.
      fill.style.transform = window.matchMedia && window.matchMedia('(max-width: 899px)').matches
        ? 'scaleY(1)' : 'scaleX(1)';
      return;
    }

    if (!ScrollTrigger) {
      fill.style.transform = 'scaleX(1)';
      return;
    }

    if (mm && typeof mm.add === 'function') {
      mm.add('(min-width: 900px)', function () {
        gsap.set(fill, { scaleX: 0 });
        var tween = gsap.to(fill, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: row,
            start: 'top 75%',
            end: 'bottom 60%',
            scrub: 0.4
          }
        });
        return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
      });
      mm.add('(max-width: 899px)', function () {
        gsap.set(fill, { scaleY: 0 });
        var tween = gsap.to(fill, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: row,
            start: 'top 80%',
            end: 'bottom 70%',
            scrub: 0.4
          }
        });
        return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
      });
    } else {
      gsap.set(fill, { scaleX: 0 });
      gsap.to(fill, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: row, start: 'top 75%', end: 'bottom 60%', scrub: 0.4 }
      });
    }

    // Steps themselves get a gentle reveal, staggered.
    var items = section.querySelectorAll('.step-item');
    if (items.length) {
      gsap.set(items, { opacity: 0, y: 20 });
      ScrollTrigger.create({
        trigger: row,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(items, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.1 });
        }
      });
    }
  }

  /* ---------------------------------------------------------------- faq -- */

  function initFaq(section, gsap, reduced, ctx) {
    var list = section.querySelector('[data-faq-list]');
    if (!list) return;
    var items = list.querySelectorAll('.faq-item');
    if (!items.length) return;

    for (var i = 0; i < items.length; i++) {
      bindFaqItem(items[i], items, gsap, reduced);
    }

    // Reveal the whole list on enter.
    if (gsap && !reduced && ctx && ctx.ScrollTrigger) {
      gsap.set(list, { opacity: 0, y: 20 });
      ctx.ScrollTrigger.create({
        trigger: list,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(list, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' });
        }
      });
    }
  }

  function bindFaqItem(item, allItems, gsap, reduced) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    var inner = item.querySelector('.faq-answer-inner');
    if (!btn || !answer || !inner) return;

    btn.addEventListener('click', function () {
      var isOpen = item.getAttribute('data-open') === 'true';
      // Close every other open item (one open at a time).
      for (var i = 0; i < allItems.length; i++) {
        if (allItems[i] !== item && allItems[i].getAttribute('data-open') === 'true') {
          closeFaqItem(allItems[i]);
        }
      }
      if (isOpen) {
        closeFaqItem(item);
      } else {
        openFaqItem(item, gsap, reduced);
      }
    });
  }

  function openFaqItem(item, gsap, reduced) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    var inner = item.querySelector('.faq-answer-inner');
    if (!btn || !answer || !inner) return;

    item.setAttribute('data-open', 'true');
    btn.setAttribute('aria-expanded', 'true');
    // Height is a plain layout toggle, set instantly (not animated) so only
    // opacity/transform are ever tweened, per the motion contract.
    answer.style.height = inner.scrollHeight + 'px';

    if (gsap && !reduced) {
      gsap.fromTo(inner, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    } else {
      inner.style.opacity = '1';
      inner.style.transform = 'none';
    }
  }

  function closeFaqItem(item) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    item.removeAttribute('data-open');
    btn.setAttribute('aria-expanded', 'false');
    answer.style.height = '0px';
  }

  function recomputeOpenFaq(section) {
    var open = section.querySelector('.faq-item[data-open="true"]');
    if (!open) return;
    var answer = open.querySelector('.faq-answer');
    var inner = open.querySelector('.faq-answer-inner');
    if (!answer || !inner) return;
    answer.style.height = inner.scrollHeight + 'px';
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('tail', init);
  } else {
    window.CM = window.CM || {};
    window.CM._pending = window.CM._pending || [];
    window.CM._pending.push(['tail', init]);
  }
})();
