/* ═══════════════════════════════════════════════
   app.js — Portfolio Interactions & Logic
   Data-driven: loads all video content from data.json
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ═══════════════════════════════════════════════
     DATA LOADED GLOBALLY VIA DATA.JS
     ═══════════════════════════════════════════════ */
  // siteData is already defined in data.js which is included in index.html
  if (typeof siteData === 'undefined') {
    console.warn('siteData is not defined. Ensure data.js is loaded.');
    return;
  }

  /* ═══════════════════════════════════════════════
     RENDER FEATURED CARDS
     ═══════════════════════════════════════════════ */
  const featuredGrid = document.querySelector('.featured-grid');

  if (featuredGrid && siteData.featured) {
    // Only render items with visible: true (default is true if not specified)
    siteData.featured
      .filter(item => item.visible !== false)
      .forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'featured-card reveal-child';

      // Build thumbnail: use real image or SVG gradient placeholder
      const thumbSrc = item.thumbnail
        ? item.thumbnail
        : generateSVGPlaceholder(270, 480, item.gradient, item.title, 'portrait');

      card.innerHTML = `
        <div class="featured-card-thumb">
          <img src="${thumbSrc}" alt="${item.title}" />
          <div class="featured-card-play">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        <div class="featured-card-info">
          <span class="featured-card-tag">${item.tag || ''}</span>
          <h3 class="featured-card-title">${item.title}</h3>
        </div>
      `;

      // Click → open modal with description
      card.addEventListener('click', () => {
        openModal({
          title: item.title,
          tag: item.tag || '',
          meta: item.meta || '',
          description: item.description || '',
          videoSrc: item.video || '',
          gradient: item.gradient,
          orientation: 'portrait'
        });
      });

      featuredGrid.appendChild(card);
    });
  }

  /* ═══════════════════════════════════════════════
     RENDER SHORT-FORM MARQUEE CARDS
     ═══════════════════════════════════════════════ */
  const marqueeTrack = document.getElementById('marquee-track');

  if (marqueeTrack && siteData.shortform) {
    // Build all cards
    const fragment = document.createDocumentFragment();

    // Only render items with visible: true (default is true if not specified)
    siteData.shortform
      .filter(item => item.visible !== false)
      .forEach((item, index) => {
        const card = createShortCard(item, index);
        fragment.appendChild(card);
      });

    marqueeTrack.appendChild(fragment);

    // Duplicate for infinite seamless loop
    const clone = marqueeTrack.innerHTML;
    marqueeTrack.innerHTML += clone;

    // Wire up hover video preview on all cards (including clones)
    marqueeTrack.querySelectorAll('.short-card').forEach(card => {
      const video = card.querySelector('.short-card-video');
      if (video) {
        card.addEventListener('mouseenter', () => {
          video.play().catch(() => {});
        });
        card.addEventListener('mouseleave', () => {
          video.pause();
          video.currentTime = 0;
        });
      }
    });

    // Wire up click events on all cards (including clones)
    marqueeTrack.querySelectorAll('.short-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const item = siteData.shortform.find(s => s.id === id);
        if (item) {
          openModal({
            title: item.title,
            tag: item.tag || '',
            meta: item.meta || '',
            description: item.description || '',
            videoSrc: item.video || '',
            gradient: item.gradient,
            orientation: 'portrait'
          });
        }
      });
    });
  }

  function createShortCard(item, index) {
    const card = document.createElement('div');
    card.className = 'short-card';
    card.dataset.id = item.id;

    const thumbSrc = item.thumbnail
      ? item.thumbnail
      : generateSVGPlaceholder(270, 480, item.gradient, String(index + 1).padStart(2, '0'), 'portrait');

    let videoTag = '';
    const isVimeo = item.video && item.video.includes('vimeo.com');
    const isYouTube = item.video && (item.video.includes('youtube.com') || item.video.includes('youtu.be'));

    if (item.video && !isVimeo && !isYouTube) {
      videoTag = `<video class="short-card-video" src="${item.video}" muted loop playsinline preload="none"></video>`;
    }

    card.innerHTML = `
      <img class="short-card-thumb" src="${thumbSrc}" alt="${item.title}" />
      ${videoTag}
      <div class="short-card-overlay">
        <div class="short-card-play-icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
        <span class="short-card-title">${item.title}</span>
      </div>
    `;

    return card;
  }

  /* ── SVG Gradient Placeholder Generator ── */
  function generateSVGPlaceholder(w, h, gradient, label, type) {
    // Parse gradient colors for SVG
    const colors = extractGradientColors(gradient);
    const fontSize = type === 'portrait' ? 36 : 56;

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <defs>
        <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='${colors[0]}'/>
          <stop offset='100%' stop-color='${colors[colors.length - 1]}'/>
        </linearGradient>
      </defs>
      <rect width='${w}' height='${h}' fill='url(#g)'/>
      <text x='${w / 2}' y='${h / 2}' text-anchor='middle' dominant-baseline='middle' fill='rgba(255,255,255,0.08)' font-size='${fontSize}' font-family='sans-serif' font-weight='800'>${label}</text>
    </svg>`;

    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function extractGradientColors(gradient) {
    if (!gradient) return ['#1a1a2e', '#0f0f1a'];
    const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
    return matches && matches.length > 0 ? matches : ['#1a1a2e', '#0f0f1a'];
  }


  /* ═══════════════════════════════════════════════
     NAVBAR
     ═══════════════════════════════════════════════ */
  const navbar = document.querySelector('.navbar');
  const observerNavSentinel = document.getElementById('hero');

  const navObserver = new IntersectionObserver(([entry]) => {
    navbar.classList.toggle('scrolled', !entry.isIntersecting);
  }, { threshold: 0.8 });

  if (observerNavSentinel) navObserver.observe(observerNavSentinel);

  /* ── Mobile Nav Toggle ── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      navToggle.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        navToggle.classList.remove('active');
      });
    });
  }

  /* ── Smooth Scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        const offset = 80;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  /* ── Scroll Reveal ── */
  const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        if (entry.target.classList.contains('reveal-stagger')) {
          const children = entry.target.querySelectorAll('.reveal-child');
          children.forEach((child, i) => {
            child.style.transitionDelay = `${i * 0.12}s`;
          });
        }

        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));


  /* ═══════════════════════════════════════════════
     MODAL / LIGHTBOX (with description)
     ═══════════════════════════════════════════════ */
  const modalOverlay = document.getElementById('video-modal');
  const modalContent = modalOverlay?.querySelector('.modal-content');
  const modalVideoWrapper = modalOverlay?.querySelector('.modal-video-wrapper');
  const modalTag = modalOverlay?.querySelector('.modal-video-tag');
  const modalTitle = modalOverlay?.querySelector('.modal-video-title');
  const modalMeta = modalOverlay?.querySelector('.modal-video-meta');
  const modalDesc = modalOverlay?.querySelector('.modal-video-description');
  const modalClose = modalOverlay?.querySelector('.modal-close');

  function openModal(data) {
    if (!modalOverlay) return;

    // Set orientation
    const isPortrait = data.orientation === 'portrait';
    modalContent.classList.toggle('landscape', !isPortrait);
    modalVideoWrapper.classList.toggle('portrait', isPortrait);
    modalVideoWrapper.classList.toggle('landscape', !isPortrait);

    // Set tag
    if (modalTag) {
      modalTag.textContent = data.tag || '';
      modalTag.style.display = data.tag ? 'inline-block' : 'none';
    }

    // Set text content
    modalTitle.textContent = data.title || 'Untitled';

    // Set meta
    if (modalMeta) {
      modalMeta.textContent = data.meta || '';
      modalMeta.style.display = data.meta ? 'block' : 'none';
    }

    // Set description
    if (modalDesc) {
      modalDesc.textContent = data.description || '';
      modalDesc.style.display = data.description ? 'block' : 'none';
    }

    // Build video or placeholder
    modalVideoWrapper.innerHTML = '';

    if (data.videoSrc) {
      if (data.videoSrc.includes('vimeo.com')) {
        const vimeoIdMatch = data.videoSrc.match(/vimeo\.com\/(\d+)/);
        if (vimeoIdMatch) {
          const iframe = document.createElement('iframe');
          iframe.src = `https://player.vimeo.com/video/${vimeoIdMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`;
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.frameBorder = '0';
          iframe.allow = 'autoplay; fullscreen; picture-in-picture';
          iframe.allowFullscreen = true;
          modalVideoWrapper.appendChild(iframe);
        }
      } else if (data.videoSrc.includes('youtube.com') || data.videoSrc.includes('youtu.be')) {
        let ytId = '';
        if (data.videoSrc.includes('youtu.be/')) {
          ytId = data.videoSrc.split('youtu.be/')[1].split('?')[0];
        } else if (data.videoSrc.includes('v=')) {
          ytId = data.videoSrc.split('v=')[1].split('&')[0];
        }
        if (ytId) {
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.frameBorder = '0';
          iframe.allow = 'autoplay; fullscreen; picture-in-picture';
          iframe.allowFullscreen = true;
          modalVideoWrapper.appendChild(iframe);
        }
      } else {
        const video = document.createElement('video');
        video.src = data.videoSrc;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.style.background = '#000';
        modalVideoWrapper.appendChild(video);
      }
    } else {
      // Premium placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'modal-placeholder';
      placeholder.style.background = data.gradient || 'linear-gradient(135deg, #1a1a2e, #0f0f1a)';
      placeholder.innerHTML = `
        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span style="font-weight:600;color:var(--text-primary)">${data.title || 'Video Preview'}</span>
        <span style="font-size:0.78rem;color:var(--text-muted)">Replace with your video source</span>
      `;
      modalVideoWrapper.appendChild(placeholder);
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';

    setTimeout(() => {
      const video = modalVideoWrapper.querySelector('video');
      if (video) {
        video.pause();
        video.src = '';
      }
      modalVideoWrapper.innerHTML = '';
    }, 350);
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });


  /* ═══════════════════════════════════════════════
     CONTACT FORM — Formspree Integration
     ═══════════════════════════════════════════════ */
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    const submitBtn = document.getElementById('form-submit-btn');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;

      // ── Validation ──
      const nameGroup = document.getElementById('form-name-group');
      const nameInput = document.getElementById('form-name');
      if (!nameInput.value.trim()) {
        nameGroup.classList.add('error');
        isValid = false;
      } else {
        nameGroup.classList.remove('error');
      }

      const emailGroup = document.getElementById('form-email-group');
      const emailInput = document.getElementById('form-email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailGroup.classList.add('error');
        isValid = false;
      } else {
        emailGroup.classList.remove('error');
      }

      const msgGroup = document.getElementById('form-msg-group');
      const msgInput = document.getElementById('form-message');
      if (!msgInput.value.trim()) {
        msgGroup.classList.add('error');
        isValid = false;
      } else {
        msgGroup.classList.remove('error');
      }

      if (!isValid) return;

      // ── Submit to Formspree ──
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            message: msgInput.value.trim()
          })
        });

        if (response.ok) {
          showToast();
          contactForm.reset();
        } else {
          const data = await response.json();
          console.error('Formspree error:', data);
          showErrorToast('Something went wrong. Please try again.');
        }
      } catch (error) {
        console.error('Network error:', error);
        showErrorToast('Network error. Please check your connection.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });

    // Clear error on input
    contactForm.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.closest('.form-group').classList.remove('error');
      });
    });
  }

  function showToast() {
    const toast = document.getElementById('success-toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  function showErrorToast(message) {
    const toast = document.getElementById('success-toast');
    if (!toast) return;
    toast.querySelector('.toast-text').textContent = message || 'Error occurred';
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      // Reset the text after hiding
      toast.querySelector('.toast-text').textContent = 'Message Sent Successfully!';
    }, 4000);
  }

}); // ← closes DOMContentLoaded callback