(function () {
  'use strict';

  function buildPath(points, w, h) {
    if (!points || !points.length) return '';
    var d = 'M' + (points[0].x * w).toFixed(2) + ',' + (points[0].y * h).toFixed(2);
    for (var k = 1; k < points.length; k++) {
      var prev = points[k - 1];
      var cur = points[k];
      var c1 = prev.cp2 ? { x: prev.cp2.x * w, y: prev.cp2.y * h } : { x: prev.x * w, y: prev.y * h };
      var c2 = cur.cp1 ? { x: cur.cp1.x * w, y: cur.cp1.y * h } : { x: cur.x * w, y: cur.y * h };
      d += ' C' + c1.x.toFixed(2) + ',' + c1.y.toFixed(2) + ' ' +
        c2.x.toFixed(2) + ',' + c2.y.toFixed(2) + ' ' +
        (cur.x * w).toFixed(2) + ',' + (cur.y * h).toFixed(2);
    }
    return d;
  }

  function svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function init(ctx) {
    var section = document.getElementById('lines');
    if (!section) return;

    var stage = section.querySelector('.lines-stage');
    var svg = section.querySelector('.lines-svg');
    var labelsWrap = section.querySelector('.lines-labels');
    var parallax = section.querySelector('.lines-parallax');
    var header = section.querySelector('.lines-header');
    if (!stage || !svg || !labelsWrap || !parallax) return;

    var gsap = ctx && ctx.gsap;
    var ScrollTrigger = ctx && ctx.ScrollTrigger;
    var reduced = !!(ctx && ctx.reduced);
    var lang = (ctx && ctx.lang) || 'en';

    // header reveal (independent of line data — must work even if fetch fails)
    var headerNodes = header
      ? [].slice.call(header.querySelectorAll('.lines-eyebrow, .lines-heading, .lines-lead'))
      : [];

    if (gsap && !reduced && headerNodes.length) {
      gsap.set(headerNodes, { opacity: 0, y: 24 });
      gsap.to(headerNodes, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          once: true
        }
      });
    }

    fetch('assets/data/lines.json')
      .then(function (res) {
        if (!res.ok) throw new Error('lines.json ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var set = data && data.lines;
        if (!set || !set.problems || !set.problems.length) return;

        var w = set.w || 4032;
        var h = set.h || 3024;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        var strokeW = w * 0.0045;
        var holdR = w * 0.009;

        var pathEls = [];
        var labelEls = [];

        set.problems.forEach(function (problem) {
          var d = buildPath(problem.points, w, h);
          if (!d) return;

          var path = svgEl('path');
          path.setAttribute('class', 'line-path');
          path.setAttribute('d', d);
          path.setAttribute('stroke-width', strokeW.toFixed(2));
          svg.appendChild(path);
          pathEls.push(path);

          var holds = problem.starting_holds || [];
          for (var i = 0; i < holds.length; i++) {
            var hold = holds[i];
            if (!hold) continue;
            var circle = svgEl('circle');
            circle.setAttribute('class', 'line-hold');
            circle.setAttribute('cx', (hold.x * w).toFixed(2));
            circle.setAttribute('cy', (hold.y * h).toFixed(2));
            circle.setAttribute('r', holdR.toFixed(2));
            circle.setAttribute('stroke-width', strokeW.toFixed(2));
            svg.appendChild(circle);
          }

          var anchor = holds[0] || (problem.points && problem.points[0]);
          if (anchor) {
            var label = document.createElement('div');
            label.className = 'line-label';
            label.style.left = (anchor.x * 100).toFixed(3) + '%';
            label.style.top = (anchor.y * 100).toFixed(3) + '%';
            label.setAttribute('data-en', problem.name_romaji || '');
            label.setAttribute('data-ja', problem.name_ja || '');
            label.textContent = lang === 'ja' ? (problem.name_ja || '') : (problem.name_romaji || '');
            labelsWrap.appendChild(label);
            labelEls.push(label);
          }
        });

        if (!pathEls.length) return;

        if (reduced || !gsap) {
          // static, fully drawn, labels visible — no dash animation needed
          return;
        }

        // measure lengths once attached to the DOM
        var lengths = pathEls.map(function (p) {
          return p.getTotalLength();
        });

        pathEls.forEach(function (p, i) {
          p.style.strokeDasharray = lengths[i];
          p.style.strokeDashoffset = lengths[i];
        });
        gsap.set(labelEls, { opacity: 0, y: 6 });

        var play = function () {
          var tl = gsap.timeline();
          pathEls.forEach(function (p, i) {
            var t = i * 0.15;
            tl.to(p, { strokeDashoffset: 0, duration: 1, ease: 'power2.out' }, t);
            if (labelEls[i]) {
              tl.to(labelEls[i], { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, t + 0.6);
            }
          });
        };

        if (ScrollTrigger) {
          ScrollTrigger.create({
            trigger: stage,
            start: 'top 78%',
            once: true,
            onEnter: play
          });
        } else {
          play();
        }
      })
      .catch(function () {
        // JSON missing/unreachable — photo + header still render sensibly without the overlay
      });

    // slow parallax on the photo layer, independent of the line data fetch
    if (gsap && ScrollTrigger && !reduced) {
      gsap.fromTo(
        parallax,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: stage,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    }

    if (ctx && typeof ctx.onLang === 'function') {
      ctx.onLang(function (newLang) {
        lang = newLang;
        var labels = labelsWrap.querySelectorAll('.line-label');
        for (var i = 0; i < labels.length; i++) {
          var el = labels[i];
          el.textContent = newLang === 'ja'
            ? (el.getAttribute('data-ja') || '')
            : (el.getAttribute('data-en') || '');
        }
      });
    }
  }

  if (window.CM && typeof window.CM.register === 'function') {
    window.CM.register('lines', init);
  }
})();
