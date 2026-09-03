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
    // manners tiles pop in (a different move from the fades): scale up with a short settle, icons swing in
    var tiles = section.querySelectorAll('.establishers-manners-list li');
    if (tiles.length) {
      gsap.set(tiles, { opacity: 0, scale: .86, y: 14, transformOrigin: '50% 60%' });
      gsap.set(section.querySelectorAll('.manners-icon'), { rotate: -25, transformOrigin: '50% 50%' });
      ST.create({ trigger: section.querySelector('.establishers-manners-list'), start: 'top 82%', once: true, onEnter: function () {
        gsap.to(tiles, { opacity: 1, scale: 1, y: 0, duration: .6, ease: 'back.out(1.6)', stagger: .11 });
        gsap.to(section.querySelectorAll('.manners-icon'), { rotate: 0, duration: .7, ease: 'back.out(2)', stagger: .11, delay: .1 });
      } });
    }
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
