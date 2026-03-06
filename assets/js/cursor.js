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

// ═══════════════════════════════════════════════════════
// METEOR DRAWING EFFECT
// ═══════════════════════════════════════════════════════

function isEmptySpace(target) {
    const blocked = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'IMG', 'SELECT'];
    const blockedClasses = ['post-card', 'nav', 'cursor-dot', 'cursor-ring', 'tag', 'btn', 'main-header', 'site-nav', 'main-footer', 'subscribe-modal-content'];

    if (blocked.includes(target.tagName)) return false;
    if (blockedClasses.some(c => target.closest('.' + c))) return false;
    if (target.closest('article') && target.tagName !== 'SECTION') return false;
    return true;
}

const ELEMENT_ACCENT_MAP = {
    // By class
    'post-card': { color: '#a78bfa', name: 'Article' },
    'hero': { color: '#2dd4bf', name: 'Hero' },
    'site-nav': { color: '#a78bfa', name: 'Navigation' },
    'tags-section': { color: '#fbbf24', name: 'Tags' },
    'main-footer': { color: '#4d4870', name: 'Footer' },
    'subscribe-modal-content': { color: '#fbbf24', name: 'Modal' },
    // By tag proximity
    'H1': { color: '#a78bfa', name: 'Heading' },
    'H2': { color: '#9b72cf', name: 'Section' },
    'CANVAS': { color: '#2dd4bf', name: 'Star Field' },
    // Default fallback
    'default': { color: '#a78bfa', name: 'Space' },
};

