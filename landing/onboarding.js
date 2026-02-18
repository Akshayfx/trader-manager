/**
 * ChartWise Onboarding Flow
 * Hard Paywall Funnel That Converts
 */

let currentStep = 1;
const totalSteps = 7;

// User preferences storage
const userPreferences = {
  intent: null,
  tradingStyle: null,
  riskPercent: 2,
  features: [],
  platforms: []
};

document.addEventListener('DOMContentLoaded', () => {
  initializeOnboarding();
});

function initializeOnboarding() {
  // Initialize option cards
  initializeOptionCards();
  
  // Initialize option list
  initializeOptionList();
  
  // Initialize risk slider
  initializeRiskSlider();
  
  // Initialize feature checkboxes
  initializeFeatureCheckboxes();
  
  // Initialize platform cards
  initializePlatformCards();
  
  // Update progress
  updateProgress();
}

// Option Cards (Step 2)
function initializeOptionCards() {
  const cards = document.querySelectorAll('.option-card');
  const nextBtn = document.getElementById('intentNext');
  
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      userPreferences.intent = card.dataset.value;
      nextBtn.disabled = false;
    });
  });
}

// Option List (Step 3)
function initializeOptionList() {
  const items = document.querySelectorAll('.option-item');
  const nextBtn = document.getElementById('styleNext');
  
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      userPreferences.tradingStyle = item.dataset.value;
      nextBtn.disabled = false;
    });
  });
}

// Risk Slider (Step 4)
function initializeRiskSlider() {
  const slider = document.getElementById('riskSlider');
  const valueDisplay = document.getElementById('riskValue');
  const presets = document.querySelectorAll('.preset-btn');
  
  slider.addEventListener('input', () => {
    const value = slider.value;
    valueDisplay.textContent = value + '%';
    userPreferences.riskPercent = parseFloat(value);
    
    // Update preset buttons
    presets.forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.value) === parseFloat(value));
    });
  });
  
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      slider.value = value;
      valueDisplay.textContent = value + '%';
      userPreferences.riskPercent = parseFloat(value);
      
      presets.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Feature Checkboxes (Step 5)
function initializeFeatureCheckboxes() {
  const checkboxes = document.querySelectorAll('.feature-checkbox input');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateSelectedFeatures();
    });
  });
}

function updateSelectedFeatures() {
  const checkboxes = document.querySelectorAll('.feature-checkbox input:checked');
  userPreferences.features = Array.from(checkboxes).map(cb => {
    const label = cb.closest('.feature-checkbox').querySelector('strong').textContent;
    return label;
  });
}

// Platform Cards (Step 6)
function initializePlatformCards() {
  const cards = document.querySelectorAll('.platform-card input');
  
  cards.forEach(card => {
    card.addEventListener('change', () => {
      updateSelectedPlatforms();
    });
  });
}

function updateSelectedPlatforms() {
  const cards = document.querySelectorAll('.platform-card input:checked');
  userPreferences.platforms = Array.from(cards).map(card => {
    return card.closest('.platform-card').querySelector('span').textContent;
  });
}

// Navigation
function nextStep() {
  if (currentStep < totalSteps) {
    // Hide current step
    document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).classList.remove('active');
    
    // Show next step
    currentStep++;
    document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).classList.add('active');
    
    // Update progress
    updateProgress();
    
    // Save progress
    saveOnboardingProgress();
  }
}

function prevStep() {
  if (currentStep > 1) {
    // Hide current step
    document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).classList.remove('active');
    
    // Show previous step
    currentStep--;
    document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).classList.add('active');
    
    // Update progress
    updateProgress();
  }
}

function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progress = (currentStep / totalSteps) * 100;
  progressFill.style.width = progress + '%';
}

function saveOnboardingProgress() {
  localStorage.setItem('chartwise_onboarding_step', currentStep);
  localStorage.setItem('chartwise_preferences', JSON.stringify(userPreferences));
}

function finishOnboarding() {
  // Save final preferences
  updateSelectedFeatures();
  updateSelectedPlatforms();
  saveOnboardingProgress();
  
  // Show paywall
  nextStep();
}

function startTrial() {
  // In a real implementation, this would redirect to payment/stripe
  showNotification('Starting Trial', 'Redirecting to payment setup...');
  
  // Save that user completed onboarding
  localStorage.setItem('chartwise_onboarding_complete', 'true');
  
  // Redirect to app or payment page
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
}

// Notification helper
function showNotification(title, message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <div class="notification-content">
      <strong>${title}</strong>
      <p>${message}</p>
    </div>
  `;
  
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
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(120%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Check if user has completed onboarding
function checkOnboardingStatus() {
  const isComplete = localStorage.getItem('chartwise_onboarding_complete');
  const savedStep = localStorage.getItem('chartwise_onboarding_step');
  const savedPrefs = localStorage.getItem('chartwise_preferences');
  
  if (isComplete === 'true') {
    // User completed onboarding, redirect to app
    window.location.href = '../desktop/src/renderer/index.html';
    return;
  }
  
  if (savedStep && savedPrefs) {
    // Restore progress
    currentStep = parseInt(savedStep);
    Object.assign(userPreferences, JSON.parse(savedPrefs));
    
    // Show the saved step
    document.querySelectorAll('.onboarding-step').forEach(step => {
      step.classList.remove('active');
    });
    document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).classList.add('active');
    updateProgress();
  }
}

// Run on load
checkOnboardingStatus();

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && currentStep < totalSteps) {
    // Check if we can proceed
    const nextBtn = document.querySelector('.onboarding-step.active .btn-primary');
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.click();
    }
  }
  if (e.key === 'Escape' && currentStep > 1) {
    prevStep();
  }
});
