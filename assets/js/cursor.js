// ─── STATE ───────────────────────────────────────────
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const ring = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const LERP = 0.12;
let rafId = null;
let isClicking = false;
let isHovering = false;

// ─── ELEMENTS ────────────────────────────────────────
const dot = document.createElement('div');
const ringEl = document.createElement('div');
dot.className = 'cursor-dot';
ringEl.className = 'cursor-ring';
document.body.appendChild(dot);
document.body.appendChild(ringEl);

// ─── LERP FUNCTION ───────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

// ─── ANIMATION LOOP ──────────────────────────────────
function animate() {
    // Ring follows mouse with lerp (smooth lag)
    ring.x = lerp(ring.x, mouse.x, LERP);
    ring.y = lerp(ring.y, mouse.y, LERP);

    // Dot is instant
    dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
    ringEl.style.transform = `translate(${ring.x}px, ${ring.y}px) translate(-50%, -50%)`;

    rafId = requestAnimationFrame(animate);
}

// ─── MOUSE TRACKING ──────────────────────────────────
document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// ─── CLICK STATES ────────────────────────────────────
document.addEventListener('mousedown', () => {
    isClicking = true;
    dot.classList.add('is-clicking');
    ringEl.classList.add('is-clicking');
});

document.addEventListener('mouseup', () => {
    isClicking = false;
    dot.classList.remove('is-clicking');
    ringEl.classList.remove('is-clicking');
});

// ─── HOVER DETECTION ─────────────────────────────────
// All interactive elements
const interactiveSelectors = [
    'a', 'button', '[role="button"]',
    '.post-card', 'input', 'textarea',
    'select', 'label', '[data-cursor]'
].join(', ');

document.addEventListener('mouseover', (e) => {
    const target = e.target.closest(interactiveSelectors);
    if (target) {
        isHovering = true;
        const cursorType = target.dataset.cursor || 'link';
        ringEl.setAttribute('data-state', cursorType);
        dot.setAttribute('data-state', cursorType);
        ringEl.classList.add('is-hovering');
        dot.classList.add('is-hovering');

        // Text-swap cursor for post cards
        if (target.classList.contains('post-card')) {
            ringEl.setAttribute('data-state', 'read');
            ringEl.dataset.label = target.dataset.cursorLabel || 'READ';
        }
    }
});

document.addEventListener('mouseout', (e) => {
    const target = e.target.closest(interactiveSelectors);
    if (target) {
        isHovering = false;
        ringEl.removeAttribute('data-state');
        dot.removeAttribute('data-state');
        ringEl.classList.remove('is-hovering');
        dot.classList.remove('is-hovering');
        ringEl.dataset.label = '';
    }
});

// ─── CURSOR HIDE ON LEAVE / SHOW ON ENTER ────────────
document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ringEl.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ringEl.style.opacity = '1';
});

// ─── START ───────────────────────────────────────────
animate();
