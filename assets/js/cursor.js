/**
 * Custom Animated Rocket Cursor
 */

(function () {
    // Ignore touch devices where custom cursors are useless
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursorEl = document.createElement('div');
    cursorEl.id = 'custom-cursor';
    cursorEl.style.opacity = '0'; // Hide until first mousemove

    // Lucide "rocket" icon SVG (pointing top-right)
    cursorEl.innerHTML = `
    <svg class="cursor-rocket" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  `;

    // Create 8 fire particles
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.classList.add('cursor-fire-particle');
        cursorEl.appendChild(p);
    }

    document.body.appendChild(cursorEl);

    let isVisible = false;

    document.addEventListener('mousemove', (e) => {
        if (!isVisible) {
            isVisible = true;
            cursorEl.style.opacity = '1';
        }
        // The tip of the rocket is at (22, 2) in the 24x24 SVG box.
        // Offset the cursor element so the tip aligns with the actual pointer coordinates.
        cursorEl.style.transform = `translate3d(${e.clientX - 22}px, ${e.clientY - 2}px, 0)`;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        isVisible = false;
        cursorEl.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        isVisible = true;
        cursorEl.style.opacity = '1';
    });

    let burstTimeout;

    document.addEventListener('mousedown', () => {
        cursorEl.classList.remove('fire-burst');
        // Force DOM reflow to restart CSS animation
        void cursorEl.offsetWidth;

        // Randomize particle vectors for the burst
        const particles = cursorEl.querySelectorAll('.cursor-fire-particle');
        particles.forEach(p => {
            // Rocket flies up-right, so fire bursts down-left
            // tx: negative, ty: positive
            const tx = (Math.random() * -30) - 5;
            const ty = (Math.random() * 30) + 5;
            p.style.setProperty('--tx', `${tx}px`);
            p.style.setProperty('--ty', `${ty}px`);

            const colors = ['#fb923c', '#fbbf24', '#f472b6', '#a78bfa'];
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        });

        cursorEl.classList.add('fire-burst');

        clearTimeout(burstTimeout);
        burstTimeout = setTimeout(() => {
            cursorEl.classList.remove('fire-burst');
        }, 400);
    });
})();
