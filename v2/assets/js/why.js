(function () {
  window.CM.register('why', function init(ctx) {
    var section = document.querySelector('.section-why');
    if (!section) return;
    var items = section.querySelectorAll('[data-reveal]');
    if (ctx.reduced || !ctx.gsap || !ctx.ScrollTrigger) { for (var i = 0; i < items.length; i++) items[i].style.opacity = '1'; return; }
    ctx.gsap.set(items, { opacity: 0, y: 24 });
    ctx.ScrollTrigger.batch(items, {
      start: 'top 85%', once: true,
      onEnter: function (batch) { ctx.gsap.to(batch, { opacity: 1, y: 0, duration: .7, ease: 'power2.out', stagger: .1 }); }
    });
  });
})();
