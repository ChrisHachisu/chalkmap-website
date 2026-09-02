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
