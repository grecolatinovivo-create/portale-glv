/**
 * GrecoLatinoVivo — main.js
 * Vanilla JS: navbar, smooth scroll, scroll animations,
 * animated counters, accordion FAQ, form validation
 */

'use strict';

/* ============================================================
   UTILITY
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. NAVBAR — sticky on scroll + hamburger mobile
   ============================================================ */
(function initNavbar() {
  const navbar  = $('.navbar');
  const toggle  = $('.nav-toggle');
  const mobileNav = $('.nav-mobile');
  if (!navbar) return;

  /* Sticky scroll */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hamburger */
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    /* Close on link click */
    $$('a', mobileNav).forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    /* Close on outside click */
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* Active link highlight */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-menu a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ============================================================
   2. SMOOTH SCROLL for anchor links
   ============================================================ */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const navbarH = $('.navbar')?.offsetHeight || 70;
    const top = target.getBoundingClientRect().top + window.scrollY - navbarH - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
})();

/* ============================================================
   3. SCROLL-REVEAL ANIMATIONS (IntersectionObserver)
   ============================================================ */
(function initReveal() {
  if (!('IntersectionObserver' in window)) {
    $$('.reveal, .reveal-up, .reveal-left, .reveal-right').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal, .reveal-up, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
})();

/* ============================================================
   4. ANIMATED NUMBER COUNTERS
   ============================================================ */
(function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target  = parseInt(el.dataset.count, 10);
    const suffix  = el.dataset.suffix || '';
    const prefix  = el.dataset.prefix || '';
    const duration = parseInt(el.dataset.duration || '2000', 10);
    let start = null;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed  = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);
      el.textContent = prefix + value.toLocaleString('it-IT') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));
})();

/* ============================================================
   5. FAQ ACCORDION
   ============================================================ */
(function initAccordion() {
  const items = $$('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const question = $('.faq-question', item);
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      /* Close all others */
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherQ = $('.faq-question', other);
          if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
        }
      });

      /* Toggle current */
      item.classList.toggle('open', !isOpen);
      question.setAttribute('aria-expanded', !isOpen);
    });

    /* Keyboard support */
    question.setAttribute('role', 'button');
    question.setAttribute('tabindex', '0');
    question.setAttribute('aria-expanded', 'false');
    question.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });
})();

/* ============================================================
   6. CONTACT FORM VALIDATION
   ============================================================ */
(function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const showError = (field, msg) => {
    field.classList.add('error');
    const errEl = field.parentElement.querySelector('.field-error');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
  };

  const clearError = (field) => {
    field.classList.remove('error');
    const errEl = field.parentElement.querySelector('.field-error');
    if (errEl) errEl.classList.remove('visible');
  };

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const validatePhone = (v) => !v.trim() || /^[\d\s\+\-\(\)]{7,}$/.test(v.trim());

  /* Live validation */
  $$('input, select, textarea', form).forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  const validateField = (field) => {
    const val = field.value.trim();
    clearError(field);

    if (field.hasAttribute('required') && !val) {
      showError(field, 'Questo campo è obbligatorio.');
      return false;
    }
    if (field.type === 'email' && val && !validateEmail(val)) {
      showError(field, 'Inserisci un indirizzo email valido.');
      return false;
    }
    if (field.type === 'tel' && val && !validatePhone(val)) {
      showError(field, 'Inserisci un numero di telefono valido.');
      return false;
    }
    if (field.minLength > 0 && val.length < field.minLength) {
      showError(field, `Minimo ${field.minLength} caratteri richiesti.`);
      return false;
    }
    return true;
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    const fields = $$('[required], input[type="email"], input[type="tel"]', form);

    fields.forEach(field => {
      if (!validateField(field)) valid = false;
    });

    /* Privacy checkbox */
    const privacy = $('#privacy-check', form);
    if (privacy && !privacy.checked) {
      valid = false;
      const errEl = privacy.closest('.form-check')?.querySelector('.field-error');
      if (errEl) { errEl.textContent = 'Devi accettare la privacy policy.'; errEl.classList.add('visible'); }
    }

    if (!valid) {
      const firstError = form.querySelector('.error, input:invalid');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Submit success simulation */
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso…';

      setTimeout(() => {
        const feedback = $('.form-feedback.success', form.parentElement) || $('.form-feedback', form.parentElement);
        if (feedback) {
          feedback.classList.add('success');
          feedback.style.display = 'flex';
          feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }, 1200);
    }
  });
})();

/* ============================================================
   7. BACK TO TOP BUTTON
   ============================================================ */
(function initBackToTop() {
  const btn = $('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ============================================================
   8. LAZY LOAD IMAGES (native + fallback)
   ============================================================ */
(function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) return; /* native support */

  if (!('IntersectionObserver' in window)) return;

  const imgs = $$('img[data-src]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  imgs.forEach(img => observer.observe(img));
})();

/* ============================================================
   9. NAV TOGGLE ANIMATION (hamburger → X)
   ============================================================ */
(function initToggleAnimation() {
  const toggle = $('.nav-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const spans = $$('span', toggle);
    const isActive = toggle.classList.contains('active');
    if (!isActive) {
      toggle.classList.add('active');
      if (spans[0]) spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      if (spans[1]) spans[1].style.opacity = '0';
      if (spans[2]) spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      toggle.classList.remove('active');
      if (spans[0]) spans[0].style.transform = '';
      if (spans[1]) spans[1].style.opacity = '';
      if (spans[2]) spans[2].style.transform = '';
    }
  });
})();
