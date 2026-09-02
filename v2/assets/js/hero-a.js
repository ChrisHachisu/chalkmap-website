(function () {
  window.CM.register('hero-a', function init(ctx) {
    var section = document.querySelector('.section-hero-a');
    if (!section) return;
    var reveals = section.querySelectorAll('[data-reveal]');
    var front = section.querySelector('.hero-card--front');
    var back = section.querySelector('.hero-card--back');
    var chips = section.querySelectorAll('.hero-chip');
    if (ctx.reduced || !ctx.gsap) {
      for (var i = 0; i < reveals.length; i++) reveals[i].style.opacity = '1';
      return;
    }
    var gsap = ctx.gsap, ST = ctx.ScrollTrigger;
    // load sequence
    gsap.set(reveals, { opacity: 0, y: 22 });
    gsap.set([back, front], { opacity: 0, y: 40, rotateY: -10, transformPerspective: 1200 });
    gsap.set(chips, { opacity: 0, y: 10 });
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(reveals, { opacity: 1, y: 0, duration: .8, stagger: .09 }, 0)
      .to(back, { opacity: .8, y: 0, rotateY: 0, duration: 1 }, .25)
      .to(front, { opacity: 1, y: 0, rotateY: 0, duration: 1 }, .4)
      .to(chips, { opacity: 1, y: 0, duration: .6, stagger: .12 }, .9);
    // scroll: layers drift at different rates (2.5D), section content eases away
    if (ST && window.matchMedia('(min-width: 900px)').matches) {
      gsap.to(front, { y: -70, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(back, { y: -30, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(section.querySelector('.hero-text'), { y: -24, opacity: .4, ease: 'none', scrollTrigger: { trigger: section, start: '40% top', end: 'bottom top', scrub: true } });
    }
  });
})();
