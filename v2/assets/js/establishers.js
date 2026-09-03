(function () {
  window.CM.register('establishers', function init(ctx) {
    var section = document.querySelector('.section-establishers');
    if (!section) return;
    var reveals = section.querySelectorAll('[data-est-reveal]');
    var steps = section.querySelectorAll('[data-ladder-step]');
    var fill = section.querySelector('[data-ladder-fill]');
    var ladder = section.querySelector('[data-ladder]');
    var mobile = window.matchMedia('(max-width: 899px)').matches;
    function allOn() {
      for (var i = 0; i < steps.length; i++) steps[i].classList.add('is-on');
      if (fill) { fill.style.width = '100%'; fill.style.height = '100%'; }
      for (var r = 0; r < reveals.length; r++) reveals[r].style.opacity = '1';
    }
    if (ctx.reduced || !ctx.gsap || !ctx.ScrollTrigger) { allOn(); return; }
    var gsap = ctx.gsap, ST = ctx.ScrollTrigger;
    // slow reveals: the quiet chapter
    gsap.set(reveals, { opacity: 0, y: 28 });
    ST.batch(reveals, { start: 'top 85%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: 'power2.out', stagger: .12 }); } });
    // the ladder fills and lights each state in turn as it comes into view
    if (ladder && fill) {
      var prop = mobile ? 'height' : 'width';
      var state = { p: 0 };
      gsap.to(state, {
        p: 1, ease: 'none',
        scrollTrigger: { trigger: ladder, start: 'top 75%', end: 'bottom 45%', scrub: .6 },
        onUpdate: function () {
          fill.style[prop] = (state.p * 100) + '%';
          for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('is-on', state.p >= (i + .5) / steps.length);
        }
      });
      gsap.from(steps, { opacity: 0, y: 16, duration: .7, ease: 'power2.out', stagger: .1, scrollTrigger: { trigger: ladder, start: 'top 80%', once: true } });
    }
  });
})();
