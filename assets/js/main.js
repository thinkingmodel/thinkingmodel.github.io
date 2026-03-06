/**
 * THE THINKING MODEL — Cosmic Editorial Luxury
 * Main JS Engine — vanilla, zero dependencies
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     UTILITY: reduced-motion check
  ───────────────────────────────────────── */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────────────────────────────────────
     STAR FIELD CANVAS
  ───────────────────────────────────────── */
  function initStarfield() {
    var canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, stars = [], shootingStar = null, shootTimer;

    function resize() {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      buildStars();
    }

    function buildStars() {
      stars = [];
      var count = Math.floor(W * H / 4000);
      count = Math.max(100, Math.min(count, 300));
      for (var i = 0; i < count; i++) {
        var layer = Math.floor(Math.random() * 3); // 0=far, 1=mid, 2=near
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          ox: 0, oy: 0,
          r: layer === 0 ? Math.random() * .6 + .3 :
             layer === 1 ? Math.random() * .9 + .5 :
                           Math.random() * 1.4 + .8,
          base: layer === 0 ? Math.random() * .35 + .1 :
                layer === 1 ? Math.random() * .5 + .2 :
                              Math.random() * .6 + .3,
          speed: Math.random() * .015 + .004,
          phase: Math.random() * Math.PI * 2,
          layer: layer,
          drift: (Math.random() - .5) * .06
        });
      }
    }

    var mouseX = 0, mouseY = 0;
    var targetMX = 0, targetMY = 0;
    document.addEventListener('mousemove', function (e) {
      targetMX = (e.clientX / window.innerWidth  - .5) * 2;
      targetMY = (e.clientY / window.innerHeight - .5) * 2;
    });

    var tick = 0;
    function lerp(a, b, t) { return a + (b - a) * t; }

    function spawnShootingStar() {
      shootingStar = {
        x: Math.random() * W * .6 + W * .1,
        y: Math.random() * H * .3,
        vx: Math.random() * 3 + 2,
        vy: Math.random() * 2 + 1,
        len: Math.random() * 120 + 80,
        alpha: 1, life: 60
      };
    }

    function scheduleShootingStar() {
      clearTimeout(shootTimer);
      shootTimer = setTimeout(function () {
        if (!prefersReducedMotion) spawnShootingStar();
        scheduleShootingStar();
      }, Math.random() * 8000 + 4000);
    }

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      tick += 1;

      // Smooth mouse parallax
      mouseX = lerp(mouseX, targetMX, .04);
      mouseY = lerp(mouseY, targetMY, .04);

      // Draw stars
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = s.base + .2 * Math.sin(tick * s.speed + s.phase);
        var parallax = [8, 20, 40][s.layer];
        var px = s.x + mouseX * parallax;
        var py = s.y + mouseY * parallax;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232,230,240,' + Math.max(0, Math.min(1, alpha)).toFixed(3) + ')';
        ctx.fill();
      }

      // Shooting star
      if (shootingStar) {
        var ss = shootingStar;
        ss.x += ss.vx; ss.y += ss.vy;
        ss.alpha -= 1 / ss.life;
        if (ss.alpha <= 0) { shootingStar = null; }
        else {
          var grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * 20, ss.y - ss.vy * 20);
          grad.addColorStop(0, 'rgba(167,139,250,' + ss.alpha.toFixed(2) + ')');
          grad.addColorStop(1, 'rgba(167,139,250,0)');
          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(ss.x - ss.vx * 20, ss.y - ss.vy * 20);
          ctx.strokeStyle = grad;
          ctx.lineWidth = ss.alpha * 1.5;
          ctx.stroke();
        }
      }
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
    scheduleShootingStar();
  }

  /* ─────────────────────────────────────────
     CURSOR TRAIL
  ───────────────────────────────────────── */
  function initCursorTrail() {
    if (prefersReducedMotion) return;
    if (window.innerWidth < 769) return;

    var canvas = document.getElementById('cursor-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    var dots = [], MAX = 14;
    var mx = -200, my = -200;

    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    window.addEventListener('resize', function () {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    });

    function drawTrail() {
      requestAnimationFrame(drawTrail);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      dots.unshift({ x: mx, y: my });
      if (dots.length > MAX) dots.length = MAX;

      for (var i = 0; i < dots.length; i++) {
        var t = 1 - i / MAX;
        var r = t * 3.5;
        var alpha = t * 0.35;
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, r, 0, Math.PI * 2);
        var hue = 250 + i * 3;
        ctx.fillStyle = 'hsla(' + hue + ',80%,75%,' + alpha.toFixed(2) + ')';
        ctx.fill();
      }
    }
    drawTrail();
  }

  /* ─────────────────────────────────────────
     MAGNETIC CARD TILT
  ───────────────────────────────────────── */
  function initCardTilt() {
    if (prefersReducedMotion) return;
    if (window.innerWidth < 769) return;

    var cards = document.querySelectorAll('.post-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width  / 2;
        var cy = rect.top  + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width  / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);
        var rx = dy * -3;
        var ry = dx *  3;
        card.style.transform = 'translateY(-6px) perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1), box-shadow .5s ease';
      });
      card.addEventListener('mouseenter', function () {
        card.style.transition = 'transform .15s ease, box-shadow .5s ease';
      });
    });
  }

  /* ─────────────────────────────────────────
     MAGNETIC BUTTONS
  ───────────────────────────────────────── */
  function initMagneticButtons() {
    if (prefersReducedMotion) return;
    var btns = document.querySelectorAll('.subscribe-btn, .comments-trigger');
    btns.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) * .22;
        var dy = (e.clientY - cy) * .22;
        btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        btn.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
      });
    });
  }

  /* ─────────────────────────────────────────
     SCROLL REVEAL
  ───────────────────────────────────────── */
  function initScrollReveal() {
    if (!window.IntersectionObserver) return;
    var elements = document.querySelectorAll('ol.post-card-box li, .list-item, .author-box, .recent-box');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var siblings = Array.from(entry.target.parentNode.children);
          var idx = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = (idx * 0.07) + 's';
          entry.target.classList.add('reveal', 'visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ─────────────────────────────────────────
     READING PROGRESS BAR
  ───────────────────────────────────────── */
  function initReadingProgressBar() {
    var bar = document.getElementById('reading-progress-bar');
    if (!bar) return;
    var article = document.querySelector('.page-content') || document.querySelector('article');
    if (!article) return;
    function update() {
      var rect = article.getBoundingClientRect();
      var total = article.offsetHeight - window.innerHeight;
      var scrolled = -rect.top;
      var pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ─────────────────────────────────────────
     STICKY HEADER SHRINK
  ───────────────────────────────────────── */
  function initStickyHeader() {
    var header = document.querySelector('.main-header');
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 60) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─────────────────────────────────────────
     AUTO COPYRIGHT YEAR
  ───────────────────────────────────────── */
  function initCopyrightYear() {
    var el = document.getElementById('copyright-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ─────────────────────────────────────────
     COPY CODE BUTTONS
  ───────────────────────────────────────── */
  function initCopyCodeButtons() {
    var blocks = document.querySelectorAll('pre');
    blocks.forEach(function (block) {
      var btn = document.createElement('button');
      btn.textContent = 'Copy';
      btn.style.cssText = [
        'position:absolute','top:.6rem','right:.6rem',
        'font-family:var(--font-mono)','font-size:.6rem',
        'letter-spacing:.1em','text-transform:uppercase',
        'background:rgba(167,139,250,.15)','color:var(--nebula)',
        'border:1px solid rgba(167,139,250,.3)','border-radius:4px',
        'padding:3px 10px','cursor:pointer','transition:all .25s'
      ].join(';');
      block.style.position = 'relative';
      block.appendChild(btn);
      btn.addEventListener('click', function () {
        var code = block.querySelector('code') || block;
        navigator.clipboard.writeText(code.innerText.trim()).then(function () {
          btn.textContent = '✓ Copied';
          btn.style.color = 'var(--pulsar)';
          btn.style.borderColor = 'var(--pulsar)';
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.style.color = 'var(--nebula)';
            btn.style.borderColor = 'rgba(167,139,250,.3)';
          }, 2000);
        });
      });
    });
  }

  /* ─────────────────────────────────────────
     POST CARD NUMBERS (decorative watermarks)
  ───────────────────────────────────────── */
  function initCardNumbers() {
    var cards = document.querySelectorAll('ol.post-card-box li');
    cards.forEach(function (li, i) {
      var num = document.createElement('span');
      num.className = 'post-card-number';
      num.textContent = String(i + 1).padStart(2, '0');
      var card = li.querySelector('.post-card');
      if (card) card.appendChild(num);
    });
  }

  /* ─────────────────────────────────────────
     TABLE OF CONTENTS GENERATOR
  ───────────────────────────────────────── */
  function initTOC() {
    var tocEl = document.getElementById('toc-generated');
    if (!tocEl) return;
    var article = document.querySelector('.page-content');
    if (!article) return;
    var headings = article.querySelectorAll('h2, h3');
    if (headings.length < 3) { tocEl.style.display = 'none'; return; }
    var ul = document.createElement('ul');
    ul.className = 'toc-content';
    headings.forEach(function (h, i) {
      if (!h.id) h.id = 'toc-h-' + i;
      var li = document.createElement('li');
      li.className = h.tagName === 'H2' ? 'toc-item-1' : 'toc-item-2';
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });
    tocEl.appendChild(ul);

    // Highlight active section
    if (!window.IntersectionObserver) return;
    var links = tocEl.querySelectorAll('a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.parentNode.classList.remove('active'); });
          var active = tocEl.querySelector('a[href="#' + entry.target.id + '"]');
          if (active) active.parentNode.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach(function (h) { io.observe(h); });
  }

  /* ─────────────────────────────────────────
     LAZY IMAGES
  ───────────────────────────────────────── */
  function initLazyImages() {
    var imgs = document.querySelectorAll('img:not([loading])');
    imgs.forEach(function (img) { img.setAttribute('loading', 'lazy'); });
  }

  /* ─────────────────────────────────────────
     BACK TO TOP
  ───────────────────────────────────────── */
  function initBackToTop() {
    var btn = document.querySelector('.top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─────────────────────────────────────────
     HERO CANVAS INJECTION (homepage)
  ───────────────────────────────────────── */
  function initHeroCanvas() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (document.getElementById('starfield-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'starfield-canvas';
    hero.prepend(canvas);
  }

  /* ─────────────────────────────────────────
     BOOT
  ───────────────────────────────────────── */
  function boot() {
    initHeroCanvas();
    initStarfield();
    initCursorTrail();
    initCardTilt();
    initMagneticButtons();
    initScrollReveal();
    initReadingProgressBar();
    initStickyHeader();
    initCopyrightYear();
    initCopyCodeButtons();
    initCardNumbers();
    initTOC();
    initLazyImages();
    initBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
