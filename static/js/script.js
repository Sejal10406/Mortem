/**
 * MORTEM: The Unnecessarily Serious Object Lifespan Predictor ☠️
 * Client-side Forensic Interactions, Live Risk Engine & Analysis Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  initSlider();
  initObjectSelector();
  initLiveRiskPreview();
  initFormAnalysisModal();
  initGauge();
  initDemoModeToggle();
  initDemoCountdown();
});

/**
 * Sound Synthesizer using Web Audio API for clinical laboratory blips
 */
const AudioEngine = {
  ctx: null,
  enabled: true,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playBeep(freq = 600, duration = 0.08, type = 'sine') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio might be suppressed by browser autoplay policy
    }
  }
};

/**
 * Baselines dictionary for client-side live preview calculation
 */
const OBJECT_BASELINES = {
  pencil: 30,
  eraser: 60,
  charger: 180,
  mug: 730,
  sock: 120,
  shoes: 365,
  earphones: 240,
  toothbrush: 90,
  phone_screen: 500,
  chair: 1095,
  water_bottle: 730,
  backpack: 900,
  custom: 180
};

/**
 * Initialize Condition Slider with dynamic feedback & block progress bar
 * CONDITION
 * ██████████████░░ 72%
 * 90–100: Excellent condition
 * 70–89: Good condition
 * 40–69: Average condition
 * 20–39: Poor condition
 * 0–19: Critical condition
 */
function initSlider() {
  const slider = document.getElementById('condition-slider');
  const pctDisplay = document.getElementById('condition-pct');
  const statusDisplay = document.getElementById('condition-status');

  if (!slider || !pctDisplay) return;

  function updateStatus(val) {
    const num = parseInt(val, 10);
    const totalBlocks = 16;
    const fullBlocks = Math.round((num / 100) * totalBlocks);
    const emptyBlocks = Math.max(0, totalBlocks - fullBlocks);
    const blockBar = '█'.repeat(fullBlocks) + '░'.repeat(emptyBlocks);

    pctDisplay.textContent = `${blockBar} ${num}%`;

    let label = 'Average condition';
    let color = '#f59e0b';

    if (num >= 90) {
      label = 'Excellent condition';
      color = '#10b981';
    } else if (num >= 70) {
      label = 'Good condition';
      color = '#34d399';
    } else if (num >= 40) {
      label = 'Average condition';
      color = '#f59e0b';
    } else if (num >= 20) {
      label = 'Poor condition';
      color = '#f97316';
    } else {
      label = 'Critical condition';
      color = '#d90429';
    }

    if (statusDisplay) {
      statusDisplay.textContent = label;
      statusDisplay.style.color = color;
    }
  }

  slider.addEventListener('input', (e) => {
    updateStatus(e.target.value);
    updateLiveRisk();
    AudioEngine.playBeep(200 + parseInt(e.target.value, 10) * 6, 0.02, 'triangle');
  });

  updateStatus(slider.value);
}

/**
 * Initialize Object Selector and Icon Previews
 */
function initObjectSelector() {
  const select = document.getElementById('object-type-select');
  const iconDisplay = document.getElementById('preview-icon');
  const nameDisplay = document.getElementById('preview-name');
  const baselineDisplay = document.getElementById('preview-baseline');
  const customGroup = document.getElementById('custom-object-group');

  if (!select) return;

  const objectMap = {
    pencil: { name: 'Pencil', icon: '✏️', base: '30 Days' },
    eraser: { name: 'Eraser', icon: '🧽', base: '60 Days' },
    charger: { name: 'Charger Cable', icon: '🔌', base: '180 Days' },
    mug: { name: 'Coffee Mug', icon: '☕', base: '730 Days (2 Years)' },
    sock: { name: 'Favorite Sock', icon: '🧦', base: '120 Days' },
    shoes: { name: 'Everyday Sneakers', icon: '👟', base: '365 Days (1 Year)' },
    earphones: { name: 'Earphones', icon: '🎧', base: '240 Days' },
    toothbrush: { name: 'Toothbrush', icon: '🪥', base: '90 Days' },
    phone_screen: { name: 'Phone Screen', icon: '📱', base: '500 Days' },
    chair: { name: 'Desk Chair', icon: '🪑', base: '1095 Days (3 Years)' },
    water_bottle: { name: 'Water Bottle', icon: '🧊', base: '730 Days (2 Years)' },
    backpack: { name: 'Backpack', icon: '🎒', base: '900 Days' },
    custom: { name: 'Custom Subject', icon: '☠️', base: '180 Days (Estimated)' }
  };

  function updatePreview() {
    const val = select.value;
    const item = objectMap[val] || objectMap.custom;

    if (iconDisplay) iconDisplay.textContent = item.icon;
    if (nameDisplay) nameDisplay.textContent = item.name;
    if (baselineDisplay) baselineDisplay.textContent = `Baseline Lifespan: ${item.base}`;

    if (customGroup) {
      if (val === 'custom') {
        customGroup.style.display = 'block';
        const input = customGroup.querySelector('input');
        if (input) input.required = true;
      } else {
        customGroup.style.display = 'none';
        const input = customGroup.querySelector('input');
        if (input) input.required = false;
      }
    }
    updateLiveRisk();
  }

  select.addEventListener('change', () => {
    updatePreview();
    AudioEngine.playBeep(880, 0.08);
  });

  updatePreview();
}

