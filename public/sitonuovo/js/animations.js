/**
 * GrecoLatinoVivo - Animations Module
 * =====================================
 * Gestisce:
 *  - Scroll animations via IntersectionObserver (data-animate)
 *  - Counter numerici animati (data-counter)
 *  - Parallax leggero sull'hero
 *  - Lazy loading immagini con fallback
 *  - Scroll progress indicator
 *
 * Nessuna dipendenza esterna. Vanilla JS ES6+.
 */

(function () {
    'use strict';

    // =========================================================
    // SCROLL PROGRESS BAR
    // =========================================================
    function initScrollProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) return;

        function updateProgress() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    // =========================================================
    // INTERSECTION OBSERVER — SCROLL ANIMATIONS
    // =========================================================
    function initScrollAnimations() {
        const elements = document.querySelectorAll('[data-animate]');
        if (!elements.length) return;

        // Supporto per reducedMotion: se l'utente ha preferito
        // ridurre le animazioni, le rendiamo subito visibili
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            elements.forEach(function (el) {
                el.classList.add('visible');
            });
            return;
        }

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;

                    // Leggi delay dall'attributo data-delay (ms)
                    const delay = parseInt(el.getAttribute('data-delay') || '0', 10);

                    if (delay > 0) {
                        setTimeout(function () {
                            el.classList.add('visible');
                        }, delay);
                    } else {
                        el.classList.add('visible');
                    }

                    // Non osservare più l'elemento dopo l'animazione
                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        elements.forEach(function (el) {
            observer.observe(el);
        });
    }

    // =========================================================
    // COUNTER ANIMATION
    // Uso: <span data-counter="1500" data-suffix="+">1500+</span>
    // =========================================================
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-counter'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const duration = parseInt(el.getAttribute('data-duration') || '1800', 10);

        if (isNaN(target)) return;

        const startTime = performance.now();

        function tick(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const current = Math.round(easedProgress * target);

            el.textContent = prefix + current.toLocaleString('it-IT') + suffix;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = prefix + target.toLocaleString('it-IT') + suffix;
            }
        }

        requestAnimationFrame(tick);
    }

    function initCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        if (!counters.length) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const observerOptions = {
            threshold: 0.3,
            rootMargin: '0px 0px -30px 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;

                    if (prefersReduced) {
                        // Mostra il valore finale direttamente senza animazione
                        const target = parseInt(el.getAttribute('data-counter'), 10);
                        const suffix = el.getAttribute('data-suffix') || '';
                        const prefix = el.getAttribute('data-prefix') || '';
                        el.textContent = prefix + target.toLocaleString('it-IT') + suffix;
                    } else {
                        animateCounter(el);
                    }

                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        counters.forEach(function (el) {
            observer.observe(el);
        });
    }

    // =========================================================
    // PARALLAX LEGGERO SULL'HERO
    // Cerca elementi con classe .hero-parallax
    // =========================================================
    function initParallax() {
        const heroElements = document.querySelectorAll('.hero-parallax');
        if (!heroElements.length) return;

        // Disabilita se l'utente ha preferito ridurre le animazioni
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // Disabilita su mobile (touch devices) per non degradare le performance
        if ('ontouchstart' in window) return;

        let ticking = false;

        function applyParallax() {
            const scrollY = window.scrollY;

            heroElements.forEach(function (el) {
                const speed = parseFloat(el.getAttribute('data-parallax-speed') || '0.4');
                const offset = scrollY * speed;
                el.style.transform = 'translateY(' + offset + 'px)';
            });

            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(applyParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    // =========================================================
    // LAZY LOADING IMMAGINI
    // Usa l'attributo loading="lazy" nativo + fallback IntersectionObserver
    // =========================================================
    function initLazyImages() {
        // Se il browser supporta loading="lazy" nativo, è già applicato nell'HTML
        // Questo fallback gestisce browser che non lo supportano
        if ('loading' in HTMLImageElement.prototype) {
            // Il browser supporta lazy loading nativo — niente da fare
            return;
        }

        // Fallback: IntersectionObserver
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        if (!lazyImages.length) return;

        const imageObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');

                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }

                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            threshold: 0.01,
            rootMargin: '200px 0px'
        });

        lazyImages.forEach(function (img) {
            imageObserver.observe(img);
        });
    }

    // =========================================================
    // STAGGERED CHILDREN ANIMATION
    // Anima automaticamente i figli di container con data-stagger
    // Uso: <ul data-stagger> <li>...</li> <li>...</li> </ul>
    // =========================================================
    function initStaggeredAnimations() {
        const staggerContainers = document.querySelectorAll('[data-stagger]');
        if (!staggerContainers.length) return;

        staggerContainers.forEach(function (container) {
            const children = container.children;
            const baseDelay = parseInt(container.getAttribute('data-stagger-delay') || '100', 10);

            Array.from(children).forEach(function (child, index) {
                child.setAttribute('data-animate', child.getAttribute('data-animate') || '');
                child.setAttribute('data-delay', String(index * baseDelay));
            });
        });

        // Dopo aver impostato gli attributi, avvia l'observer
        // Nota: initScrollAnimations deve essere chiamata PRIMA di questa funzione
        // per osservare i nuovi elementi. Qui riosserviamo quelli nuovi.
        const newElements = document.querySelectorAll('[data-stagger] [data-animate]:not(.visible)');
        if (!newElements.length) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            newElements.forEach(function (el) { el.classList.add('visible'); });
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
                    setTimeout(function () {
                        el.classList.add('visible');
                    }, delay);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

        newElements.forEach(function (el) { observer.observe(el); });
    }

    // =========================================================
    // SMOOTH SCROLL per link interni
    // =========================================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href').slice(1);
                if (!targetId) return;

                const target = document.getElementById(targetId);
                if (!target) return;

                e.preventDefault();

                const navbarHeight = document.querySelector('.navbar')
                    ? document.querySelector('.navbar').offsetHeight
                    : 0;

                const targetPosition = target.getBoundingClientRect().top
                    + window.scrollY
                    - navbarHeight
                    - 16;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            });
        });
    }

    // =========================================================
    // INIT: esegui tutto al DOMContentLoaded
    // =========================================================
    function init() {
        initScrollProgress();
        initScrollAnimations();
        initCounters();
        initParallax();
        initLazyImages();
        initStaggeredAnimations();
        initSmoothScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM già pronto (script caricato con defer o in fondo al body)
        init();
    }

})();
