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

/* ---- hero-b ---- */
(function () {
  window.CM.register('hero-b', function init(ctx) {
    var section = document.querySelector('.section-hero-b');
    if (!section) return;
    var reveals = section.querySelectorAll('[data-reveal]');
    var words = section.querySelectorAll('.hero-b-word');
    var path = section.querySelector('.hero-b-path');
    var holds = section.querySelectorAll('.hero-b-hold');
    if (ctx.reduced || !ctx.gsap) {
      for (var i = 0; i < reveals.length; i++) reveals[i].style.opacity = '1';
      return;
    }
    var gsap = ctx.gsap, ST = ctx.ScrollTrigger;
    var len = path ? path.getTotalLength() : 0;
    if (path) { path.style.strokeDasharray = len; path.style.strokeDashoffset = len; }
    gsap.set(reveals, { opacity: 0, y: 24 });
    gsap.set(words, { opacity: 0, y: 30 });
    gsap.set(holds, { opacity: 0, transformOrigin: '50% 50%', scale: .6 });
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(section.querySelector('.eyebrow'), { opacity: 1, y: 0, duration: .6 }, 0)
      .to(section.querySelector('h1'), { opacity: 1, y: 0, duration: .01 }, .1)
      .to(words, { opacity: 1, y: 0, duration: .8, stagger: .14 }, .15)
      .to(section.querySelectorAll('.lead, .btn-row, .hero-meta, .hero-scroll'), { opacity: 1, y: 0, duration: .7, stagger: .08 }, .6)
      .to(holds[0] ? [holds[0], holds[1]] : [], { opacity: .9, scale: 1, duration: .5 }, .3);
    if (path) tl.to(path, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' }, .4);
    if (holds[2]) tl.to(holds[2], { opacity: 1, scale: 1, duration: .4 }, 2.1);
    // scroll: the line and grid drift up slower than the page (parallax), text eases away
    if (ST && window.matchMedia('(min-width: 900px)').matches) {
      gsap.to(section.querySelector('.hero-line-art'), { y: -80, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(section.querySelector('.hero-text'), { y: -30, opacity: .35, ease: 'none', scrollTrigger: { trigger: section, start: '40% top', end: 'bottom top', scrub: true } });
    }
  });
})();

/* ---- why ---- */
(function () {
  window.CM.register('why', function init(ctx) {
    var section = document.querySelector('.section-why');
    if (!section) return;
    var items = section.querySelectorAll('[data-reveal]');
    if (ctx.reduced || !ctx.gsap || !ctx.ScrollTrigger) { for (var i = 0; i < items.length; i++) items[i].style.opacity = '1'; return; }
    ctx.gsap.set(items, { opacity: 0, y: 24 });
    ctx.ScrollTrigger.batch(items, {
      start: 'top 85%', once: true,
      onEnter: function (batch) { ctx.gsap.to(batch, { opacity: 1, y: 0, duration: .7, ease: 'power2.out', stagger: .1 }); }
    });
  });
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
