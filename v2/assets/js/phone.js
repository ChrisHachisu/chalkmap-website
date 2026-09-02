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