/**
 * 3. LIVE RISK PREVIEW ENGINE
 * Calculates client-side estimated survival & risk while user interacts with:
 * - usage level
 * - condition
 * - care
 */
function updateLiveRisk() {
  const card = document.getElementById('live-risk-card');
  const badge = document.getElementById('live-risk-badge');
  const probDisplay = document.getElementById('live-survival-pct');

  if (!card || !badge || !probDisplay) return;

  const objectKey = (document.getElementById('object-type-select')?.value || 'pencil').toLowerCase();
  const baseDays = OBJECT_BASELINES[objectKey] || 120;

  // Selected usage
  const usageInput = document.querySelector('input[name="usage"]:checked');
  const usage = usageInput ? usageInput.value : 'Moderate';
  const usageMap = { Light: 1.25, Moderate: 1.00, Heavy: 0.70, Extreme: 0.45 };
  const uMult = usageMap[usage] || 1.00;

  // Condition
  const condInput = document.getElementById('condition-slider');
  const cond = condInput ? parseInt(condInput.value, 10) : 50;
  let condMult = 1.0;
  if (cond >= 90) condMult = 1.20;
  else if (cond >= 70) condMult = 1.00;
  else if (cond >= 40) condMult = 0.75;
  else if (cond >= 20) condMult = 0.50;
  else condMult = 0.25;

  // Care
  const careInput = document.querySelector('input[name="care"]:checked');
  const care = careInput ? careInput.value.toLowerCase() : 'good';
  let careMult = 1.05;
  if (care.includes('excellent')) careMult = 1.20;
  else if (care.includes('good')) careMult = 1.05;
  else if (care.includes('questionable')) careMult = 0.85;
  else if (care.includes('negligent')) careMult = 0.60;
  else if (care.includes('forgot')) careMult = 0.40;

  const rawRemaining = baseDays * uMult * condMult * careMult;
  const ratio = rawRemaining / Math.max(1.0, baseDays);
  const rawProb = (cond * 0.45) + (Math.min(1.2, ratio) * 100 * 0.35) + (uMult * 10) + (careMult * 10);
  const finalProb = Math.max(1, Math.min(99, Math.round(rawProb)));

  probDisplay.textContent = `${finalProb}%`;

  card.classList.remove('safe', 'at-risk', 'critical', 'terminal');

  if (finalProb > 60) {
    card.classList.add('safe');
    badge.textContent = '🟢 SAFE';
    badge.style.color = '#10b981';
  } else if (finalProb >= 30) {
    card.classList.add('at-risk');
    badge.textContent = '🟡 AT RISK';
    badge.style.color = '#f59e0b';
  } else if (finalProb >= 15) {
    card.classList.add('critical');
    badge.textContent = '🟠 CRITICAL';
    badge.style.color = '#f97316';
  } else {
    card.classList.add('terminal');
    badge.textContent = '🔴 TERMINAL ☠️';
    badge.style.color = '#d90429';
  }
}

function initLiveRiskPreview() {
  document.querySelectorAll('input[name="usage"], input[name="care"]').forEach((elem) => {
    elem.addEventListener('change', () => {
      updateLiveRisk();
      AudioEngine.playBeep(520, 0.04);
    });
  });
  updateLiveRisk();
}

/**
 * 4. ADVANCED ANALYSIS ANIMATION SEQUENCE
 * After clicking "☠ BEGIN ANALYSIS":
 * Full-screen terminal sequence showing:
 * MORTEM ENGINE INITIALIZING...
 * [████████░░░░░░░░]
 * IDENTIFYING OBJECT... ✓
 * ANALYZING CONDITION... ✓
 * CALCULATING USAGE DAMAGE... ✓
 * EVALUATING OWNER CARE... ✓
 * CALCULATING LIFESPAN... ✓
 * DETERMINING RISK... ✓
 * SEARCHING FOR CAUSE OF DEATH... ✓
 * FINALIZING REPORT...
 */
