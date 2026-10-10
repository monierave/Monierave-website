const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navigation?.classList.toggle('open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('open');
  });
});

document.querySelector('#year').textContent = String(new Date().getFullYear());

const revealSelectors = [
  '.hero-copy', '.hero-phones', '.features-intro', '.feature-card',
  '.people-copy', '.people-photo',
  '.app-preview', '.app-copy', '.currencies > div', '.currency-item',
  '.faq-section > div', '.faq-list details', '.closing-cta > *',
  '.page-hero-inner > *', '.page-content > .eyebrow', '.page-content > h2',
  '.page-content > .page-lead', '.page-card', '.about-story > div',
  '.page-values article', '.page-banner > *', '.page-contact > *',
  '.security-note', '.site-footer > *', '.availability-card',
  '.contact-layout > *', '.contact-shortcuts > *', '.contact-email-card'
].join(',');

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealElements = document.querySelectorAll(revealSelectors);
  revealElements.forEach((element) => element.classList.add('scroll-reveal'));
  document.documentElement.classList.add('has-scroll-reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

  revealElements.forEach((element) => revealObserver.observe(element));
}
