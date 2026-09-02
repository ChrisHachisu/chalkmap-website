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
