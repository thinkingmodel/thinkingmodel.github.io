/**
 * THE THINKING MODEL — Cosmic Editorial Luxury
 * Main JS Engine — vanilla, zero dependencies
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     MOBILE MENU OVERLAY
  ───────────────────────────────────────── */
  function initMenu() {
    var toggle = document.querySelector('.nav-mobile-toggle');
    var overlay = document.querySelector('.mobile-menu-overlay');
    if (!toggle || !overlay) return;

    function toggleMenu() {
      var isActive = toggle.classList.contains('active');
      if (isActive) {
        toggle.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        toggle.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Close on link click inside overlay
    overlay.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        toggleMenu();
      }
    });
  }

  /* ─────────────────────────────────────────
     PREMIUM DESKTOP NAV HOVER (Staggered letters)
  ───────────────────────────────────────── */
  function initNavHover() {
    if (prefersReducedMotion) return;
    var links = document.querySelectorAll('.nav-desktop .nav-link');
    links.forEach(function (link) {
      var text = link.textContent.trim();
      link.textContent = ''; // Clear text
      var delay = 0;
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        span.style.display = 'inline-block';
        span.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        span.style.transitionDelay = delay + 's';
        delay += 0.015;
        link.appendChild(span);
      }

      link.addEventListener('mouseenter', function () {
        var spans = link.querySelectorAll('span');
        spans.forEach(function (s) { s.style.transform = 'translateY(-2px)'; });
      });
      link.addEventListener('mouseleave', function () {
        var spans = link.querySelectorAll('span');
        spans.forEach(function (s) { s.style.transform = 'none'; });
      });
    });
  }

  /* ─────────────────────────────────────────
     SEARCH PANEL TOGGLE
  ───────────────────────────────────────── */
  function initSearch() {
    var searchIcon = document.querySelector('.search-icon a');
    var searchClose = document.querySelector('.search-icon-close');
    var searchBox = document.querySelector('.search-box');
    var searchInput = document.getElementById('search-input');
    if (!searchBox) return;

    if (searchIcon) {
      searchIcon.addEventListener('click', function (e) {
        e.preventDefault();
        searchBox.classList.add('search-active');
        if (searchInput) setTimeout(function () { searchInput.focus(); }, 200);
      });
    }
    if (searchClose) searchClose.addEventListener('click', function () {
      searchBox.classList.remove('search-active');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') searchBox.classList.remove('search-active');
    });
  }

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
      targetMX = (e.clientX / window.innerWidth - .5) * 2;
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
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    var dots = [], MAX = 14;
    var mx = -200, my = -200;

    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    window.addEventListener('resize', function () {
      canvas.width = window.innerWidth * dpr;
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
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);
        var rx = dy * -3;
        var ry = dx * 3;
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
    var elements = document.querySelectorAll('ol.post-card-box li, .list-item, .author-box, .recent-box, .post-row, .featured-post');
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
        'position:absolute', 'top:.6rem', 'right:.6rem',
        'font-family:var(--font-mono)', 'font-size:.6rem',
        'letter-spacing:.1em', 'text-transform:uppercase',
        'background:rgba(167,139,250,.15)', 'color:var(--nebula)',
        'border:1px solid rgba(167,139,250,.3)', 'border-radius:4px',
        'padding:3px 10px', 'cursor:pointer', 'transition:all .25s'
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
     SUBSCRIBE MODAL (AJAX JSONP)
  ───────────────────────────────────────── */
  function initSubscribeModal() {
    var triggers = document.querySelectorAll('.subscribe-trigger');
    var modal = document.getElementById('subscribe-modal');
    var closeBtn = document.querySelector('.subscribe-modal-close');
    var form = document.getElementById('subscribe-ajax-form');
    var msgDiv = document.getElementById('sub-ajax-msg');
    var emailInput = document.getElementById('sub-ajax-email');

    if (!modal) return;

    function openModal() {
      // Close mobile menu if it's open so they don't overlap
      var mobileNav = document.querySelector('.mobile-menu-overlay');
      if (mobileNav && mobileNav.classList.contains('active')) {
        document.querySelector('.nav-mobile-toggle').classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      }
      modal.classList.add('active');
      if (emailInput) setTimeout(function () { emailInput.focus(); }, 100);
    }

    function closeModal() {
      modal.classList.remove('active');
      if (form) form.reset();
      if (msgDiv) {
        msgDiv.textContent = '';
        msgDiv.className = 'sub-modal-message';
      }
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    if (!form || !msgDiv || !emailInput) return;

    window.mcCallback = function (res) {
      if (res.result === 'success') {
        msgDiv.textContent = 'Success! Welcome to The Thinking Model.';
        msgDiv.className = 'sub-modal-message success';
        form.reset();
        setTimeout(closeModal, 3000);
      } else {
        var msg = res.msg.replace('0 - ', '');
        var temp = document.createElement('div');
        temp.innerHTML = msg;
        msgDiv.textContent = temp.textContent || temp.innerText || 'An error occurred. Please try again.';
        msgDiv.className = 'sub-modal-message error';
      }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msgDiv.textContent = 'Subscribing...';
      msgDiv.className = 'sub-modal-message';

      var email = encodeURIComponent(emailInput.value);
      var actionUrl = form.getAttribute('action');
      if (!actionUrl) {
        msgDiv.textContent = 'Error: Mailchimp URL not configured.';
        return;
      }

      // Convert various Mailchimp URLs to the JSONP endpoint
      var url = actionUrl;
      url = url.replace(/\/subscribe\/post\?/i, '/subscribe/post-json?');
      url = url.replace(/\/post\?/i, '/post-json?');
      // If it just says /subscribe? (as in the config), change it to /subscribe/post-json?
      if (url.indexOf('post-json') === -1 && url.indexOf('/subscribe?') !== -1) {
        url = url.replace(/\/subscribe\?/i, '/subscribe/post-json?');
      }

      url += '&EMAIL=' + email + '&c=mcCallback';

      var oldScript = document.getElementById('mc-jsonp');
      if (oldScript) oldScript.remove();

      var script = document.createElement('script');
      script.id = 'mc-jsonp';
      script.src = url;
      document.body.appendChild(script);
    });
  }


  /* ─────────────────────────────────────────
     TAG & ARCHIVE PAGE LOGIC (Filtering & Sorting)
  ───────────────────────────────────────── */
  function initArchiveAndTags() {
    var container = document.getElementById('post-list-container');
    if (!container) return;

    // --- SORTING ---
    var sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Update active state
        sortBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var sortType = btn.getAttribute('data-sort');
        sortPosts(sortType);
      });
    });

    function sortPosts(type) {
      var container = document.getElementById('post-list-container');
      if (!container) return;

      // Ensure we have a master wrapper to hold sorted items
      var masterWrapper = document.getElementById('master-post-wrapper');
      if (!masterWrapper) {
        masterWrapper = document.createElement('div');
        masterWrapper.id = 'master-post-wrapper';
        masterWrapper.className = 'post-row-wrapper';
        container.appendChild(masterWrapper);
      }

      // Gather ALL .post-row elements across the page
      var allRows = Array.from(document.querySelectorAll('.post-row'));
      if (!allRows.length) return;

      // Handle Year Dividers on Archive Page
      var isArchive = window.location.pathname.indexOf('/archive.html') > -1;
      var yearGroups = document.querySelectorAll('.archive-year-group');
      var dividers = document.querySelectorAll('.archive-year-divider');

      if (isArchive) {
        if (type === 'newest') {
          // Restore default year groupings
          yearGroups.forEach(function (g) { g.style.display = 'block'; });
          dividers.forEach(function (d) { d.style.display = 'block'; });
          masterWrapper.style.display = 'none';

          // Move rows back to their original groups based on date
          allRows.forEach(function (row) {
            var dateStr = row.getAttribute('data-date');
            if (dateStr) {
              var year = new Date(parseInt(dateStr) * 1000).getFullYear();
              // Find the group header matching this year
              var groupMatch = Array.from(yearGroups).find(function (g) {
                var header = g.querySelector('.archive-year-divider');
                return header && header.textContent.trim() === String(year);
              });
              if (groupMatch) {
                var wrapper = groupMatch.querySelector('.post-row-wrapper');
                if (wrapper) wrapper.appendChild(row);
              }
            }
          });
          return; // Exit early, native grouping handles "newest" layout
        } else {
          // Hide year boundaries for global sorts (oldest, shortest, longest)
          yearGroups.forEach(function (g) { g.style.display = 'none'; });
          dividers.forEach(function (d) { d.style.display = 'none'; });
          masterWrapper.style.display = 'flex';
        }
      }

      // Global Sort
      allRows.sort(function (a, b) {
        var valA, valB;
        if (type === 'newest' || type === 'oldest') {
          valA = parseInt(a.getAttribute('data-date')) || 0;
          valB = parseInt(b.getAttribute('data-date')) || 0;
          return type === 'newest' ? valB - valA : valA - valB;
        } else if (type === 'shortest' || type === 'longest') {
          valA = parseInt(a.getAttribute('data-wordcount')) || 0;
          valB = parseInt(b.getAttribute('data-wordcount')) || 0;
          return type === 'shortest' ? valA - valB : valB - valA;
        }
        return 0;
      });

      // Append to the active wrapper
      var targetContainer = isArchive && type !== 'newest' ? masterWrapper : null;

      // If not archive, or it's a tag page, we sort within their existing groups
      if (!targetContainer) {
        var tagGroups = document.querySelectorAll('.tag-group');
        tagGroups.forEach(function (group) {
          var groupRows = Array.from(group.querySelectorAll('.post-row'));
          groupRows.sort(function (a, b) {
            var valA = type === 'shortest' || type === 'longest' ? parseInt(a.getAttribute('data-wordcount')) || 0 : parseInt(a.getAttribute('data-date')) || 0;
            var valB = type === 'shortest' || type === 'longest' ? parseInt(b.getAttribute('data-wordcount')) || 0 : parseInt(b.getAttribute('data-date')) || 0;
            if (type === 'newest' || type === 'longest') return valB - valA;
            return valA - valB;
          });
          var localWrapper = group.querySelector('.post-row-wrapper');
          groupRows.forEach(function (row) {
            if (localWrapper) localWrapper.appendChild(row);
            triggerReveal(row);
          });
        });
      } else {
        // It is archive with global sort
        allRows.forEach(function (row) {
          targetContainer.appendChild(row);
          triggerReveal(row);
        });
      }
    }

    function triggerReveal(row) {
      row.classList.remove('reveal', 'visible');
      setTimeout(function () { row.classList.add('reveal', 'visible'); }, 50);
    }

    // --- ENHANCED TAG FILTERING ---
    var isTagPage = window.location.pathname.indexOf('/tag.html') > -1;
    var isTagsPage = window.location.pathname.indexOf('/tags.html') > -1;
    var params = new URLSearchParams(window.location.search);
    var targetTag = params.get('tag');

    // On tag.html, only show the targeted tag group
    if (isTagPage && targetTag) {
      var groups = document.querySelectorAll('.tag-group');
      groups.forEach(function (g) { g.style.display = 'none'; });

      var targetGroup = document.getElementById(targetTag) || document.getElementById(decodeURIComponent(targetTag));
      if (targetGroup) {
        targetGroup.style.display = 'block';
        targetGroup.classList.remove('hidden');
      }
    }

    // Filter interactivity on tags.html
    var tagPills = document.querySelectorAll('.tag-cloud a');
    var globalEmpty = document.querySelector('.global-empty-state');

    if (isTagsPage && tagPills.length > 0) {
      tagPills.forEach(function (pill) {
        pill.addEventListener('click', function (e) {
          e.preventDefault();

          // Toggle active
          var wasActive = pill.classList.contains('active');
          tagPills.forEach(function (p) { p.classList.remove('active'); });
          if (!wasActive) pill.classList.add('active');

          var selectedTag = wasActive ? null : new URL(pill.href).searchParams.get('tag');
          var visibleGroups = 0;

          var groups = document.querySelectorAll('.tag-group');
          groups.forEach(function (g) {
            if (!selectedTag) {
              g.style.display = 'block'; // Show all
              visibleGroups++;
            } else {
              if (g.id === selectedTag || g.id === decodeURIComponent(selectedTag)) {
                g.style.display = 'block';
                visibleGroups++;
              } else {
                g.style.display = 'none';
              }
            }
          });

          // Toggle global empty state
          if (globalEmpty) {
            globalEmpty.style.display = visibleGroups === 0 ? 'block' : 'none';
          }
        });
      });

      // Auto-filter if URL parameter exists
      if (targetTag) {
        var matchingPill = Array.from(tagPills).find(function (a) {
          return new URL(a.href).searchParams.get('tag') === targetTag;
        });
        if (matchingPill) matchingPill.click();
      }
    }

    // --- TAG DOT COLORS ---
    var knownColors = {
      'astrophysics': '#FFD700',
      'literature': '#A2AAAD',
      'technology': '#00d4aa',
      'ai': '#00d4aa',
      'philosophy': '#ff4d4d',
      'psychology': '#ff4d4d',
      'cybernetics': '#7c5cbf'
    };

    function getTagColor(rawTag) {
      if (!rawTag) return 'var(--accent)';
      var clean = rawTag.toLowerCase().trim();
      if (knownColors[clean]) return knownColors[clean];

      var hash = 0;
      for (var i = 0; i < clean.length; i++) {
        hash = clean.charCodeAt(i) + ((hash << 5) - hash);
      }
      var hue = Math.abs(hash) % 360;
      return 'hsl(' + hue + ', 70%, 65%)';
    }

    var dots = document.querySelectorAll('.tag-dot');
    dots.forEach(function (dot) {
      var tag = dot.getAttribute('data-tag');
      dot.style.setProperty('--tag-color', getTagColor(tag));
    });

    if (tagPills.length > 0) {
      tagPills.forEach(function (pill) {
        var tagText = pill.textContent.trim();
        pill.style.setProperty('--tag-color', getTagColor(tagText));
      });
    }

  }

  /* ─────────────────────────────────────────
     BOOT
  ───────────────────────────────────────── */
  function boot() {
    initMenu();
    initSubscribeModal();
    initNavHover();
    initSearch();
    initArchiveAndTags();
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
