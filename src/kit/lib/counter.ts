/**
 * Animated number counter — animates from 0 to data-count value.
 * Attach to elements with class `ps-stat-num` and a `data-count` attribute.
 * Fires once when the parent hero section enters the viewport.
 */
export function initCounters(root: HTMLElement = document.documentElement) {
  const els = root.querySelectorAll<HTMLElement>('.ps-stat-num[data-count]');
  if (!els.length) return;

  let fired = false;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !fired) {
        fired = true;
        animateAll(els);
        observer.disconnect();
      }
    }
  }, { threshold: 0.15 });

  // Observe the hero wrapper (parent of first stat)
  const hero = els[0].closest('.ps-hero');
  if (hero) {
    observer.observe(hero);
  } else {
    // Fallback: animate immediately
    animateAll(els);
  }
}

function animateAll(els: NodeListOf<HTMLElement>) {
  els.forEach((el) => {
    const target = parseInt(el.dataset.count || '0', 10);
    const duration = 1400;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}
