(function () {
  window.CM.register('phone', function init(ctx) {
    var section = document.querySelector('.section-phone');
    if (!section) return;
    var captions = section.querySelectorAll('.phone-caption');
    var shots = section.querySelectorAll('.phone-shot');
    var buttons = section.querySelectorAll('[data-shot-btn]');
    var current = 0;
    function show(i) {
      if (i === current && shots[i] && shots[i].classList.contains('is-active')) return;
      current = i;
      for (var k = 0; k < shots.length; k++) shots[k].classList.toggle('is-active', k === i);
      for (var c = 0; c < captions.length; c++) captions[c].classList.toggle('is-active', c === i);
    }
    // tap/click a caption anywhere; keyboard works because they are buttons
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener('click', function () { show(Number(this.getAttribute('data-shot-btn'))); });
    }
    if (ctx.reduced || !ctx.ScrollTrigger) return;
    // desktop: the screen follows the caption that is nearest the middle of the viewport (no pinning, no scroll capture)
    var desktop = window.matchMedia('(min-width: 900px)').matches;
    if (!desktop) return;
    var timer = null;
    function pick() {
      var mid = window.innerHeight * .5, best = 0, bestD = Infinity;
      for (var c = 0; c < captions.length; c++) {
        var r = captions[c].getBoundingClientRect(); var d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < bestD) { bestD = d; best = c; }
      }
      show(best);
    }
    window.addEventListener('scroll', function () { if (timer) return; timer = setTimeout(function () { timer = null; pick(); }, 80); }, { passive: true });
    pick();
    // gentle entry for the frame
    ctx.gsap.from(section.querySelector('.phone-frame'), { y: 32, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 75%', once: true } });
  });
})();