const rgbToHex = (rgb) => {
    const res = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (res && res.length === 4) ? "#" +
        ("0" + parseInt(res[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(res[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(res[3], 10).toString(16)).slice(-2) : rgb;
};

function getDominantAccent(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return ELEMENT_ACCENT_MAP.default;

    for (const [className, data] of Object.entries(ELEMENT_ACCENT_MAP)) {
        if (el.closest('.' + className) || el.tagName === className) return data;
    }

    let node = el;
    while (node && node !== document.body) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return { color: rgbToHex(bg), name: node.tagName.toLowerCase() };
        }
        node = node.parentElement;
    }
    return ELEMENT_ACCENT_MAP.default;
}

const meteorCanvas = document.getElementById('meteor-canvas');
const ctx = meteorCanvas ? meteorCanvas.getContext('2d') : null;

function resizeCanvas() {
    if (!meteorCanvas) return;
    meteorCanvas.width = window.innerWidth * devicePixelRatio;
    meteorCanvas.height = window.innerHeight * devicePixelRatio;
    meteorCanvas.style.width = window.innerWidth + 'px';
    meteorCanvas.style.height = window.innerHeight + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
}
if (meteorCanvas) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

const meteors = [];

class Meteor {
    constructor(x, y, color, label) {
        this.points = [{ x, y }];
        this.color = color;
        this.label = label;
        this.labelX = x;
        this.labelY = y;
        this.born = performance.now();
        this.duration = 2200;
        this.alive = true;
        this.maxWidth = 3.5;
    }

    get age() { return performance.now() - this.born; }
    get progress() { return Math.min(this.age / this.duration, 1); }
    get opacity() {
        const p = this.progress;
        if (p < 0.08) return p / 0.08;
        if (p < 0.6) return 1;
        return 1 - ((p - 0.6) / 0.4);
    }
}

function drawMeteor(meteor) {
    if (!ctx) return;
    const { points, color, opacity } = meteor;
    if (points.length < 2) return;

    ctx.save();
    ctx.globalAlpha = opacity * 0.9;

    let r = 167, g = 139, b = 250;
    if (color && color.startsWith('#')) {
        r = parseInt(color.slice(1, 3), 16) || 167;
        g = parseInt(color.slice(3, 5), 16) || 139;
        b = parseInt(color.slice(5, 7), 16) || 250;
    }

    // Glow pass
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const mx = (prev.x + curr.x) / 2;
        const my = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }

    const grad = ctx.createLinearGradient(
        points[0].x, points[0].y,
        points[points.length - 1].x, points[points.length - 1].y
    );
    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},0.08)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0.18)`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Core pass
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const mx = (prev.x + curr.x) / 2;
        const my = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }

    const coreGrad = ctx.createLinearGradient(
        points[0].x, points[0].y,
        points[points.length - 1].x, points[points.length - 1].y
    );
    coreGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    coreGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.3)`);
    coreGrad.addColorStop(1, `rgba(${r},${g},${b},0.85)`);

    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Head spark
    const head = points[points.length - 1];
    const sparkGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
    sparkGrad.addColorStop(0, `rgba(255,255,255,0.75)`);
    sparkGrad.addColorStop(0.3, `rgba(${r},${g},${b},0.5)`);
    sparkGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    ctx.beginPath();
    ctx.arc(head.x, head.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = sparkGrad;
    ctx.fill();

    // Debris particles
    const tailStart = Math.floor(points.length * 0.7);
    for (let i = tailStart; i < points.length; i += 3) {
        const p = points[i];
        ctx.beginPath();
        ctx.arc(
            p.x + (Math.random() - 0.5) * 10,
            p.y + (Math.random() - 0.5) * 10,
            Math.random() * 1.5 + 0.5,
            0, Math.PI * 2
        );
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.random() * 0.4 + 0.1})`;
        ctx.fill();
    }

    ctx.restore();
}

function drawLabel(meteor) {
    if (!ctx) return;
    const { label, labelX, labelY, opacity } = meteor;
    const labelOpacity = opacity * 0.28;

    ctx.save();
    ctx.globalAlpha = labelOpacity;
    ctx.font = '500 0.62rem "DM Mono", monospace';
    ctx.letterSpacing = '0.14em';
    ctx.fillStyle = meteor.color;
    ctx.textTransform = 'uppercase';

    const textX = labelX + 18;
    const textY = labelY - 12;

    const metrics = ctx.measureText(label.toUpperCase());
    const pad = 6;
    ctx.fillStyle = `rgba(0,0,0,0.3)`;
    ctx.beginPath();
    ctx.roundRect(textX - pad, textY - 10, metrics.width + pad * 2, 16, 4);
    ctx.fill();

    ctx.fillStyle = meteor.color;
    ctx.fillText(label.toUpperCase(), textX, textY);

    ctx.restore();
}

let activeMeteor = null;
let isMeteorDragging = false;
let meteorDragStart = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Ignore touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // Handle only left clicks
    if (e.button !== 0) return;

    if (!isEmptySpace(e.target)) return;

    meteorDragStart = { x: e.clientX, y: e.clientY };
    isMeteorDragging = false;

    const accent = getDominantAccent(e.clientX, e.clientY);
    activeMeteor = new Meteor(e.clientX, e.clientY, accent.color, accent.name);
});

document.addEventListener('mousemove', (e) => {
    if (!activeMeteor) return;

    const dx = e.clientX - meteorDragStart.x;
    const dy = e.clientY - meteorDragStart.y;

    if (!isMeteorDragging && Math.sqrt(dx * dx + dy * dy) < 8) return;
    isMeteorDragging = true;

    activeMeteor.points.push({ x: e.clientX, y: e.clientY });

    if (activeMeteor.points.length > 120) {
        activeMeteor.points.shift();
    }

    if (!meteors.includes(activeMeteor)) {
        meteors.push(activeMeteor);
    }
});

document.addEventListener('mouseup', () => {
    activeMeteor = null;
    isMeteorDragging = false;
});

function renderMeteors() {
    if (ctx && meteorCanvas) {
        ctx.clearRect(0, 0, meteorCanvas.width / devicePixelRatio, meteorCanvas.height / devicePixelRatio);

        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            if (m.progress >= 1) {
                meteors.splice(i, 1);
                continue;
            }
            drawMeteor(m);
            if (m.label) drawLabel(m);
        }
    }
    requestAnimationFrame(renderMeteors);
}

// Start meteor render loop independently of the cursor loop
if (meteorCanvas) {
    renderMeteors();
}
