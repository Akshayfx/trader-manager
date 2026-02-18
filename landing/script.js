/**
 * ChartWise Landing Page - Theme Toggle & Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  // Load saved theme
  const savedTheme = localStorage.getItem('chartwise_theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('chartwise_theme', newTheme);
    updateThemeIcon(newTheme);
  });
  
  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fas fa-moon';
    } else {
      icon.className = 'fas fa-sun';
    }
  }
  
  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');
  
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      navbar.style.background = 'rgba(var(--bg-primary), 0.95)';
    } else {
      navbar.style.background = 'rgba(var(--bg-primary), 0.8)';
    }
    
    lastScroll = currentScroll;
  });
  
  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe feature cards
  document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
  });
  
  // Observe pricing cards
  document.querySelectorAll('.pricing-card').forEach(card => {
    observer.observe(card);
  });
  
  // Observe download cards
  document.querySelectorAll('.download-card').forEach(card => {
    observer.observe(card);
  });
  
  // Observe steps
  document.querySelectorAll('.step').forEach(step => {
    observer.observe(step);
  });
  
  // Button click handlers for coming soon features
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href');
      if (href === '#' || !href) {
        e.preventDefault();
        showNotification('Coming Soon', 'This feature will be available soon!');
      }
    });
  });
  
  // Notification function
  function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-content">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px 24px;
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      transform: translateX(120%);
      transition: transform 0.3s ease;
      max-width: 320px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(120%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    .feature-card,
    .pricing-card,
    .download-card,
    .step {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .feature-card.animate-in,
    .pricing-card.animate-in,
    .download-card.animate-in,
    .step.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    
    .feature-card:nth-child(1) { transition-delay: 0s; }
    .feature-card:nth-child(2) { transition-delay: 0.1s; }
    .feature-card:nth-child(3) { transition-delay: 0.2s; }
    .feature-card:nth-child(4) { transition-delay: 0.3s; }
    .feature-card:nth-child(5) { transition-delay: 0.4s; }
    .feature-card:nth-child(6) { transition-delay: 0.5s; }
    
    .pricing-card:nth-child(1) { transition-delay: 0s; }
    .pricing-card:nth-child(2) { transition-delay: 0.15s; }
    .pricing-card:nth-child(3) { transition-delay: 0.3s; }
    
    .step:nth-child(1) { transition-delay: 0s; }
    .step:nth-child(3) { transition-delay: 0.2s; }
    .step:nth-child(5) { transition-delay: 0.4s; }
  `;
  document.head.appendChild(style);
});
