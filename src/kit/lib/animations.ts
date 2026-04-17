/**
 * Scroll-triggered animations.
 * - Sections fade in with a subtle lift when they enter the viewport
 * - Pie chart slices animate in with staggered delays
 * - Children with .ps-reveal-child get staggered delays within their section
 *
 * When the user scrolls back to the top, all section reveals + chart animations
 * reset so they replay as the user scrolls back down.
 */

// Per-page animation state, kept in module scope so resetAnimations() can reach it.
type ResetFn = () => void;
const resetters: ResetFn[] = [];

function initAnimations() {
  resetters.length = 0;

  initRevealAnimation();
  initPieChartAnimation();
  initBarChartAnimation();

  // Listen for scroll-to-top to replay every animation
  let wasAtTop = window.scrollY < 20;
  window.addEventListener('scroll', () => {
    const atTop = window.scrollY < 20;
    if (atTop && !wasAtTop) {
      resetAnimations();
    }
    wasAtTop = atTop;
  }, { passive: true });
}

function resetAnimations() {
  resetters.forEach(fn => {
    try { fn(); } catch (e) { console.warn('animation reset failed', e); }
  });
}

function initRevealAnimation() {
  // Apply .ps-reveal to all sections (skip the first one — hero should be visible immediately)
  const allSections = document.querySelectorAll<HTMLElement>('[class*="ps-"][class*="-section"]');

  allSections.forEach((section) => {
    if (section.closest('[data-section-type="hero"]') || section.classList.contains('ps-hero')) return;
    section.classList.add('ps-reveal');
  });

  // Also reveal editor section wrappers
  document.querySelectorAll<HTMLElement>('.ps-editor-section').forEach((wrapper) => {
    if (wrapper.dataset.sectionType === 'hero') return;
    wrapper.classList.add('ps-reveal');
  });

  // Add stagger delays to card grids and list items within sections
  document.querySelectorAll('.ps-insights-card, .ps-voice-card, .ps-numlist-item, .ps-faq-item, .ps-piechart-legend-item, .ps-barchart-bar-row').forEach((child, i) => {
    const parent = child.closest('.ps-reveal');
    if (!parent) return;
    (child as HTMLElement).classList.add('ps-reveal-child');
    (child as HTMLElement).style.transitionDelay = `${i % 6 * 0.08}s`;
  });

  const reveals = Array.from(document.querySelectorAll<HTMLElement>('.ps-reveal'));

  // Recreate observer each time we reset so we can re-observe cleanly.
  let observer: IntersectionObserver | null = null;

  function observe() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer!.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => observer!.observe(el));
  }

  observe();

  resetters.push(() => {
    // Remove the "in" class from every reveal so they hide again,
    // then re-observe so they replay when the user scrolls back down.
    reveals.forEach(el => el.classList.remove('in'));
    observe();
  });
}

function initPieChartAnimation() {
  const charts = document.querySelectorAll<HTMLElement>('.ps-piechart-chart');

  charts.forEach((chart) => {
    const paths = chart.querySelectorAll<SVGPathElement>('svg path');
    if (!paths.length) return;
    const circle = chart.querySelector<SVGCircleElement>('svg circle');

    function setHidden() {
      paths.forEach((path, i) => {
        path.style.opacity = '0';
        path.style.transform = 'scale(0.85)';
        path.style.transformOrigin = '100px 100px';
        path.style.transition = `opacity 0.4s ease ${i * 0.1}s, transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) ${i * 0.1}s`;
      });
      if (circle) {
        circle.style.opacity = '0';
        circle.style.transform = 'scale(0)';
        circle.style.transformOrigin = '100px 100px';
        circle.style.transition = `opacity 0.3s ease ${paths.length * 0.1}s, transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) ${paths.length * 0.1}s`;
      }
    }

    function setShown() {
      paths.forEach((path) => {
        path.style.opacity = '1';
        path.style.transform = 'scale(1)';
      });
      if (circle) {
        circle.style.opacity = '1';
        circle.style.transform = 'scale(1)';
      }
    }

    setHidden();

    let observer: IntersectionObserver | null = null;

    function observe() {
      observer?.disconnect();
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown();
            observer!.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      observer.observe(chart);
    }

    observe();

    resetters.push(() => {
      setHidden();
      observe();
    });
  });
}

function initBarChartAnimation() {
  const charts = document.querySelectorAll<HTMLElement>('.ps-barchart-chart');

  charts.forEach((chart) => {
    const fills = chart.querySelectorAll<HTMLElement>('.ps-barchart-bar-fill');
    if (!fills.length) return;

    // Capture target widths from initial render
    const targetWidths: string[] = [];
    fills.forEach((fill) => {
      targetWidths.push(fill.style.getPropertyValue('--bar-width'));
    });

    function setHidden() {
      fills.forEach((fill) => {
        fill.style.transition = 'none';
        fill.style.setProperty('--bar-width', '0%');
      });
    }

    function setShown() {
      requestAnimationFrame(() => {
        fills.forEach((fill, i) => {
          fill.style.transition = `width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) ${i * 0.08}s, filter 0.2s ease`;
          fill.style.setProperty('--bar-width', targetWidths[i]);
        });
      });
    }

    setHidden();

    let observer: IntersectionObserver | null = null;

    function observe() {
      observer?.disconnect();
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown();
            observer!.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      observer.observe(chart);
    }

    observe();

    resetters.push(() => {
      setHidden();
      observe();
    });
  });
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  initAnimations();
}
