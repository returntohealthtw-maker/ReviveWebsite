/* ==========================================
   翔禾腦科學與身體機能整合中心 - 主要 JavaScript
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ==========================================
  // 導覽列 - 滾動效果
  // ==========================================
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // ==========================================
  // 導覽列 - 手機版漢堡選單
  // ==========================================
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
      navbar.classList.add('scrolled');

      const spans = navToggle.querySelectorAll('span');
      if (navMenu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translateY(7px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-7px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // 點選選單項目後關閉
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
    });

    // 點選選單外部關閉
    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) {
        navMenu.classList.remove('open');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // ==========================================
  // 滾動到頂部按鈕
  // ==========================================
  const scrollTopBtn = document.getElementById('scrollTop');

  if (scrollTopBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================
  // Intersection Observer - 淡入動畫
  // ==========================================
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    fadeElements.forEach((el) => observer.observe(el));
  }

  // ==========================================
  // Hero 統計數字計數動畫
  // ==========================================
  function animateCounter(el, target, suffix, duration) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const heroStats = document.querySelectorAll('.hero-stat-number');

  if (heroStats.length > 0) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const text = el.textContent.trim();

            if (text === '8+') {
              animateCounter(el, 8, '+', 1200);
            } else if (text === '12週') {
              el.textContent = '12週';
            } else if (text === 'MIT') {
              el.textContent = 'MIT';
            }

            statsObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    heroStats.forEach((el) => statsObserver.observe(el));
  }

  // ==========================================
  // 平滑錨點捲動
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navbarHeight = navbar ? navbar.offsetHeight : 80;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==========================================
  // 服務卡片 - 點擊波紋效果
  // ==========================================
  document.querySelectorAll('.service-card, .neuro-step, .info-card').forEach((card) => {
    card.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ripple.style.cssText = `
        position: absolute;
        width: 0;
        height: 0;
        background: rgba(13, 92, 115, 0.12);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        left: ${x}px;
        top: ${y}px;
        animation: rippleEffect 0.6s ease-out forwards;
        pointer-events: none;
        z-index: 0;
      `;

      if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative';
      }
      card.style.overflow = 'hidden';
      card.appendChild(ripple);

      setTimeout(() => ripple.remove(), 700);
    });
  });

  // 添加波紋動畫樣式
  if (!document.getElementById('rippleStyle')) {
    const style = document.createElement('style');
    style.id = 'rippleStyle';
    style.textContent = `
      @keyframes rippleEffect {
        0% { width: 0; height: 0; opacity: 0.8; }
        100% { width: 300px; height: 300px; opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // 腦波圖形節點動畫增強
  // ==========================================
  const brainNodes = document.querySelectorAll('.brain-node');
  if (brainNodes.length > 0) {
    brainNodes.forEach((node, index) => {
      node.style.animationDelay = `${index * 0.4}s`;
    });
  }

  // ==========================================
  // 頁面載入進度條
  // ==========================================
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, #0D5C73, #4CAF8C);
    z-index: 9999;
    transition: width 0.2s ease;
    border-radius: 0 2px 2px 0;
  `;
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', function () {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }, { passive: true });

  // ==========================================
  // 導覽列 active 狀態（基於目前頁面）
  // ==========================================
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });

  // ==========================================
  // 浮動卡片動畫 stagger
  // ==========================================
  document.querySelectorAll('.floating-mini-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 1.5}s`;
  });

  // ==========================================
  // Service cards grid hover - stagger effect
  // ==========================================
  document.querySelectorAll('.services-grid .service-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.05}s`;
  });

  // ==========================================
  // Tooltip for research references
  // ==========================================
  document.querySelectorAll('[data-tooltip]').forEach((el) => {
    el.addEventListener('mouseenter', function () {
      const tooltip = document.createElement('div');
      tooltip.textContent = el.getAttribute('data-tooltip');
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(6, 42, 56, 0.95);
        color: white;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 0.78rem;
        max-width: 280px;
        z-index: 1000;
        pointer-events: none;
        line-height: 1.5;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(tooltip);

      const rect = el.getBoundingClientRect();
      tooltip.style.top = (rect.bottom + window.scrollY + 8) + 'px';
      tooltip.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 300) + 'px';

      el._tooltip = tooltip;
    });

    el.addEventListener('mouseleave', function () {
      if (el._tooltip) {
        el._tooltip.remove();
        el._tooltip = null;
      }
    });
  });

  // ==========================================
  // 圖片懶載入支援
  // ==========================================
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
    });
  } else {
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          lazyObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      lazyObserver.observe(img);
    });
  }

  // ==========================================
  // Mission cards 滑入效果
  // ==========================================
  const missionCards = document.querySelectorAll('.mission-card');
  if (missionCards.length > 0) {
    const missionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateX(0)';
            }, index * 120);
            missionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    missionCards.forEach((card) => {
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      missionObserver.observe(card);
    });
  }

  console.log('翔禾整合中心 | 永不止息 · Healing Never Ends');
});
