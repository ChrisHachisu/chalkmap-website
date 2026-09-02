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
