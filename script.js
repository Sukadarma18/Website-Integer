/**
 * script.js
 * UI Enhancer — JavaScript utilities to make a webpage more interactive and match a color palette/theme.
 *
 * Usage:
 * - Place this file in your page and include it with a <script> tag.
 * - Set elements/classes in your HTML:
 *     .hero           => animated hero background (will get gradient)
 *     .accent         => elements that should use accent color (text/border/background)
 *     .btn            => interactive buttons with ripple
 *     .card           => interactive 3D-tilt cards
 *     .reveal         => elements that fade/slide in on scroll
 *     [data-typed]    => element text will be typed (value is comma-separated strings)
 *     a[data-smooth]  => smooth-scroll links
 *     .theme-toggle   => element that toggles light/dark
 *
 * - To apply your palette programmatically:
 *     ThemeUI.applyPalette({ primary:'#...', secondary:'#...', accent:'#...', bg:'#...', surface:'#...', text:'#...' })
 * - To set theme:
 *     ThemeUI.setTheme('dark'|'light')
 *
 * Replace palette values below with your color-palette if desired.
 */

/* ========== Configurable palette (replace with your colors) ========== */
const defaultPalette = {
    primary: '#0ea5a4',     // main brand color
    secondary: '#2563eb',   // complementary
    accent: '#f97316',      // attention color
    bg: '#0b1220',          // page background
    surface: '#0f1724',     // cards/panels
    text: '#e6eef8'         // main text
};

