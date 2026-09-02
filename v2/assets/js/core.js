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