function initFormAnalysisModal() {
  const form = document.getElementById('autopsy-form');
  const modal = document.getElementById('analysis-modal');
  const terminalBar = document.getElementById('terminal-bar');

  if (!form || !modal) return;

  const totalSteps = 8;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    modal.classList.add('active');
    AudioEngine.playBeep(440, 0.15, 'sawtooth');

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < totalSteps) {
        const stepElem = document.getElementById(`step-${currentStep}`);
        if (stepElem) {
          stepElem.classList.add('completed');
          const checkElem = stepElem.querySelector('.step-check');
          if (checkElem) checkElem.textContent = '✓';
        }

        // Update Unicode ASCII progress bar
        const totalBarBlocks = 16;
        const fullBlocks = Math.round(((currentStep + 1) / totalSteps) * totalBarBlocks);
        const emptyBlocks = Math.max(0, totalBarBlocks - fullBlocks);
        if (terminalBar) {
          terminalBar.textContent = `[${'█'.repeat(fullBlocks)}${'░'.repeat(emptyBlocks)}]`;
        }

        AudioEngine.playBeep(480 + currentStep * 45, 0.05);
        currentStep++;
      } else {
        clearInterval(interval);
        AudioEngine.playBeep(880, 0.25);
        setTimeout(() => {
          form.submit();
        }, 400);
      }
    }, 280);
  });
}

/**
 * Demo Mode Toggle Control on Intake Form
 */
function initDemoModeToggle() {
  const toggle = document.getElementById('demo-mode-toggle');
  const pill = document.getElementById('demo-toggle-pill');
  const thumb = document.getElementById('demo-toggle-thumb');
  const label = document.getElementById('demo-toggle-label');

  if (!toggle || !pill || !thumb || !label) return;

  function update() {
    if (toggle.checked) {
      pill.style.background = '#d90429';
      pill.style.borderColor = '#ff8598';
      thumb.style.transform = 'translateX(26px)';
      thumb.style.background = '#ffffff';
      label.textContent = 'ON';
      label.style.color = '#ff8598';
      AudioEngine.playBeep(750, 0.08);
    } else {
      pill.style.background = '#262635';
      pill.style.borderColor = 'var(--border)';
      thumb.style.transform = 'translateX(0px)';
      thumb.style.background = '#8e8e9f';
      label.textContent = 'OFF';
      label.style.color = '#8e8e9f';
      AudioEngine.playBeep(450, 0.08);
    }
  }

  toggle.addEventListener('change', update);
}

/**
 * 4. DEMO MODE LIVE COUNTDOWN ENGINE
 * Real-time JavaScript countdown ticking down without page reloads:
 * 00:30 -> 00:29 ... 00:00
 */
let demoCountdownTimer = null;
let currentRemainingSeconds = 30;