/* ========== Internal state ========== */
const ThemeUI = (() => {
    let palette = { ...defaultPalette };
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let heroAnimId = null;
    let heroAngle = 0;

    /* Apply CSS variables globally */
    function applyPalette(p) {
        palette = { ...palette, ...p };
        const root = document.documentElement;
        root.style.setProperty('--color-primary', palette.primary);
        root.style.setProperty('--color-secondary', palette.secondary);
        root.style.setProperty('--color-accent', palette.accent);
        root.style.setProperty('--color-bg', palette.bg);
        root.style.setProperty('--color-surface', palette.surface);
        root.style.setProperty('--color-text', palette.text);

        // derived subtle colors
        root.style.setProperty('--color-primary-70', tint(palette.primary, 0.7));
        root.style.setProperty('--hero-gradient-1', gradientColor(palette.primary, 0.85));
        root.style.setProperty('--hero-gradient-2', gradientColor(palette.secondary, 0.75));
        root.style.setProperty('--card-shadow', shadowColor(palette.bg, 0.6));
        // apply to body immediately
        if (currentTheme === 'dark') {
            document.body.style.background = palette.bg;
            document.body.style.color = palette.text;
        } else {
            document.body.style.background = lighten(palette.bg, 0.9);
            document.body.style.color = darken(palette.text, 0.7);
        }
    }

    /* Theme switcher */
    function setTheme(theme) {
        currentTheme = theme === 'light' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        const root = document.documentElement;
        if (currentTheme === 'dark') {
            root.classList.remove('theme-light');
            root.classList.add('theme-dark');
            document.body.style.background = palette.bg;
            document.body.style.color = palette.text;
        } else {
            root.classList.remove('theme-dark');
            root.classList.add('theme-light');
            document.body.style.background = lighten(palette.bg, 0.9);
            document.body.style.color = darken(palette.text, 0.7);
        }
    }

    /* Animated hero gradient */
    function startHeroAnimation() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        cancelHeroAnimation();
        function step() {
            heroAngle = (heroAngle + 0.2) % 360;
            hero.style.backgroundImage = `
                linear-gradient(${heroAngle}deg,
                    ${pal('hero-gradient-1')} 0%,
                    ${pal('hero-gradient-2')} 50%,
                    ${pal('color-accent')} 100%)
            `;
            heroAnimId = requestAnimationFrame(step);
        }
        step();
    }
    function cancelHeroAnimation() {
        if (heroAnimId) cancelAnimationFrame(heroAnimId);
        heroAnimId = null;
    }

    /* Add ripple effect to .btn elements */
    function attachButtonRipples(ctx = document) {
        ctx.querySelectorAll('.btn').forEach(btn => {
            if (btn.__rippleAttached) return;
            btn.__rippleAttached = true;
            btn.style.position = btn.style.position || 'relative';
            btn.style.overflow = 'hidden';
            btn.addEventListener('pointerdown', (e) => {
                const rect = btn.getBoundingClientRect();
                const r = Math.max(rect.width, rect.height) * 1.2;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const ripple = document.createElement('span');
                ripple.style.position = 'absolute';
                ripple.style.left = `${x - r/2}px`;
                ripple.style.top = `${y - r/2}px`;
                ripple.style.width = ripple.style.height = `${r}px`;
                ripple.style.borderRadius = '50%';
                ripple.style.background = rgba(palette.text, 0.12);
                ripple.style.transform = 'scale(0)';
                ripple.style.pointerEvents = 'none';
                ripple.style.transition = 'transform 550ms cubic-bezier(.2,.8,.2,1), opacity 600ms';
                btn.appendChild(ripple);
                requestAnimationFrame(() => ripple.style.transform = 'scale(1)');
                setTimeout(() => {
                    ripple.style.opacity = '0';
                    setTimeout(() => ripple.remove(), 700);
                }, 250);
            });
        });
    }

    /* Card tilt effect */
    function attachCardTilts(ctx = document) {
        ctx.querySelectorAll('.card').forEach(card => {
            if (card.__tiltAttached) return;
            card.__tiltAttached = true;
            card.style.transition = 'transform 220ms ease, box-shadow 220ms ease';
            card.style.willChange = 'transform';
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                const rx = -py * 8;
                const ry = px * 8;
                const s = 1.02;
                card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
                card.style.boxShadow = `0 12px 30px ${pal('card-shadow')}`;
            });
            card.addEventListener('pointerleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });
        });
    }

    /* Smooth scroll for anchors */
    function attachSmoothScroll(ctx = document) {
        ctx.querySelectorAll('a[data-smooth]').forEach(a => {
            if (a.__smooth) return;
            a.__smooth = true;
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href') || '';
                if (!href.startsWith('#')) return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    /* Reveal on scroll using IntersectionObserver */
    function initReveal() {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14 });
        document.querySelectorAll('.reveal').forEach(el => {
            el.style.transition = 'opacity 600ms ease, transform 600ms ease';
            el.style.opacity = 0;
            el.style.transform = 'translateY(12px)';
            io.observe(el);
        });
    }

    /* Typed text effect for [data-typed] elements */
    function initTyped() {
        document.querySelectorAll('[data-typed]').forEach(el => {
            if (el.__typedInitialized) return;
            el.__typedInitialized = true;
            const items = el.getAttribute('data-typed').split(',').map(s => s.trim()).filter(Boolean);
            if (!items.length) return;
            let idx = 0, char = 0, forward = true;
            el.textContent = '';
            function tick() {
                const cur = items[idx];
                if (forward) {
                    char++;
                    el.textContent = cur.slice(0, char);
                    if (char >= cur.length) {
                        forward = false;
                        setTimeout(tick, 1200);
                        return;
                    }
                } else {
                    char--;
                    el.textContent = cur.slice(0, char);
                    if (char <= 0) {
                        forward = true;
                        idx = (idx + 1) % items.length;
                        setTimeout(tick, 220);
                        return;
                    }
                }
                setTimeout(tick, forward ? 80 : 40);
            }
            tick();
        });
    }

    /* Tiny helpers for colors */
    function hexToRgb(hex) {
        const h = hex.replace('#','');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
        return [(bigint>>16)&255, (bigint>>8)&255, bigint&255];
    }
    function rgba(hex, a=1) {
        const [r,g,b] = hexToRgb(hex);
        return `rgba(${r},${g},${b},${a})`;
    }
    function tint(hex, f=0.5) {
        const [r,g,b] = hexToRgb(hex);
        const nr = Math.round(r + (255 - r) * f);
        const ng = Math.round(g + (255 - g) * f);
        const nb = Math.round(b + (255 - b) * f);
        return `rgb(${nr},${ng},${nb})`;
    }
    function darken(hex, f=0.6) {
        const [r,g,b] = hexToRgb(hex);
        return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
    }
    function lighten(hex, f=0.9) {
        return tint(hex, 1 - f);
    }
    function gradientColor(hex, opacity=0.9) {
        return rgba(hex, opacity);
    }
    function shadowColor(hex, opacity=0.5) {
        return rgba(hex, opacity);
    }
    function pal(name) {
        const root = document.documentElement;
        const val = getComputedStyle(root).getPropertyValue(`--${name}`) ||
            getComputedStyle(root).getPropertyValue(`--color-${name}`) ||
            '';
        return val.trim() || (palette[name] || palette.primary);
    }

    /* Initialize behaviors on DOM ready */
    function init() {
        applyPalette(palette);
        setTheme(currentTheme);
        startHeroAnimation();
        attachButtonRipples(document);
        attachCardTilts(document);
        attachSmoothScroll(document);
        initReveal();
        initTyped();

        // theme toggle binding
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            if (btn.__binded) return;
            btn.__binded = true;
            btn.addEventListener('click', () => {
                setTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });
        });

        // allow dynamic content (e.g., SPA) to re-run bindings
        const mo = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                if (m.addedNodes && m.addedNodes.length) {
                    attachButtonRipples(document);
                    attachCardTilts(document);
                    attachSmoothScroll(document);
                    initTyped();
                }
            });
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    // auto-init when loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 10);
    }

    // Public API
    return {
        applyPalette,
        setTheme,
        startHeroAnimation,
        cancelHeroAnimation,
        attachButtonRipples,
        attachCardTilts,
        attachSmoothScroll,
        initReveal,
        initTyped,
        getPalette: () => ({ ...palette }),
        getTheme: () => currentTheme
    };
})();

/* Expose to window for easy usage */
window.ThemeUI = ThemeUI;

/* If you want to auto-apply a custom palette, uncomment and edit:
ThemeUI.applyPalette({
    primary: '#4f46e5',
    secondary: '#06b6d4',
    accent: '#ef4444',
    bg: '#0b1220',
    surface: '#071126',
    text: '#e6eef8'
});
*/