(function () {
  window.CM.register('hero-b', function init(ctx) {
    var section = document.querySelector('.section-hero-b');
    if (!section) return;
    var reveals = section.querySelectorAll('[data-reveal]');
    var words = section.querySelectorAll('.hero-b-word');
    var desktopNow = window.matchMedia('(min-width: 900px)').matches;
    var art = section.querySelector(desktopNow ? '.hero-line-art:not(.hero-line-art--mobile)' : '.hero-line-art--mobile');
    var path = art ? art.querySelector('.hero-b-path') : null;
    var holds = art ? art.querySelectorAll('.hero-b-hold') : [];
    if (ctx.reduced || !ctx.gsap) {
      for (var i = 0; i < reveals.length; i++) reveals[i].style.opacity = '1';
      return;
    }
    var gsap = ctx.gsap, ST = ctx.ScrollTrigger;
    var len = path ? path.getTotalLength() : 0;
    if (path) { path.style.strokeDasharray = len; path.style.strokeDashoffset = len; }
    gsap.set(reveals, { opacity: 0, y: 24 });
    gsap.set(words, { opacity: 0, y: 30 });
    gsap.set(holds, { opacity: 0, transformOrigin: '50% 50%', scale: .6 });
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(section.querySelector('.eyebrow'), { opacity: 1, y: 0, duration: .6 }, 0)
      .to(section.querySelector('h1'), { opacity: 1, y: 0, duration: .01 }, .1)
      .to(words, { opacity: 1, y: 0, duration: .8, stagger: .14 }, .15)
      .to(section.querySelectorAll('.lead, .btn-row, .hero-meta, .hero-scroll'), { opacity: 1, y: 0, duration: .7, stagger: .08 }, .6)
      .to(holds[0] ? [holds[0]] : [], { opacity: .9, scale: 1, duration: .5 }, .3);
    if (path) tl.to(path, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' }, .4);
    if (holds[1]) tl.to(holds[1], { opacity: 1, scale: 1, duration: .4 }, 2.1);
    // scroll: the line and grid drift up slower than the page (parallax), text eases away
    var cue = section.querySelector('.hero-scroll');
    if (ST && cue) gsap.to(cue, { opacity: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: '30% top', scrub: true } });
    if (ST && window.matchMedia('(min-width: 900px)').matches) {
      gsap.to(art, { y: -80, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(section.querySelector('.hero-text'), { y: -30, opacity: .35, ease: 'none', scrollTrigger: { trigger: section, start: '40% top', end: 'bottom top', scrub: true } });
    }
  });
})();
