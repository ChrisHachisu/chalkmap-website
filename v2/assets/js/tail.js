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