function initDemoCountdown() {
  const caseData = window.CASE_DATA || {};
  const isDemo = caseData.demo_mode || (typeof IS_DEMO_MODE !== 'undefined' && IS_DEMO_MODE);
  const isDeceased = caseData.life_status === 'DEAD' || caseData.is_deceased || (typeof IS_ALREADY_DECEASED !== 'undefined' && IS_ALREADY_DECEASED);

  if (!isDemo || isDeceased) {
    return;
  }

  const display = document.getElementById('countdown-display');
  const statDisplay = document.getElementById('stat-remaining-life');
  if (!display) return;

  const nowEpoch = Math.floor(Date.now() / 1000);
  if (caseData.death_timestamp_epoch && caseData.death_timestamp_epoch > nowEpoch) {
    currentRemainingSeconds = Math.max(0, caseData.death_timestamp_epoch - nowEpoch);
  } else if (typeof DEATH_TIMESTAMP_EPOCH !== 'undefined' && DEATH_TIMESTAMP_EPOCH > nowEpoch) {
    currentRemainingSeconds = Math.max(0, DEATH_TIMESTAMP_EPOCH - nowEpoch);
  } else {
    currentRemainingSeconds = caseData.demo_duration_seconds || 30;
  }

  function renderCountdown(secs) {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(remainderSecs).padStart(2, '0')}`;
    display.textContent = str;
    if (statDisplay) {
      statDisplay.textContent = str;
    }
  }

  renderCountdown(currentRemainingSeconds);

  demoCountdownTimer = setInterval(() => {
    currentRemainingSeconds--;

    if (currentRemainingSeconds <= 0) {
      clearInterval(demoCountdownTimer);
      renderCountdown(0);
      triggerDeathEvent();
    } else {
      renderCountdown(currentRemainingSeconds);
      if (currentRemainingSeconds <= 5) {
        AudioEngine.playBeep(420, 0.04, 'sawtooth');
      }
    }
  }, 1000);
}

/**
 * Accelerate Time / Fast Forward for Hackathon Judges
 */
window.triggerFastForwardDeath = function() {
  if (demoCountdownTimer) {
    clearInterval(demoCountdownTimer);
  }
  currentRemainingSeconds = 2;
  const display = document.getElementById('countdown-display');
  if (display) display.textContent = '00:02';
  AudioEngine.playBeep(880, 0.1);

  demoCountdownTimer = setInterval(() => {
    currentRemainingSeconds--;
    if (display) {
      display.textContent = `00:0${Math.max(0, currentRemainingSeconds)}`;
    }
    if (currentRemainingSeconds <= 0) {
      clearInterval(demoCountdownTimer);
      triggerDeathEvent();
    }
  }, 1000);
};

/**
 * 5. DEATH EVENT TRANSITION SEQUENCE (Section 6)
 * When countdown reaches 00:00:
 * - LIFESPAN EXPIRED...
 * - OBJECT STATUS UPDATED...
 * - ☠️ OBJECT DECEASED
 * - Backend /api/declare-death/ is invoked to change life_status = DEAD
 * - Replaces Health Report with Death Certificate option
 */
function triggerDeathEvent() {
  const caseData = window.CASE_DATA || {};
  const caseId = caseData.case_id || (typeof CASE_ID !== 'undefined' ? CASE_ID : null);
  const modal = document.getElementById('death-event-modal');
  const stepText = document.getElementById('death-modal-step-text');
  const progressBar = document.getElementById('death-progress-bar');

  if (!modal) {
    if (caseId) {
      window.location.href = `/api/declare-death/${caseId}`;
    }
    return;
  }

  modal.style.display = 'flex';
  AudioEngine.playBeep(320, 0.3, 'sawtooth');

  const steps = [
    { text: 'LIFESPAN EXPIRED...', pct: '33%', sound: 400 },
    { text: 'OBJECT STATUS UPDATED...', pct: '66%', sound: 520 },
    { text: '☠️ OBJECT DECEASED', pct: '100%', sound: 260 }
  ];

  let stepIdx = 0;
  if (stepText) stepText.textContent = steps[0].text;
  if (progressBar) progressBar.style.width = steps[0].pct;
  AudioEngine.playBeep(steps[0].sound, 0.12);

  const stepInterval = setInterval(() => {
    stepIdx++;
    if (stepIdx < steps.length) {
      if (stepText) stepText.textContent = steps[stepIdx].text;
      if (progressBar) progressBar.style.width = steps[stepIdx].pct;
      AudioEngine.playBeep(steps[stepIdx].sound, 0.12);
    } else {
      clearInterval(stepInterval);
      
      // Backend confirmation: notify server that object is deceased
      if (caseId) {
        fetch(`/api/declare-death/${caseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        .then(() => {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        })
        .catch(() => {
          window.location.reload();
        });
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }, 600);
}

/**
 * Animate Circular Gauge on Result Page
 */
function initGauge() {
  const meter = document.querySelector('.gauge-meter');
  if (!meter) return;

  const prob = parseInt(meter.getAttribute('data-probability') || '0', 10);
  const radius = meter.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  meter.style.strokeDasharray = `${circumference} ${circumference}`;
  meter.style.strokeDashoffset = `${circumference}`;

  setTimeout(() => {
    const offset = circumference - (prob / 100) * circumference;
    meter.style.strokeDashoffset = `${offset}`;
    AudioEngine.playBeep(700, 0.15);
  }, 200);
}

/**
 * Print Certificate Helper
 */
function printCertificate() {
  AudioEngine.playBeep(650, 0.1);
  window.print();
}

/**
 * Confirm Clear History
 */
function confirmClearHistory(e) {
  if (!confirm("CONFIRMATION REQUIRED:\nAre you sure you wish to permanently purge the MORTEM case archives? This action cannot be undone.")) {
    e.preventDefault();
    return false;
  }
  return true;
}
