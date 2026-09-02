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
