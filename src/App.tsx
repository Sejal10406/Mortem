/**
 * MORTEM: The Unnecessarily Serious Object Lifespan Predictor ☠️
 * Interactive Forensic Autopsy System & Laboratory Interface
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Skull, 
  Activity, 
  Clock, 
  Printer, 
  Volume2, 
  VolumeX, 
  FileText, 
  RotateCcw, 
  Trash2, 
  ChevronRight, 
  Sparkles,
  Search,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

import { DeathCertificate } from './components/DeathCertificate';

// Import raw JSON data
import objectsCatalog from '../data/objects.json';
import causesCatalog from '../data/causes.json';
import initialPredictions from '../data/predictions.json';

export type RiskLevel = 'SAFE' | 'AT RISK' | 'CRITICAL' | 'TERMINAL';
export type ObjectStatus = 'SAFE' | 'AT RISK' | 'CRITICAL' | 'TERMINAL' | 'DECEASED';
export type ObjectState = 'ALIVE' | 'DECEASED';

export interface PredictionRecord {
  case_id: string;
  mrt_case_id?: string;
  timestamp: string;
  date_of_prediction?: string;
  object_key: string;
  object_name: string;
  icon: string;
  usage: 'Light' | 'Moderate' | 'Heavy' | 'Extreme';
  condition: number;
  health_score?: number;
  care: string;
  notes?: string;
  remaining_days: number;
  remaining_formatted: string;
  survival_probability: number;
  risk: RiskLevel;
  status: ObjectStatus;
  state: ObjectState;
  life_status?: 'ALIVE' | 'DEAD';
  report_type?: 'HEALTH_REPORT' | 'DEATH_CERTIFICATE';
  is_deceased: boolean;
  status_badge?: string;
  report_title?: string;
  risk_desc: string;
  cause_of_death: string;
  last_known_words?: string;
  margin_note?: string;
  closing_doodle?: string;
  forensic_notes?: string[];
  estimated_death_date: string;
  recommended_action: string;
  can_generate_certificate?: boolean;
  death_time?: string;
  date_of_death?: string;
  time_of_death?: string;
  final_risk_level?: string;
  officially_declared?: string;
  demo_mode?: boolean;
  demo_duration_seconds?: number;
  death_timestamp_epoch?: number;
  created_at_epoch?: number;
}

export type ViewTab = 'home' | 'predict' | 'result' | 'certificate' | 'history' | 'about';

// Web Audio API Synthesizer for Clinical Telemetry
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  beep(freq = 600, duration = 0.08, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio might be suppressed by browser autoplay policy
    }
  }

  scanStep(step: number) {
    this.beep(420 + step * 50, 0.06, 'triangle');
  }

  success() {
    this.beep(880, 0.15, 'sine');
    setTimeout(() => this.beep(1174, 0.2, 'sine'), 100);
  }

  critical() {
    this.beep(280, 0.25, 'sawtooth');
  }
}

const sfx = new SoundEffects();

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Predictions Store with localStorage persistence
  const [predictions, setPredictions] = useState<PredictionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mortem_cases');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return initialPredictions as PredictionRecord[];
  });

  // Current active case for Result & Certificate views
  const [currentCase, setCurrentCase] = useState<PredictionRecord | null>(() => {
    return predictions.length > 0 ? predictions[0] : null;
  });

  // Form State
  const [selectedObjectKey, setSelectedObjectKey] = useState<string>('pencil');
  const [customObjectName, setCustomObjectName] = useState<string>('');
  const [usageLevel, setUsageLevel] = useState<'Light' | 'Moderate' | 'Heavy' | 'Extreme'>('Moderate');
  const [conditionValue, setConditionValue] = useState<number>(50);
  const [ownerCare, setOwnerCare] = useState<string>('Good');
  const [caseNotes, setCaseNotes] = useState<string>('');
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Analysis Animation Sequence State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);

  // Demo Countdown & Death Event State
  const [countdownSeconds, setCountdownSeconds] = useState<number>(30);
  const [isDeathTransitioning, setIsDeathTransitioning] = useState<boolean>(false);
  const [deathStepIndex, setDeathStepIndex] = useState<number>(0);
  const [showCertificateUnavailable, setShowCertificateUnavailable] = useState<boolean>(false);

  // History search & filter
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);

  // Strict Certificate Access Control (Requirement 9):
  // Death Certificate must NEVER be generated before the object is actually marked DEAD.
  const handleViewCertificate = (targetCase?: PredictionRecord) => {
    const target = targetCase || currentCase;
    if (!target) return;
    if (target.life_status !== 'DEAD' && target.status !== 'DECEASED' && !target.is_deceased) {
      setCurrentCase(target);
      setShowCertificateUnavailable(true);
      setActiveTab('certificate');
      sfx.beep(250, 0.2, 'sawtooth');
      return;
    }
    setShowCertificateUnavailable(false);
    setCurrentCase(target);
    setActiveTab('certificate');
    sfx.beep(750, 0.08);
  };

  // Live Countdown Hook for Demo Mode
  useEffect(() => {
    if (!currentCase || !currentCase.demo_mode || currentCase.life_status === 'DEAD' || currentCase.status === 'DECEASED' || currentCase.is_deceased) {
      return;
    }

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerDeathEvent();
          return 0;
        }
        if (prev <= 5) {
          sfx.beep(380, 0.04, 'sawtooth');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentCase]);

  // 5. DEATH EVENT: Transition Sequence (Requirement 6)
  // LIFESPAN EXPIRED... -> OBJECT STATUS UPDATED... -> ☠️ OBJECT DECEASED
  const triggerDeathEvent = (targetCase?: PredictionRecord) => {
    const target = targetCase || currentCase;
    if (!target) return;

    setIsDeathTransitioning(true);
    setDeathStepIndex(0);
    sfx.critical();

    const deathSteps = [
      { text: 'LIFESPAN EXPIRED...', sound: 400 },
      { text: 'OBJECT STATUS UPDATED...', sound: 520 },
      { text: '☠️ OBJECT DECEASED', sound: 280 }
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < deathSteps.length) {
        setDeathStepIndex(step);
        sfx.beep(deathSteps[step].sound, 0.1);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          finalizeDeath(target);
          setIsDeathTransitioning(false);
          sfx.success();
        }, 500);
      }
    }, 600);
  };

  const finalizeDeath = (target: PredictionRecord) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fullTimeStr = `${dateStr}, ${timeStr}`;

    const deceasedRecord: PredictionRecord = {
      ...target,
      life_status: 'DEAD',
      report_type: 'DEATH_CERTIFICATE',
      status: 'DECEASED',
      state: 'DECEASED',
      is_deceased: true,
      remaining_days: 0,
      remaining_formatted: '00:00 (EXPIRED)',
      survival_probability: 0,
      death_time: fullTimeStr,
      date_of_death: dateStr,
      time_of_death: timeStr,
      final_risk_level: 'DECEASED',
      report_title: 'DEATH CERTIFICATE',
      risk_desc: 'Official declaration of cessation of object utility.',
      status_badge: '☠ DECEASED',
      can_generate_certificate: true,
      officially_declared: 'UNNECESSARILY DECEASED'
    };

    setCurrentCase(deceasedRecord);
    setPredictions((prev) => prev.map((p) => (p.case_id === target.case_id ? deceasedRecord : p)));
    setCountdownSeconds(0);
  };

  const fastForwardDeath = () => {
    sfx.beep(880, 0.1);
    setCountdownSeconds(2);
  };

  // Sync predictions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mortem_cases', JSON.stringify(predictions));
    } catch (e) {
      console.error(e);
    }
  }, [predictions]);

  useEffect(() => {
    sfx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Telemetry Aggregates (calculated dynamically from predictions.json)
  const stats = useMemo(() => {
    const total = predictions.length;
    const safe = predictions.filter(p => p.risk === 'SAFE').length;
    const atRisk = predictions.filter(p => p.risk === 'AT RISK').length;
    const critical = predictions.filter(p => p.risk === 'CRITICAL').length;
    const terminal = predictions.filter(p => p.risk === 'TERMINAL').length;
    const avgSurvival = total > 0 ? Math.round(predictions.reduce((acc, p) => acc + p.survival_probability, 0) / total) : 0;
    
    return { total, safe, atRisk, critical, terminal, avgSurvival };
  }, [predictions]);

  // Object metadata resolution
  const currentObjectMeta = useMemo(() => {
    const catalog = objectsCatalog as Record<string, {
      name: string;
      icon: string;
      base_lifespan_days: number;
      fragility: number;
      recommended_action: string;
      last_known_words?: string;
      margin_note?: string;
      closing_doodle?: string;
      forensic_notes?: string[];
      causes: string[];
    }>;

    if (selectedObjectKey === 'custom') {
      return {
        name: customObjectName.trim() || 'Custom Subject',
        icon: '☠️',
        base_lifespan_days: 180,
        fragility: 0.7,
        recommended_action: 'Handle with maximum vigilance; empirical failure rate is volatile.',
        last_known_words: '“I did my best in an uncaring universe.”',
        margin_note: 'Another victim of entropy... ☠️',
        closing_doodle: 'Rest in peace, brave object.',
        forensic_notes: [
          'Physical integrity compromised by standard terrestrial physics.',
          'Material fatigue outpaced owner maintenance protocols.',
          'Exhibited dramatic signs of terminal existential decline.',
          'Entropy claimed another faithful everyday companion.'
        ],
        causes: []
      };
    }
    return catalog[selectedObjectKey] || {
      name: 'Unknown Object',
      icon: '📦',
      base_lifespan_days: 100,
      fragility: 0.5,
      recommended_action: 'General surveillance advised.',
      last_known_words: '“I did my best.”',
      margin_note: 'Another victim of standard entropy... ☹',
      closing_doodle: 'Short life. Big dreams.',
      forensic_notes: [
        'Showed signs of wear and tear from excessive use.',
        'Poor care contributed to accelerated decline.',
        'Material fatigue recorded across all axes.',
        'Final moments were brief and unceremonious.'
      ],
      causes: []
    };
  }, [selectedObjectKey, customObjectName]);

  // Condition description helper matching exact hackathon specs:
  // 90–100: Excellent condition
  // 70–89: Good condition
  // 40–69: Average condition
  // 20–39: Poor condition
  // 0–19: Critical condition
  const conditionLabel = useMemo(() => {
    if (conditionValue >= 90) return { label: 'Excellent condition', color: 'text-emerald-400' };
    if (conditionValue >= 70) return { label: 'Good condition', color: 'text-emerald-500' };
    if (conditionValue >= 40) return { label: 'Average condition', color: 'text-amber-400' };
    if (conditionValue >= 20) return { label: 'Poor condition', color: 'text-orange-400' };
    return { label: 'Critical condition', color: 'text-[#d90429]' };
  }, [conditionValue]);

  // Dynamic Unicode block progress bar: ████████░░░░░░░░ 72%
  const conditionBlocks = useMemo(() => {
    const total = 16;
    const full = Math.round((conditionValue / 100) * total);
    const empty = Math.max(0, total - full);
    return '█'.repeat(full) + '░'.repeat(empty);
  }, [conditionValue]);

  // 3. LIVE RISK PREVIEW (calculates live preview without making it authoritative)
  const liveRiskPreview = useMemo(() => {
    const baseDays = currentObjectMeta.base_lifespan_days;
    const usageMap: Record<string, number> = {
      Light: 1.25,
      Moderate: 1.00,
      Heavy: 0.70,
      Extreme: 0.45
    };
    const uMult = usageMap[usageLevel] || 1.00;
    let condMult = 1.0;
    if (conditionValue >= 90) condMult = 1.20;
    else if (conditionValue >= 70) condMult = 1.00;
    else if (conditionValue >= 40) condMult = 0.75;
    else if (conditionValue >= 20) condMult = 0.50;
    else condMult = 0.25;

    const careLower = ownerCare.toLowerCase();
    let careMult = 1.05;
    if (careLower.includes('excellent')) careMult = 1.20;
    else if (careLower.includes('good')) careMult = 1.05;
    else if (careLower.includes('questionable')) careMult = 0.85;
    else if (careLower.includes('negligent')) careMult = 0.60;
    else if (careLower.includes('forgot')) careMult = 0.40;

    const rawRemaining = baseDays * uMult * condMult * careMult;
    const ratio = rawRemaining / Math.max(1.0, baseDays);
    const rawProb = (conditionValue * 0.45) + (Math.min(1.2, ratio) * 100 * 0.35) + (uMult * 10) + (careMult * 10);
    const finalProb = Math.max(1, Math.min(99, Math.round(rawProb)));

    let risk: RiskLevel = 'TERMINAL';
    let badge = '🔴 TERMINAL ☠️';
    let color = 'text-[#d90429]';
    let border = 'border-[#d90429]/60';
    let bg = 'bg-[#d90429]/10';

    if (finalProb > 60) {
      risk = 'SAFE';
      badge = '🟢 SAFE';
      color = 'text-emerald-400';
      border = 'border-emerald-500/40';
      bg = 'bg-emerald-500/10';
    } else if (finalProb >= 30) {
      risk = 'AT RISK';
      badge = '🟡 AT RISK';
      color = 'text-amber-400';
      border = 'border-amber-500/40';
      bg = 'bg-amber-500/10';
    } else if (finalProb >= 15) {
      risk = 'CRITICAL';
      badge = '🟠 CRITICAL';
      color = 'text-orange-400';
      border = 'border-orange-500/40';
      bg = 'bg-orange-500/10';
    }

    return { prob: finalProb, risk, badge, color, border, bg };
  }, [currentObjectMeta, usageLevel, conditionValue, ownerCare]);

  // Calculation Engine matching app.py exactly
  const executeAutopsy = () => {
    sfx.beep(400, 0.2);
    setIsAnalyzing(true);
    setAnalysisStepIndex(0);

    const steps = [
      "IDENTIFYING OBJECT...",
      "ANALYZING CONDITION...",
      "CALCULATING USAGE DAMAGE...",
      "EVALUATING OWNER CARE...",
      "CALCULATING LIFESPAN...",
      "DETERMINING RISK...",
      "SEARCHING FOR CAUSE OF DEATH...",
      "FINALIZING REPORT..."
    ];

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setAnalysisStepIndex(current);
        sfx.scanStep(current);
      } else {
        clearInterval(interval);
        finalizePrediction();
      }
    }, 280);
  };

  const finalizePrediction = () => {
    const baseDays = currentObjectMeta.base_lifespan_days;

    // 1. Usage Multiplier
    const usageMap: Record<string, number> = {
      Light: 1.25,
      Moderate: 1.00,
      Heavy: 0.70,
      Extreme: 0.45
    };
    const usageMult = usageMap[usageLevel] || 1.00;

    // 2. Condition Multiplier
    let condMult = 1.0;
    if (conditionValue >= 90) condMult = 1.20;
    else if (conditionValue >= 70) condMult = 1.00;
    else if (conditionValue >= 40) condMult = 0.75;
    else if (conditionValue >= 20) condMult = 0.50;
    else condMult = 0.25;

    // 3. Care Multiplier
    const careLower = ownerCare.toLowerCase();
    let careMult = 0.85;
    if (careLower.includes('excellent')) careMult = 1.20;
    else if (careLower.includes('good')) careMult = 1.05;
    else if (careLower.includes('questionable')) careMult = 0.85;
    else if (careLower.includes('negligent')) careMult = 0.60;
    else if (careLower.includes('forgot')) careMult = 0.40;

    // 4. Lifespan calculation with controlled random variation (±8%)
    const rawLifespan = baseDays * usageMult * condMult * careMult;
    const jitter = 0.92 + Math.random() * 0.16;
    const remainingDays = Math.max(1.0, Math.round(rawLifespan * jitter * 100) / 100);

    // 5. Survival Probability calculation (matching app.py calculate_survival_probability)
    const ratio = remainingDays / Math.max(1.0, baseDays);
    const cond = Math.max(0, Math.min(100, Math.round(conditionValue)));
    const rawProb = (cond * 0.45) + (Math.min(1.2, ratio) * 100 * 0.35) + (usageMult * 10) + (careMult * 10);
    const probJitter = -2 + Math.random() * 4;
    const survivalProb = Math.max(1, Math.min(99, Math.round(rawProb + probJitter)));

    // 6. Risk Classification matching app.py calculate_risk:
    // 1. SAFE: > 60%
    // 2. AT RISK: 30% - 60%
    // 3. CRITICAL: 15% - 30%
    // 4. TERMINAL: < 15%
    let risk: RiskLevel = 'TERMINAL';
    let riskDesc = "The object has entered its final chapter.";
    let reportTitle = "TERMINAL WARNING";
    let statusBadge = "🔴 TERMINAL";
    let recommendedAction = "Replacement is strongly recommended before the inevitable occurs.";

    if (survivalProb > 60) {
      risk = 'SAFE';
      riskDesc = "Your object is doing surprisingly well.";
      reportTitle = "OBJECT HEALTH REPORT";
      statusBadge = "🟢 SAFE";
      recommendedAction = "Continue normal usage. No immediate intervention required.";
    } else if (survivalProb >= 30) {
      risk = 'AT RISK';
      riskDesc = "The object has shown signs of decline. Nothing dramatic... yet.";
      reportTitle = "EARLY WARNING REPORT";
      statusBadge = "🟡 AT RISK";
      recommendedAction = "Reduce excessive usage and consider keeping a replacement nearby.";
    } else if (survivalProb >= 15) {
      risk = 'CRITICAL';
      riskDesc = "The decline is accelerating.";
      reportTitle = "FINAL WARNING";
      statusBadge = "🟠 CRITICAL";
      recommendedAction = "Replacement is strongly recommended before the inevitable occurs.";
    }

    // A death certificate must NEVER be generated before the object is actually marked DECEASED
    const canGenerateCertificate = false;

    // 7. Human-readable remaining lifespan
    const formatLifespan = (total: number) => {
      const d = Math.floor(total);
      const h = Math.round((total - d) * 24);
      if (total >= 365) {
        const y = Math.floor(total / 365);
        const m = Math.floor((total % 365) / 30);
        return m > 0 ? `${y} Year${y > 1 ? 's' : ''}, ${m} Month${m > 1 ? 's' : ''}` : `${y} Year${y > 1 ? 's' : ''}`;
      } else if (total >= 60) {
        const m = Math.floor(total / 30);
        const remD = Math.floor(total % 30);
        return remD > 0 ? `${m} Months, ${remD} Days` : `${m} Months`;
      } else if (total >= 7) {
        const w = Math.floor(total / 7);
        const remD = Math.floor(total % 7);
        return remD > 0 ? `${w} Week${w > 1 ? 's' : ''}, ${remD} Day${remD > 1 ? 's' : ''}` : `${w} Week${w > 1 ? 's' : ''}`;
      } else if (d > 0) {
        return h > 0 ? `${d} Day${d > 1 ? 's' : ''}, ${h} Hour${h > 1 ? 's' : ''}` : `${d} Day${d > 1 ? 's' : ''}`;
      }
      return `${Math.max(1, h)} Hour${h > 1 ? 's' : ''}`;
    };

    let actualRemainingDays = remainingDays;
    let actualRemainingFormatted = formatLifespan(remainingDays);
    let demoSecs = 0;

    if (demoMode) {
      demoSecs = 30;
      actualRemainingDays = 30 / 86400.0;
      actualRemainingFormatted = "00:30 (DEMO COUNTDOWN)";
      setCountdownSeconds(30);
    }

    // 8. Cause of death selection
    const causes: string[] = [];
    const causesData = causesCatalog as {
      by_object: Record<string, string[]>;
      by_condition: Record<string, string[]>;
      by_care: Record<string, string[]>;
      general: string[];
    };

    if (causesData.by_object[selectedObjectKey]) {
      causes.push(...causesData.by_object[selectedObjectKey]);
    }
    if (currentObjectMeta.causes && currentObjectMeta.causes.length > 0) {
      causes.push(...currentObjectMeta.causes);
    }
    if (conditionValue < 20 && causesData.by_condition.destroyed) {
      causes.push(...causesData.by_condition.destroyed);
    } else if (conditionValue < 40 && causesData.by_condition.poor) {
      causes.push(...causesData.by_condition.poor);
    }
    if (careLower.includes('negligent') && causesData.by_care.negligent) {
      causes.push(...causesData.by_care.negligent);
    } else if (careLower.includes('forgot') && causesData.by_care.forgotten) {
      causes.push(...causesData.by_care.forgotten);
    }
    if (causes.length === 0) {
      causes.push(...causesData.general);
    }
    const selectedCause = causes[Math.floor(Math.random() * causes.length)];

    // 9. Case Number & Date
    const nextCaseNum = String(predictions.length + 430).padStart(5, '0');
    const now = new Date();
    const deathDate = new Date(now.getTime() + (demoMode ? 30 * 1000 : actualRemainingDays * 24 * 60 * 60 * 1000));
    const dateFormatted = deathDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + deathDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newRecord: PredictionRecord = {
      case_id: nextCaseNum,
      mrt_case_id: `MRT-${nextCaseNum}`,
      timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
      date_of_prediction: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      object_key: selectedObjectKey,
      object_name: selectedObjectKey === 'custom' && customObjectName.trim() ? customObjectName.trim() : currentObjectMeta.name,
      icon: currentObjectMeta.icon,
      usage: usageLevel,
      condition: conditionValue,
      health_score: conditionValue,
      care: ownerCare,
      notes: caseNotes.trim() || 'Subject examined without prior sworn affidavits.',
      remaining_days: actualRemainingDays,
      remaining_formatted: actualRemainingFormatted,
      survival_probability: survivalProb,
      risk,
      status: 'SAFE' === risk ? 'SAFE' : ('AT RISK' === risk ? 'AT RISK' : ('CRITICAL' === risk ? 'CRITICAL' : 'TERMINAL')),
      state: 'ALIVE',
      life_status: 'ALIVE',
      report_type: 'HEALTH_REPORT',
      is_deceased: false,
      status_badge: '● ALIVE',
      report_title: 'OBJECT HEALTH REPORT',
      risk_desc: riskDesc,
      cause_of_death: selectedCause,
      last_known_words: currentObjectMeta.last_known_words,
      margin_note: currentObjectMeta.margin_note,
      closing_doodle: currentObjectMeta.closing_doodle,
      forensic_notes: currentObjectMeta.forensic_notes,
      estimated_death_date: dateFormatted,
      recommended_action: recommendedAction,
      can_generate_certificate: canGenerateCertificate,
      demo_mode: demoMode,
      demo_duration_seconds: demoSecs,
      death_timestamp_epoch: Math.floor(now.getTime() / 1000) + (demoMode ? 30 : Math.round(actualRemainingDays * 86400)),
      created_at_epoch: Math.floor(now.getTime() / 1000),
      officially_declared: 'UNNECESSARILY DECEASED'
    };

    setPredictions(prev => [newRecord, ...prev]);
    setCurrentCase(newRecord);
    setIsAnalyzing(false);
    setActiveTab('result');

    if (risk === 'TERMINAL') sfx.critical();
    else sfx.success();
  };

  // Preset benchmark loader
  const loadBenchmarkPencil = () => {
    setSelectedObjectKey('pencil');
    setUsageLevel('Heavy');
    setConditionValue(32);
    setOwnerCare('Questionable');
    setCaseNotes('Used relentlessly during calculus and algorithms exam revision.');
    sfx.beep(550, 0.08);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return predictions.filter(item => {
      const matchFilter = historyFilter === 'ALL' || item.risk === historyFilter;
      const matchSearch = historySearch === '' || 
        item.object_name.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.case_id.includes(historySearch) ||
        item.cause_of_death.toLowerCase().includes(historySearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [predictions, historyFilter, historySearch]);

  const clearAllHistory = () => {
    setPredictions([]);
    setShowClearConfirm(false);
    sfx.beep(300, 0.2, 'sawtooth');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-[#f5f5f5] flex flex-col font-sans selection:bg-[#d90429] selection:text-white">
      
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-25 z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* TOP BAR CONTRACT: exactly 3 zones (Brand, 4-6 Links, 1-2 Primary Actions) */}
      <header className="sticky top-0 z-50 bg-[#0b0b0f]/90 backdrop-blur-md border-b border-[#262635] px-6 py-3.5 flex items-center justify-between no-print">
        {/* Zone 1: Single text wordmark */}
        <button 
          onClick={() => { setActiveTab('home'); sfx.beep(600, 0.05); }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-[#d90429] text-xl group-hover:scale-110 transition-transform">☠</span>
          <span className="font-['Chakra_Petch'] tracking-wider">MORTEM</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#8e8e9f]">
          <button 
            onClick={() => { setActiveTab('home'); sfx.beep(600, 0.05); }} 
            className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'home' ? 'text-white font-semibold' : ''}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('predict'); sfx.beep(600, 0.05); }} 
            className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'predict' ? 'text-white font-semibold' : ''}`}
          >
            Autopsy Intake
          </button>
          <button 
            onClick={() => { setActiveTab('history'); sfx.beep(600, 0.05); }} 
            className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'history' ? 'text-white font-semibold' : ''}`}
          >
            Case Archives
          </button>
          <button 
            onClick={() => { setActiveTab('about'); sfx.beep(600, 0.05); }} 
            className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'about' ? 'text-white font-semibold' : ''}`}
          >
            Methodology
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-[#8e8e9f] hover:text-white transition-colors rounded-lg hover:bg-[#141419] cursor-pointer"
            title={soundEnabled ? "Mute Laboratory Audio" : "Enable Laboratory Audio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#d90429]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={() => { setActiveTab('predict'); sfx.beep(750, 0.08); }}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#d90429] hover:bg-[#b50322] rounded-md transition-all shadow-[0_4px_14px_rgba(217,4,41,0.3)] hover:shadow-[0_6px_20px_rgba(217,4,41,0.5)] cursor-pointer whitespace-nowrap flex items-center gap-1.5 font-['Chakra_Petch']"
          >
            <span>☠</span>
            <span>Analyze Object</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">

        {/* =========================================================================
            TAB 1: HOME / DASHBOARD
            ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-10">
            {/* Hero Card */}
            <div className="bg-[#141419] border border-[#262635] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative shadow-2xl">
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#d90429] uppercase tracking-widest mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#d90429] animate-pulse" />
                  Official Object Forensic Bureau
                </div>
                <h1 className="font-['Chakra_Petch'] text-4xl sm:text-5xl font-bold tracking-tight mb-2 text-white">
                  MORTEM ☠️
                </h1>
                <div className="font-['Chakra_Petch'] text-sm sm:text-base font-bold text-[#d90429] uppercase tracking-wider mb-3">
                  THE UNNECESSARILY SERIOUS OBJECT LIFESPAN PREDICTOR
                </div>
                <p className="text-[#8e8e9f] text-sm sm:text-base mb-4 leading-relaxed max-w-xl">
                  Every object has a lifespan. Most people simply don't care enough to calculate it.
                </p>
                <div className="border-l-2 border-[#d90429] pl-3.5 py-1 mb-8 text-sm font-mono text-slate-300 italic">
                  "Because even your pencil deserves to know when it will die."
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => { setActiveTab('predict'); sfx.beep(700, 0.08); }}
                    className="px-8 py-4 bg-[#d90429] hover:bg-[#b50322] text-white rounded-lg font-['Chakra_Petch'] font-bold text-base uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(217,4,41,0.4)] hover:shadow-[0_6px_28px_rgba(217,4,41,0.6)] cursor-pointer flex items-center gap-2.5"
                  >
                    <Skull className="w-5 h-5" />
                    <span>☠ ANALYZE NEW OBJECT</span>
                  </button>
                  <button
                    onClick={loadBenchmarkPencil}
                    className="px-5 py-3.5 bg-[#1c1c24] hover:bg-[#252532] text-slate-200 border border-[#262635] rounded-lg font-['Chakra_Petch'] font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Try Benchmark: Stressed Pencil</span>
                  </button>
                </div>
              </div>

              {/* Hero Image Section with laser scanning line */}
              <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[340px] bg-[#0f0f14] border-t lg:border-t-0 lg:border-l border-[#262635] overflow-hidden">
                <img 
                  src="/images/hero.jpg" 
                  alt="MORTEM Forensic Autopsy Scanner"
                  className="w-full h-full object-cover opacity-85 brightness-90 contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141419] via-transparent to-transparent lg:hidden" />
                {/* Red Scanning Laser Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-[#d90429] shadow-[0_0_12px_#d90429,0_0_24px_#d90429] animate-scanline pointer-events-none" />
              </div>
            </div>

            {/* Dynamic Telemetry Stats (6 Metrics) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#141419] border border-[#262635] rounded-lg p-4">
                <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider mb-1 min-h-[28px]">Total Objects Analyzed</div>
                <div className="text-2xl font-mono font-bold text-white tabular-nums">{stats.total}</div>
              </div>
              <div className="bg-[#141419] border border-[#262635] rounded-lg p-4">
                <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider mb-1 min-h-[28px]">Safe Objects</div>
                <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">{stats.safe}</div>
              </div>
              <div className="bg-[#141419] border border-[#262635] rounded-lg p-4">
                <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider mb-1 min-h-[28px]">At Risk Objects</div>
                <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">{stats.atRisk}</div>
              </div>
              <div className="bg-[#141419] border border-[#262635] rounded-lg p-4">
                <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider mb-1 min-h-[28px]">Critical Cases</div>
                <div className="text-2xl font-mono font-bold text-orange-400 tabular-nums">{stats.critical}</div>
              </div>
              <div className="bg-[#141419] border border-[#262635] rounded-lg p-4">
                <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider mb-1 min-h-[28px]">Terminal Cases</div>
                <div className="text-2xl font-mono font-bold text-[#d90429] tabular-nums">{stats.terminal}</div>
              </div>
              <div className="bg-[#141419] border border-[#262635] rounded-lg p-4">
                <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider mb-1 min-h-[28px]">Average Survival</div>
                <div className="text-2xl font-mono font-bold text-white tabular-nums">{stats.avgSurvival}%</div>
              </div>
            </div>

            {/* Recent Cases Preview */}
            {predictions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wide">
                    RECENT AUTOPSY RECORDS
                  </h3>
                  <button 
                    onClick={() => { setActiveTab('history'); sfx.beep(600, 0.05); }}
                    className="text-xs font-mono text-[#d90429] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View All Archives &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predictions.slice(0, 3).map((item) => (
                    <div 
                      key={item.case_id}
                      className="bg-[#141419] border border-[#262635] rounded-lg p-5 flex flex-col justify-between hover:border-[#4b4b66] transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <span className="text-[#8e8e9f]">CASE #{item.case_id}</span>
                          <span className={`font-bold ${
                            item.risk === 'TERMINAL' ? 'text-[#d90429]' :
                            item.risk === 'CRITICAL' ? 'text-rose-500' :
                            item.risk === 'AT RISK' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {item.risk}
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.object_name}</span>
                        </div>
                        <p className="text-xs text-[#8e8e9f] line-clamp-2 italic mb-4">
                          "{item.cause_of_death}"
                        </p>
                      </div>
                      <div className="pt-3 border-t border-[#262635] flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-300">{item.remaining_formatted}</span>
                        <button
                          onClick={() => {
                            setCurrentCase(item);
                            setActiveTab('result');
                            sfx.beep(700, 0.05);
                          }}
                          className="text-xs font-['Chakra_Petch'] text-[#d90429] hover:text-white transition-colors cursor-pointer"
                        >
                          View Dossier &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: PREDICT / AUTOPSY INTAKE FORM
            ========================================================================= */}
        {activeTab === 'predict' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#141419] border border-[#262635] rounded-xl p-6 sm:p-8 shadow-xl">
              <div className="border-b border-[#262635] pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="font-['Chakra_Petch'] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    OBJECT AUTOPSY
                  </h2>
                  <p className="text-sm text-[#8e8e9f]">
                    Provide the evidence. We will provide the inevitable.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#d90429]">
                  PROTOCOL REF: MORTEM-ENG-2026
                </div>
              </div>

              <div className="space-y-6">
                {/* 1. Object Type */}
                <div>
                  <div className="flex items-center justify-between text-xs font-['Chakra_Petch'] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    <span>1. Object Subject</span>
                    <span className="text-xs font-mono text-[#8e8e9f]">REQUIRED</span>
                  </div>
                  <select
                    value={selectedObjectKey}
                    onChange={(e) => {
                      setSelectedObjectKey(e.target.value);
                      sfx.beep(700, 0.05);
                    }}
                    className="w-full bg-[#0f0f15] border border-[#262635] rounded-md px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d90429] transition-colors"
                  >
                    <option value="pencil">✏️ Pencil</option>
                    <option value="eraser">🧽 Eraser</option>
                    <option value="charger">🔌 Charger Cable</option>
                    <option value="mug">☕ Coffee Mug</option>
                    <option value="sock">🧦 Favorite Sock</option>
                    <option value="shoes">👟 Everyday Sneakers</option>
                    <option value="earphones">🎧 Earphones</option>
                    <option value="toothbrush">🪥 Toothbrush</option>
                    <option value="phone_screen">📱 Phone Screen</option>
                    <option value="chair">🪑 Desk Chair</option>
                    <option value="water_bottle">🧊 Water Bottle</option>
                    <option value="backpack">🎒 Backpack</option>
                    <option value="custom">☠️ Custom Object...</option>
                  </select>

                  {/* Custom Object Input */}
                  {selectedObjectKey === 'custom' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Enter custom item name (e.g. Wireless Mouse, Umbrella, Plant)..."
                        value={customObjectName}
                        onChange={(e) => setCustomObjectName(e.target.value)}
                        className="w-full bg-[#0f0f15] border border-[#262635] rounded-md px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d90429]"
                      />
                    </div>
                  )}

                  {/* Dynamic Visual Object Card */}
                  <div className="mt-3 p-3.5 bg-[#0f0f15] border border-dashed border-[#262635] rounded-md flex items-center gap-3.5">
                    <span className="text-3xl">{currentObjectMeta.icon}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{currentObjectMeta.name}</div>
                      <div className="text-xs font-mono text-[#8e8e9f]">
                        Baseline Natural Lifespan: {currentObjectMeta.base_lifespan_days} Days
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Usage Level */}
                <div>
                  <div className="text-xs font-['Chakra_Petch'] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    2. Usage Frequency
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Light', 'Moderate', 'Heavy', 'Extreme'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          setUsageLevel(level);
                          sfx.beep(550, 0.05);
                        }}
                        className={`py-2.5 px-3 rounded-md text-xs font-['Chakra_Petch'] font-semibold transition-all cursor-pointer border ${
                          usageLevel === level
                            ? 'bg-[#1c1c24] text-white border-[#d90429] shadow-[0_0_12px_rgba(217,4,41,0.25)]'
                            : 'bg-[#0f0f15] text-[#8e8e9f] border-[#262635] hover:border-[#4b4b66]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Condition Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-['Chakra_Petch'] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    <span>3. Physical Condition</span>
                    <span className={`font-mono text-sm font-bold ${conditionLabel.color}`}>
                      {conditionLabel.label}
                    </span>
                  </div>
                  <div className="bg-[#0f0f15] border border-[#262635] rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between font-mono text-sm">
                      <span className="text-[#8e8e9f] text-xs uppercase tracking-wider">CONDITION</span>
                      <span className="text-white font-bold tracking-wider">
                        <span className="text-[#d90429]">{conditionBlocks}</span> {conditionValue}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={conditionValue}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setConditionValue(val);
                        sfx.beep(250 + val * 5, 0.02, 'triangle');
                      }}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#d90429]"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-[#8e8e9f]">
                      <span>0% (Critical)</span>
                      <span>25% (Poor)</span>
                      <span>50% (Average)</span>
                      <span>75% (Good)</span>
                      <span>100% (Excellent)</span>
                    </div>
                  </div>
                </div>

                {/* 4. Owner Care */}
                <div>
                  <div className="text-xs font-['Chakra_Petch'] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    4. Owner Care & Custody
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { key: 'Excellent', label: 'Excellent' },
                      { key: 'Good', label: 'Good' },
                      { key: 'Questionable', label: 'Questionable' },
                      { key: 'Negligent', label: 'Negligent' },
                      { key: 'I forgot this object existed', label: 'Forgotten' }
                    ].map((care) => (
                      <button
                        key={care.key}
                        type="button"
                        onClick={() => {
                          setOwnerCare(care.key);
                          sfx.beep(550, 0.05);
                        }}
                        className={`py-2 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer border text-center ${
                          ownerCare === care.key
                            ? 'bg-[#1c1c24] text-white border-[#d90429] shadow-[0_0_12px_rgba(217,4,41,0.25)]'
                            : 'bg-[#0f0f15] text-[#8e8e9f] border-[#262635] hover:border-[#4b4b66]'
                        }`}
                      >
                        {care.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Optional Notes */}
                <div>
                  <div className="flex items-center justify-between text-xs font-['Chakra_Petch'] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    <span>5. Sworn Circumstantial Evidence</span>
                    <span className="text-xs font-mono text-[#8e8e9f]">OPTIONAL</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe object habits, prior drops, or impending finals week stress..."
                    value={caseNotes}
                    onChange={(e) => setCaseNotes(e.target.value)}
                    className="w-full bg-[#0f0f15] border border-[#262635] rounded-md px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d90429]"
                  />
                </div>

                {/* 3. LIVE RISK PREVIEW BOX */}
                <div className={`p-4 rounded-lg border ${liveRiskPreview.border} ${liveRiskPreview.bg} transition-all`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono mb-2">
                    <span className="uppercase tracking-wider font-bold text-slate-300">CURRENT RISK (ESTIMATED PREVIEW)</span>
                    <span className="text-[11px] text-slate-500 italic">Preview only · Final calculated by Flask</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`font-['Chakra_Petch'] text-xl font-bold tracking-wide ${liveRiskPreview.color}`}>
                      {liveRiskPreview.badge}
                    </div>
                    <div className="font-mono text-sm text-slate-200">
                      Estimated survival: <span className="font-bold text-white text-base">{liveRiskPreview.prob}%</span>
                    </div>
                  </div>
                </div>

                {/* 6. DEMO MODE TOGGLE (HACKATHON EVALUATION MODE) */}
                <div className="p-4 rounded-lg bg-[#d90429]/10 border border-dashed border-[#d90429]/40 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-['Chakra_Petch'] font-bold text-sm text-white tracking-wide">
                        ☠️ DEMO MODE
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-[#d90429]/20 text-[#ff8598] px-2 py-0.5 rounded border border-[#d90429]/30">
                        HACKATHON SPEED
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Converts multi-day lifespan into a live <strong>02:30</strong> countdown to watch the object expire in real-time.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode(!demoMode);
                      sfx.beep(demoMode ? 450 : 750, 0.08);
                    }}
                    className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      demoMode
                        ? 'bg-[#d90429] text-white border-[#ff8598] shadow-[0_0_12px_rgba(217,4,41,0.5)]'
                        : 'bg-[#1c1c24] text-slate-400 border-[#262635] hover:border-slate-500'
                    }`}
                  >
                    <span>{demoMode ? '✓ ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={executeAutopsy}
                    className="w-full py-4 bg-[#d90429] hover:bg-[#b50322] text-white font-['Chakra_Petch'] font-bold text-base uppercase tracking-wider rounded-lg transition-all shadow-[0_4px_16px_rgba(217,4,41,0.35)] hover:shadow-[0_6px_24px_rgba(217,4,41,0.5)] cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <span>☠</span>
                    <span>BEGIN ANALYSIS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: RESULT / FORENSIC REPORT (4-TIER RISK-BASED BEHAVIOR)
            ========================================================================= */}
        {activeTab === 'result' && currentCase && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Route Protection Warning Alert */}
            {certificateError && (
              <div className="bg-[#d90429]/15 border border-[#d90429] text-[#ff8598] p-4 rounded-lg flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">☠</span>
                  <div className="font-mono text-xs sm:text-sm font-semibold">
                    {certificateError}
                  </div>
                </div>
                <button
                  onClick={() => setCertificateError(null)}
                  className="text-xs font-mono text-[#ff8598] hover:text-white underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Top action row */}
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              <button
                onClick={() => { setCertificateError(null); setActiveTab('predict'); sfx.beep(600, 0.05); }}
                className="text-xs font-mono text-[#8e8e9f] hover:text-white transition-colors cursor-pointer"
              >
                &larr; Return to Intake
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#141419] border border-[#262635] hover:border-slate-500 text-xs font-['Chakra_Petch'] text-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                {/* Death Certificate Button: STRICT ACCESS CONTROL - ONLY SHOWN WHEN DECEASED */}
                {currentCase.status === 'DECEASED' || currentCase.is_deceased ? (
                  <button
                    onClick={() => handleViewCertificate(currentCase)}
                    className="px-4 py-1.5 bg-[#d90429] hover:bg-[#b50322] text-white text-xs font-['Chakra_Petch'] font-semibold uppercase tracking-wider rounded-md transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <span>☠</span>
                    <span>GENERATE DEATH CERTIFICATE</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-[#141419] border border-[#262635] text-slate-500 text-xs font-mono rounded-md cursor-not-allowed">
                    🔒 Certificate Locked (Alive)
                  </span>
                )}
              </div>
            </div>

            {/* Forensic Dossier Card */}
            <div className="bg-[#141419] border border-[#262635] rounded-xl overflow-hidden shadow-2xl">
              {/* Dossier Header matching Core Rule */}
              <div className="bg-[#0f0f15] border-b border-[#262635] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-widest mb-0.5">
                    MORTEM
                  </div>
                  <div className={`font-['Chakra_Petch'] text-2xl sm:text-3xl font-black tracking-wider ${
                    currentCase.life_status === 'DEAD' || currentCase.status === 'DECEASED' ? 'text-[#ff2a4b]' : 'text-emerald-400'
                  }`}>
                    {currentCase.life_status === 'DEAD' || currentCase.status === 'DECEASED' ? 'DEATH CERTIFICATE' : 'OBJECT HEALTH REPORT'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-[#8e8e9f] uppercase tracking-wider">CASE ID:</span>
                    <span className="font-mono text-sm font-bold text-white">MRT-{currentCase.case_id}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs font-mono text-[#8e8e9f] uppercase tracking-wider">OBJECT:</span>
                    <span className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wide">
                      {currentCase.object_name.toUpperCase()}
                    </span>
                    <span className="text-xl">{currentCase.icon}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2">
                  {/* Large Status Badge: ● ALIVE vs ☠ DECEASED */}
                  <div className={`px-4 py-2 rounded-lg font-['Chakra_Petch'] font-bold text-lg tracking-wide border ${
                    currentCase.life_status === 'DEAD' || currentCase.status === 'DECEASED'
                      ? 'bg-[#d90429]/25 border-[#d90429] text-[#ff4d6d] shadow-[0_0_24px_rgba(217,4,41,0.5)] animate-pulse'
                      : 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                  }`}>
                    {currentCase.life_status === 'DEAD' || currentCase.status === 'DECEASED' ? '☠ DECEASED' : '● ALIVE'}
                  </div>
                  <div className="text-xs font-mono text-[#8e8e9f]">LOGGED: {currentCase.timestamp}</div>
                </div>
              </div>

              {/* 5 Primary Diagnostic Indicators: Current State, Survival Prob, Remaining Life, Condition, Usage */}
              <div className="bg-[#0b0b0f] border-b border-[#262635] p-4 sm:px-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-[#141419] border border-[#262635] rounded-md p-3">
                  <div className="text-[10px] font-mono text-[#8e8e9f] uppercase tracking-wider">Current State</div>
                  <div className={`text-base font-mono font-bold mt-0.5 ${currentCase.status === 'DECEASED' ? 'text-[#ff4d6d]' : 'text-emerald-400'}`}>
                    {currentCase.status === 'DECEASED' ? '☠️ DECEASED' : '🟢 ALIVE'}
                  </div>
                </div>

                <div className="bg-[#141419] border border-[#262635] rounded-md p-3">
                  <div className="text-[10px] font-mono text-[#8e8e9f] uppercase tracking-wider">Survival Probability</div>
                  <div className={`text-xl font-mono font-bold mt-0.5 ${
                    currentCase.status === 'DECEASED' ? 'text-[#ff4d6d]' :
                    currentCase.risk === 'SAFE' ? 'text-emerald-400' :
                    currentCase.risk === 'AT RISK' ? 'text-amber-400' :
                    currentCase.risk === 'CRITICAL' ? 'text-orange-400' : 'text-[#d90429]'
                  }`}>
                    {currentCase.survival_probability}%
                  </div>
                </div>

                <div className="bg-[#141419] border border-[#262635] rounded-md p-3">
                  <div className="text-[10px] font-mono text-[#8e8e9f] uppercase tracking-wider">Estimated Remaining Life</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5 truncate">
                    {currentCase.status === 'DECEASED'
                      ? '00:00 (EXPIRED)'
                      : currentCase.demo_mode
                      ? `${String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:${String(countdownSeconds % 60).padStart(2, '0')}`
                      : currentCase.remaining_formatted.toUpperCase()}
                  </div>
                </div>

                <div className="bg-[#141419] border border-[#262635] rounded-md p-3">
                  <div className="text-[10px] font-mono text-[#8e8e9f] uppercase tracking-wider">Current Condition</div>
                  <div className="text-lg font-mono font-bold text-white mt-0.5">
                    {currentCase.condition}%
                  </div>
                </div>

                <div className="bg-[#141419] border border-[#262635] rounded-md p-3">
                  <div className="text-[10px] font-mono text-[#8e8e9f] uppercase tracking-wider">Usage</div>
                  <div className="text-sm font-mono font-bold text-slate-200 mt-0.5 uppercase">
                    {currentCase.usage}
                  </div>
                </div>
              </div>

              {/* Dossier Main Content */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left 7 cols: Diagnostic findings */}
                <div className="lg:col-span-7 space-y-6">

                  {/* =========================================================
                      DEMO MODE LIVE COUNTDOWN BANNER
                      ========================================================= */}
                  {currentCase.demo_mode && currentCase.status !== 'DECEASED' && (
                    <div className="bg-[#d90429]/15 border-2 border-[#d90429] rounded-lg p-5 text-center shadow-[0_0_30px_rgba(217,4,41,0.25)] space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[#ff8598] uppercase tracking-wider">
                          ⚡ DEMO MODE ACTIVE · LIVE TIME REMAINING
                        </span>
                        <span className="bg-[#d90429]/25 text-[#ff8598] px-2 py-0.5 rounded border border-[#d90429]/40 text-[10px]">
                          HACKATHON PROTOCOL
                        </span>
                      </div>
                      
                      <div className="text-xs font-mono text-slate-300 uppercase tracking-widest">
                        LIVE TIME REMAINING
                      </div>

                      <div className="font-mono text-5xl font-black text-[#ff2a4b] tracking-wider drop-shadow-[0_0_16px_rgba(255,42,75,0.6)]">
                        {String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:{String(countdownSeconds % 60).padStart(2, '0')}
                      </div>

                      <div className="text-xs text-slate-400">
                        Watch countdown reach 00:00 to trigger the automatic forensic death transition and unlock the certificate.
                      </div>

                      <button
                        type="button"
                        onClick={fastForwardDeath}
                        className="px-3.5 py-1.5 bg-[#141419] hover:bg-[#1f1a24] text-[#ff8598] border border-[#d90429]/60 hover:border-[#d90429] rounded-md font-mono text-xs font-bold transition-all cursor-pointer"
                      >
                        ⚡ FAST FORWARD TIME (COUNTDOWN TO 00:02)
                      </button>
                    </div>
                  )}

                  {/* =========================================================
                      ACTUAL DEATH STATE: DECEASED
                      ========================================================= */}
                  {(currentCase.status === 'DECEASED' || currentCase.is_deceased) && (
                    <div className="space-y-6">
                      <div className="bg-[#d90429]/25 border-2 border-[#d90429] rounded-lg p-5 shadow-[0_0_35px_rgba(217,4,41,0.35)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-['Chakra_Petch'] text-2xl font-black text-[#ff2a4b] tracking-wide">
                            ☠️ OBJECT DECEASED
                          </div>
                          <div className="font-mono text-xs font-bold text-white bg-[#d90429] px-3 py-1 rounded uppercase tracking-wider">
                            FINAL CLASSIFICATION: DECEASED
                          </div>
                        </div>
                        <p className="text-base text-rose-100 font-medium">
                          "The object's predicted lifespan has reached zero. Official cessation of utility declared."
                        </p>
                      </div>

                      {/* DECEASED Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#0f0f15] border border-[#d90429]/50 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Time of Death</div>
                          <div className="font-mono font-bold text-[#ff8598] text-base mt-0.5">
                            {currentCase.death_time || currentCase.timestamp}
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-[#d90429]/50 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Survival Probability</div>
                          <div className="font-mono font-bold text-[#ff8598] text-xl mt-0.5">
                            {currentCase.survival_probability}%
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-[#d90429]/50 p-3.5 rounded-md col-span-2">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Final Cause of Death</div>
                          <div className="text-sm text-white italic font-medium mt-0.5">
                            "{currentCase.cause_of_death}"
                          </div>
                        </div>
                      </div>

                      {/* Unlocked Certificate Action Box + Print Button */}
                      <div className="bg-[#d90429]/15 border-2 border-dashed border-[#d90429] rounded-lg p-5 text-center space-y-3">
                        <div className="text-sm font-mono font-bold text-[#ff8598] uppercase tracking-wider">
                          ☠ DEATH CERTIFICATE AVAILABLE
                        </div>
                        <p className="text-xs text-slate-300">
                          Subject has officially expired. Digital death certificate is ready for generation and printing.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => handleViewCertificate(currentCase)}
                            className="flex-1 py-3.5 bg-[#d90429] hover:bg-[#b50322] text-white font-['Chakra_Petch'] font-bold text-sm uppercase tracking-wider rounded-lg transition-all shadow-[0_4px_20px_rgba(217,4,41,0.5)] cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>☠</span>
                            <span>VIEW DEATH CERTIFICATE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { sfx.beep(650, 0.08); window.print(); }}
                            className="px-4 py-3.5 bg-[#1c1c24] hover:bg-[#252532] text-slate-200 border border-[#3b3b50] hover:border-slate-400 font-['Chakra_Petch'] font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                            title="Print this Deceased Record"
                          >
                            <Printer className="w-4 h-4 text-rose-400" />
                            <span>Print Record</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      1. SAFE STATE (survival_probability > 60%)
                      ========================================================= */}
                  {currentCase.status !== 'DECEASED' && currentCase.risk === 'SAFE' && (
                    <div className="space-y-6">
                      <div className="bg-emerald-950/25 border border-emerald-500/40 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-['Chakra_Petch'] text-xl font-bold text-emerald-400 tracking-wide">
                            🟢 SAFE
                          </div>
                          <div className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded">
                            OBJECT HEALTH REPORT
                          </div>
                        </div>
                        <p className="text-base text-emerald-100 font-medium">
                          "Your object is doing surprisingly well."
                        </p>
                      </div>

                      {/* SAFE Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#0f0f15] border border-emerald-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Survival Probability</div>
                          <div className="font-mono font-bold text-emerald-400 text-xl mt-0.5">
                            {currentCase.survival_probability}%
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-emerald-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Estimated Remaining Life</div>
                          <div className="font-mono font-semibold text-white text-base mt-0.5">
                            {currentCase.remaining_formatted}
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-emerald-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Risk Level</div>
                          <div className="font-bold text-emerald-400 text-base mt-0.5">
                            SAFE
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-emerald-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Current State</div>
                          <div className="font-semibold text-emerald-400 text-base mt-0.5">
                            ALIVE
                          </div>
                        </div>
                      </div>

                      {/* SAFE Recommendation */}
                      <div className="bg-[#0f0f15] border border-emerald-500/30 p-4 rounded-md">
                        <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
                          Health Recommendation
                        </div>
                        <div className="text-sm text-slate-200">
                          "Continue normal usage. No immediate intervention required."
                        </div>
                      </div>

                      {/* KEEP USING & PRINT Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => { setCertificateError(null); setActiveTab('predict'); sfx.beep(700, 0.05); }}
                          className="flex-1 py-3.5 bg-[#141419] hover:bg-[#1a251f] text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 font-['Chakra_Petch'] font-bold text-sm uppercase tracking-wider rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>✓</span>
                          <span>KEEP USING</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { sfx.beep(650, 0.08); window.print(); }}
                          className="px-5 py-3.5 bg-[#1c1c24] hover:bg-[#252532] text-slate-200 border border-[#3b3b50] hover:border-slate-400 font-['Chakra_Petch'] font-semibold text-sm rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                          title="Print this Health Report"
                        >
                          <Printer className="w-4 h-4 text-emerald-400" />
                          <span>Print Report</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      2. AT RISK STATE (30% <= survival_probability <= 60%)
                      ========================================================= */}
                  {currentCase.status !== 'DECEASED' && currentCase.risk === 'AT RISK' && (
                    <div className="space-y-6">
                      <div className="bg-amber-950/25 border border-amber-500/40 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-['Chakra_Petch'] text-xl font-bold text-amber-400 tracking-wide">
                            🟡 AT RISK
                          </div>
                          <div className="font-mono text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded">
                            EARLY WARNING REPORT
                          </div>
                        </div>
                        <p className="text-base text-amber-100 font-medium">
                          "The object has shown signs of decline. Nothing dramatic... yet."
                        </p>
                      </div>

                      {/* AT RISK Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#0f0f15] border border-amber-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Survival Probability</div>
                          <div className="font-mono font-bold text-amber-400 text-xl mt-0.5">
                            {currentCase.survival_probability}%
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-amber-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Estimated Remaining Life</div>
                          <div className="font-mono font-semibold text-white text-base mt-0.5">
                            {currentCase.remaining_formatted}
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-amber-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Risk Level</div>
                          <div className="font-bold text-amber-400 text-base mt-0.5">
                            AT RISK
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-amber-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Current State</div>
                          <div className="font-semibold text-emerald-400 text-base mt-0.5">
                            ALIVE
                          </div>
                        </div>
                      </div>

                      {/* AT RISK Recommendation */}
                      <div className="bg-[#0f0f15] border border-amber-500/30 p-4 rounded-md">
                        <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider mb-1 font-bold">
                          Early Warning Recommendation
                        </div>
                        <div className="text-sm text-slate-200">
                          "Reduce excessive usage and consider keeping a replacement nearby."
                        </div>
                      </div>

                      {/* MONITOR OBJECT & PRINT Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => { setCertificateError(null); setActiveTab('predict'); sfx.beep(700, 0.05); }}
                          className="flex-1 py-3.5 bg-[#141419] hover:bg-[#252014] text-amber-400 border border-amber-500/50 hover:border-amber-400 font-['Chakra_Petch'] font-bold text-sm uppercase tracking-wider rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>⚠️</span>
                          <span>MONITOR OBJECT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { sfx.beep(650, 0.08); window.print(); }}
                          className="px-5 py-3.5 bg-[#1c1c24] hover:bg-[#252532] text-slate-200 border border-[#3b3b50] hover:border-slate-400 font-['Chakra_Petch'] font-semibold text-sm rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                          title="Print this Health Report"
                        >
                          <Printer className="w-4 h-4 text-amber-400" />
                          <span>Print Report</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      3. CRITICAL STATE (15% <= survival_probability < 30%)
                      ========================================================= */}
                  {currentCase.status !== 'DECEASED' && currentCase.risk === 'CRITICAL' && (
                    <div className="space-y-6">
                      <div className="bg-orange-950/25 border border-orange-500/40 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-['Chakra_Petch'] text-xl font-bold text-orange-400 tracking-wide">
                            🟠 CRITICAL
                          </div>
                          <div className="font-mono text-xs font-bold text-orange-400 bg-orange-500/15 px-2.5 py-1 rounded">
                            FINAL WARNING
                          </div>
                        </div>
                        <p className="text-base text-orange-100 font-medium">
                          "The decline is accelerating."
                        </p>
                      </div>

                      {/* CRITICAL Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#0f0f15] border border-orange-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Survival Probability</div>
                          <div className="font-mono font-bold text-orange-400 text-xl mt-0.5">
                            {currentCase.survival_probability}%
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-orange-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Estimated Remaining Life</div>
                          <div className="font-mono font-semibold text-white text-base mt-0.5">
                            {currentCase.remaining_formatted}
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-orange-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Risk Level</div>
                          <div className="font-bold text-orange-400 text-base mt-0.5">
                            CRITICAL
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-orange-500/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Current State</div>
                          <div className="font-semibold text-emerald-400 text-base mt-0.5">
                            ALIVE
                          </div>
                        </div>
                      </div>

                      {/* CRITICAL Cause Callout */}
                      <div className="bg-[#0f0f15] border-l-4 border-orange-500 p-4 rounded-r-md">
                        <div className="text-xs font-mono text-orange-400 uppercase tracking-wider mb-1 font-bold">
                          Predicted Fatal Cause of Death
                        </div>
                        <div className="text-sm text-white italic font-medium">
                          "{currentCase.cause_of_death}"
                        </div>
                      </div>

                      {/* CRITICAL Recommendation */}
                      <div className="bg-[#0f0f15] border border-orange-500/30 p-4 rounded-md">
                        <div className="text-[11px] font-mono text-orange-400 uppercase tracking-wider mb-1 font-bold">
                          Critical Directive
                        </div>
                        <div className="text-sm text-slate-200">
                          "Replacement is strongly recommended before the inevitable occurs."
                        </div>
                      </div>

                      {/* MANDATORY SECTION 2 BOTTOM CARD (CRITICAL) */}
                      <div className="bg-[#141419] border border-emerald-500/30 rounded-lg p-5 text-center space-y-2">
                        <div className="text-base font-mono font-bold text-emerald-400 flex items-center justify-center gap-2">
                          <span>🟢</span>
                          <span>OBJECT IS STILL ALIVE</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-400">
                          Death Certificate: 🔒 NOT AVAILABLE
                        </div>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          "The object must reach the end of its predicted lifespan before a death certificate can be issued."
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => { sfx.beep(650, 0.08); window.print(); }}
                            className="px-5 py-2.5 bg-[#1c1c24] hover:bg-[#252532] text-slate-200 border border-[#3b3b50] hover:border-slate-400 font-['Chakra_Petch'] font-semibold text-xs rounded-md transition-colors cursor-pointer inline-flex items-center gap-2"
                            title="Print this Health Report"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-400" />
                            <span>Print Health Report</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      4. TERMINAL STATE (survival_probability < 15%)
                      ========================================================= */}
                  {currentCase.status !== 'DECEASED' && currentCase.risk === 'TERMINAL' && (
                    <div className="space-y-6">
                      <div className="bg-[#d90429]/15 border border-[#d90429]/60 rounded-lg p-5 shadow-[0_0_25px_rgba(217,4,41,0.2)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-['Chakra_Petch'] text-xl font-bold text-[#d90429] tracking-wide">
                            🔴 TERMINAL
                          </div>
                          <div className="font-mono text-xs font-bold text-[#d90429] bg-[#d90429]/20 px-2.5 py-1 rounded">
                            TERMINAL WARNING
                          </div>
                        </div>
                        <p className="text-base text-rose-100 font-medium">
                          "The object has entered its final chapter."
                        </p>
                      </div>

                      {/* TERMINAL Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#0f0f15] border border-[#d90429]/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Survival Probability</div>
                          <div className="font-mono font-bold text-[#d90429] text-xl mt-0.5">
                            {currentCase.survival_probability}%
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-[#d90429]/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Estimated Remaining Life</div>
                          <div className="font-mono font-semibold text-white text-base mt-0.5">
                            {currentCase.remaining_formatted}
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-[#d90429]/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Risk Level</div>
                          <div className="font-bold text-[#d90429] text-base mt-0.5">
                            TERMINAL
                          </div>
                        </div>
                        <div className="bg-[#0f0f15] border border-[#d90429]/30 p-3.5 rounded-md">
                          <div className="text-[11px] font-mono text-[#8e8e9f] uppercase">Current State</div>
                          <div className="font-semibold text-emerald-400 text-base mt-0.5">
                            ALIVE
                          </div>
                        </div>
                      </div>

                      {/* TERMINAL Cause Callout */}
                      <div className="bg-[#0f0f15] border-l-4 border-[#d90429] p-4 rounded-r-md">
                        <div className="text-xs font-mono text-[#d90429] uppercase tracking-wider mb-1 font-bold">
                          Predicted Imminent Cause of Death
                        </div>
                        <div className="text-sm text-white italic font-medium">
                          "{currentCase.cause_of_death}"
                        </div>
                      </div>

                      {/* TERMINAL Recommendation */}
                      <div className="bg-[#0f0f15] border border-[#262635] p-4 rounded-md">
                        <div className="text-[11px] font-mono text-[#8e8e9f] uppercase mb-1">
                          Terminal Directive
                        </div>
                        <div className="text-sm text-slate-200">
                          "Replacement is strongly recommended before the inevitable occurs."
                        </div>
                      </div>

                      {/* MANDATORY SECTION 2 BOTTOM CARD (TERMINAL) */}
                      <div className="bg-[#141419] border border-emerald-500/30 rounded-lg p-5 text-center space-y-2">
                        <div className="text-base font-mono font-bold text-emerald-400 flex items-center justify-center gap-2">
                          <span>🟢</span>
                          <span>OBJECT IS STILL ALIVE</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-400">
                          Death Certificate: 🔒 NOT AVAILABLE
                        </div>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          "The object must reach the end of its predicted lifespan before a death certificate can be issued."
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => { sfx.beep(650, 0.08); window.print(); }}
                            className="px-5 py-2.5 bg-[#1c1c24] hover:bg-[#252532] text-slate-200 border border-[#3b3b50] hover:border-slate-400 font-['Chakra_Petch'] font-semibold text-xs rounded-md transition-colors cursor-pointer inline-flex items-center gap-2"
                            title="Print this Health Report"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#d90429]" />
                            <span>Print Health Report</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sworn Affidavit */}
                  {currentCase.notes && (
                    <div className="bg-[#0f0f15] border border-dashed border-[#262635] p-3.5 rounded-md">
                      <div className="text-[11px] font-mono text-[#8e8e9f] uppercase mb-1">
                        Owner Testimony on Record
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        "{currentCase.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Right 5 cols: Gauges & Life Readouts */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  {/* Gauge Card with dynamic risk-themed color */}
                  <div className="bg-[#0f0f15] border border-[#262635] rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <div className="relative w-36 h-36 flex items-center justify-center mb-3">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#1f1f2b"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={
                            currentCase.status === 'DECEASED' ? '#ff4d6d' :
                            currentCase.risk === 'SAFE' ? '#10b981' :
                            currentCase.risk === 'AT RISK' ? '#f59e0b' :
                            currentCase.risk === 'CRITICAL' ? '#f97316' : '#d90429'
                          }
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * currentCase.survival_probability) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`font-mono text-3xl font-bold tabular-nums ${
                          currentCase.status === 'DECEASED' ? 'text-[#ff4d6d]' :
                          currentCase.risk === 'SAFE' ? 'text-emerald-400' :
                          currentCase.risk === 'AT RISK' ? 'text-amber-400' :
                          currentCase.risk === 'CRITICAL' ? 'text-orange-400' : 'text-[#d90429]'
                        }`}>
                          {currentCase.survival_probability}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-[#8e8e9f] uppercase tracking-wider font-semibold">
                      Survival Probability
                    </div>
                  </div>

                  {/* Estimated Remaining Life Box */}
                  <div className="bg-[#0f0f15] border border-[#262635] rounded-lg p-5 text-center">
                    <div className="text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider mb-1">
                      Estimated Remaining Lifespan
                    </div>
                    <div className="font-mono text-2xl font-bold text-white mb-1">
                      {currentCase.status === 'DECEASED'
                        ? '00:00 (EXPIRED)'
                        : currentCase.demo_mode
                        ? `${String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:${String(countdownSeconds % 60).padStart(2, '0')}`
                        : currentCase.remaining_formatted}
                    </div>
                    <div className="text-xs font-mono text-[#8e8e9f]">
                      Subject: <span className="text-white font-semibold">{currentCase.icon} {currentCase.object_name}</span>
                    </div>
                  </div>

                  {/* Quick Action Button matching Risk State */}
                  {currentCase.status === 'DECEASED' || currentCase.is_deceased ? (
                    <button
                      type="button"
                      onClick={() => handleViewCertificate(currentCase)}
                      className="w-full py-3 bg-[#d90429] hover:bg-[#b50322] text-white rounded-md font-['Chakra_Petch'] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>☠</span>
                      <span>Generate Death Certificate</span>
                    </button>
                  ) : currentCase.risk === 'SAFE' ? (
                    <button
                      type="button"
                      onClick={() => { setCertificateError(null); setActiveTab('predict'); sfx.beep(700, 0.05); }}
                      className="w-full py-3 bg-[#1c1c24] hover:bg-[#252532] text-emerald-400 border border-emerald-500/40 rounded-md font-['Chakra_Petch'] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>✓</span>
                      <span>KEEP USING</span>
                    </button>
                  ) : currentCase.risk === 'AT RISK' ? (
                    <button
                      type="button"
                      onClick={() => { setCertificateError(null); setActiveTab('predict'); sfx.beep(700, 0.05); }}
                      className="w-full py-3 bg-[#1c1c24] hover:bg-[#252532] text-amber-400 border border-amber-500/40 rounded-md font-['Chakra_Petch'] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>⚠️</span>
                      <span>MONITOR OBJECT</span>
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-[#141419] text-slate-500 border border-[#262635] rounded-md font-mono text-xs text-center cursor-not-allowed">
                      🔒 Certificate Locked (Object is alive)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: OFFICIAL DIGITAL DEATH CERTIFICATE (PROTECTED VIEW - REQUIREMENT 9)
            ========================================================================= */}
        {activeTab === 'certificate' && currentCase && (
          (currentCase.life_status === 'DEAD' || currentCase.status === 'DECEASED' || currentCase.is_deceased) ? (
            <DeathCertificate
              caseData={currentCase}
              onBack={() => { setActiveTab('result'); sfx.beep(600, 0.05); }}
              onNewAutopsy={() => { setActiveTab('predict'); sfx.beep(700, 0.05); }}
            />
          ) : (
            <div className="max-w-xl mx-auto text-center py-12 px-6 bg-[#141419] border border-red-500/40 rounded-xl my-8 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 border-2 border-red-500/50 rounded-full flex items-center justify-center text-3xl">
                🔒
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
                LEGAL ACCESS RESTRICTION · CASE #{currentCase.case_id}
              </div>
              <h2 className="text-2xl font-bold font-['Chakra_Petch'] text-white mb-2">
                🔒 CERTIFICATE UNAVAILABLE
              </h2>
              <p className="text-lg text-rose-300 font-semibold mb-6">
                "The object is still alive."
              </p>
              <div className="bg-[#0b0b0f] border border-[#262635] rounded-md p-4 mb-6 text-left font-mono text-xs text-slate-400 space-y-1.5">
                <div>Subject: <span className="text-white font-bold">{currentCase.object_name} {currentCase.icon}</span></div>
                <div>Life Status: <span className="text-emerald-400 font-bold">● ALIVE</span></div>
                <div>Active Report: <span className="text-emerald-400 font-bold">OBJECT HEALTH REPORT</span></div>
                <div>Risk Classification: <span className="text-amber-400 font-bold">{currentCase.risk}</span></div>
                <div>Life Remaining: <span className="text-white font-bold">{currentCase.remaining_formatted}</span></div>
                <div className="pt-2 border-t border-[#262635] text-slate-500 text-[11px]">
                  The object must reach the end of its predicted lifespan before a death certificate can be issued.
                </div>
              </div>
              <button
                onClick={() => { setActiveTab('result'); sfx.beep(600, 0.05); }}
                className="w-full py-3 bg-[#d90429] hover:bg-[#b50322] text-white rounded-md font-['Chakra_Petch'] text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Return to Health Report
              </button>
            </div>
          )
        )}

        {/* =========================================================================
            TAB 5: CASE ARCHIVES / HISTORY
            ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-[#8e8e9f] uppercase tracking-wider mb-1">
                  OFFICIAL AUTOPSY ARCHIVES
                </div>
                <h2 className="font-['Chakra_Petch'] text-3xl font-bold text-white tracking-wide">
                  CASE ARCHIVES
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {predictions.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3.5 py-2 bg-[#1c1c24] hover:bg-[#262632] border border-[#262635] text-[#d90429] text-xs font-['Chakra_Petch'] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Archives</span>
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab('predict'); sfx.beep(700, 0.05); }}
                  className="px-4 py-2 bg-[#d90429] hover:bg-[#b50322] text-white text-xs font-['Chakra_Petch'] font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>☠</span>
                  <span>New Autopsy</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#141419] border border-[#262635] p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search subject, cause, or case #..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-[#0f0f15] border border-[#262635] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d90429]"
                />
              </div>

              {/* Segmented Risk Filter */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-[#0f0f15] rounded-md border border-[#262635]">
                {['ALL', 'TERMINAL', 'CRITICAL', 'AT RISK', 'SAFE'].map((risk) => (
                  <button
                    key={risk}
                    onClick={() => { setHistoryFilter(risk); sfx.beep(600, 0.03); }}
                    className={`px-3 py-1 text-xs font-['Chakra_Petch'] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      historyFilter === risk ? 'bg-[#1c1c24] text-white font-bold' : 'text-[#8e8e9f] hover:text-white'
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>

            {/* Archives Table */}
            {filteredHistory.length > 0 ? (
              <div className="bg-[#141419] border border-[#262635] rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0f0f15] border-b border-[#262635] text-[11px] font-mono text-[#8e8e9f] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Case #</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Condition</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4">Remaining Life</th>
                        <th className="py-3 px-4">Survival %</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262635]">
                      {filteredHistory.map((item) => (
                        <tr key={item.case_id} className="hover:bg-[#1c1c24]/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                            #{item.case_id}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.object_name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                            {item.condition}%
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-xs font-mono font-bold ${
                              item.risk === 'TERMINAL' ? 'text-[#d90429]' :
                              item.risk === 'CRITICAL' ? 'text-rose-500' :
                              item.risk === 'AT RISK' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {item.risk}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-200">
                            {item.remaining_formatted}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-white">
                            {item.survival_probability}%
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setCertificateError(null);
                                setCurrentCase(item);
                                setActiveTab('result');
                                sfx.beep(700, 0.05);
                              }}
                              className="px-2.5 py-1 text-xs font-['Chakra_Petch'] bg-[#0f0f15] hover:bg-[#252532] border border-[#262635] text-slate-200 rounded transition-colors cursor-pointer mr-2"
                            >
                              Dossier
                            </button>
                            {(item.risk === 'CRITICAL' || item.risk === 'TERMINAL') && (
                              <button
                                onClick={() => {
                                  handleViewCertificate(item);
                                }}
                                className="px-2.5 py-1 text-xs font-['Chakra_Petch'] bg-[#d90429]/15 hover:bg-[#d90429]/30 border border-[#d90429]/50 text-[#d90429] rounded transition-colors cursor-pointer"
                              >
                                Certificate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-[#141419] border border-dashed border-[#262635] rounded-xl p-12 text-center">
                <Skull className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white mb-1">
                  NO RECORDS FOUND
                </h3>
                <p className="text-xs text-[#8e8e9f] max-w-sm mx-auto mb-6">
                  No autopsies match the current query or the archives have been purged.
                </p>
                <button
                  onClick={() => { setActiveTab('predict'); sfx.beep(700, 0.05); }}
                  className="px-4 py-2 bg-[#d90429] text-white text-xs font-['Chakra_Petch'] font-semibold uppercase tracking-wider rounded-md"
                >
                  Analyze An Object
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 6: ABOUT / METHODOLOGY
            ========================================================================= */}
        {activeTab === 'about' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="text-xs font-mono text-[#d90429] uppercase tracking-widest">
                THE FORENSIC CHARTER
              </div>
              <h1 className="font-['Chakra_Petch'] text-4xl font-bold text-white">
                ABOUT MORTEM
              </h1>
              <p className="text-sm text-[#8e8e9f] max-w-md mx-auto">
                Turning completely unnecessary predictions into an unnecessarily official, clinically grave experience.
              </p>
            </div>

            {/* Manifesto Box */}
            <div className="bg-[#141419] border-l-4 border-[#d90429] border-y border-r border-[#262635] p-6 rounded-r-xl">
              <div className="font-mono text-xl font-bold text-white mb-2">
                "Scientific? No.<br />Dramatic? Absolutely."
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Every pencil, mug, charging cord, and sock quietly endures human brutality, academic panic, Monday mornings, and washing machine wormholes. Most humans do not care enough to calculate their remaining days. MORTEM establishes official forensic justice for the inanimate.
              </p>
            </div>

            {/* 8-step pipeline */}
            <div className="space-y-3">
              <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wide">
                THE 8-STEP FORENSIC PIPELINE
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { num: '01', title: 'Subject Identification', desc: 'Cross-references item with baseline mechanical lifespans in data/objects.json.' },
                  { num: '02', title: 'Condition Calibration', desc: 'Translates tactile integrity (0% Destroyed to 100% Mint) into material wear coefficients.' },
                  { num: '03', title: 'Usage Impact Assessment', desc: 'Measures operating cycles from gentle preservation (1.25x) to extreme stress testing (0.45x).' },
                  { num: '04', title: 'Owner Responsibility Scoring', desc: 'Penalizes neglect in bottom drawers, erratic backpack knots, and table-edge balancing.' },
                  { num: '05', title: 'Rule-Based Lifespan Engine', desc: 'Multi-variable multipliers combined with controlled stochastic entropy jitter.' },
                  { num: '06', title: 'Risk Stratification', desc: 'Assigns clinical classifications: SAFE (>75%), AT RISK (50-75%), CRITICAL (20-50%), TERMINAL (<20%).' },
                  { num: '07', title: 'Cause of Death Synthesis', desc: 'Interrogates data/causes.json to isolate the tragic fatal mechanism.' },
                  { num: '08', title: 'Official Dossier & Certificate', desc: 'Issues verifiable case number (MORTEM-XXXXX) and notarized printable Certificate of Death.' }
                ].map((step) => (
                  <div key={step.num} className="bg-[#141419] border border-[#262635] p-3.5 rounded-lg flex gap-3">
                    <span className="font-mono font-bold text-[#d90429] text-sm">{step.num}.</span>
                    <div>
                      <div className="font-semibold text-white mb-0.5">{step.title}</div>
                      <div className="text-[#8e8e9f]">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer & Future Scope */}
            <div className="bg-[#0f0f15] border border-[#262635] rounded-xl p-5 text-xs text-[#8e8e9f] space-y-3">
              <div className="font-['Chakra_Petch'] text-sm font-bold text-white uppercase">
                SCIENTIFIC DISCLAIMER
              </div>
              <p>
                MORTEM is an intentional satire and rule-based engineering project. While the mathematical multipliers and risk thresholds are genuine, the predictions remain dramatically humorous. No actual pencils were physically executed during software tests.
              </p>
              <div className="pt-2 border-t border-[#262635] font-mono text-[11px] text-slate-400">
                Future Roadmap: Neural wear regression models · Digital memorial graveyard · Barcode camera scanner.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Full-screen Forensic Terminal Analysis Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d12] border border-[#33334d] rounded-xl p-6 sm:p-8 max-w-lg w-full text-left shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(217,4,41,0.25)] font-mono">
            <div className="flex items-center justify-between border-b border-[#262635] pb-3 mb-4">
              <span className="font-['Chakra_Petch'] font-bold text-white tracking-wider flex items-center gap-2">
                <Skull className="w-5 h-5 text-[#d90429]" />
                MORTEM FORENSIC ENGINE
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                PROCESSING
              </span>
            </div>

            <div className="text-xs font-bold text-[#d90429] mb-2 tracking-wide">
              MORTEM ENGINE INITIALIZING...
            </div>

            {/* Unicode Block Progress Bar [████████░░░░░░░░] */}
            <div className="text-sm text-[#d90429] tracking-widest mb-4">
              {(() => {
                const total = 16;
                const full = Math.round(((analysisStepIndex + 1) / 8) * total);
                const empty = Math.max(0, total - full);
                return `[${'█'.repeat(full)}${'░'.repeat(empty)}]`;
              })()}
            </div>

            {/* 8 Stepped Forensic Checkpoints */}
            <div className="space-y-1.5 text-xs bg-[#09090d] border border-[#1f1f2e] rounded-md p-3.5">
              {[
                "IDENTIFYING OBJECT...",
                "ANALYZING CONDITION...",
                "CALCULATING USAGE DAMAGE...",
                "EVALUATING OWNER CARE...",
                "CALCULATING LIFESPAN...",
                "DETERMINING RISK...",
                "SEARCHING FOR CAUSE OF DEATH...",
                "FINALIZING REPORT..."
              ].map((stepName, idx) => {
                const isDone = idx <= analysisStepIndex;
                const isCurrent = idx === analysisStepIndex;
                return (
                  <div 
                    key={stepName}
                    className={`flex items-center justify-between transition-colors ${
                      isDone ? 'text-slate-200' : 'text-slate-600'
                    }`}
                  >
                    <span className={isCurrent ? 'text-amber-400 font-semibold' : ''}>{stepName}</span>
                    <span className="font-bold text-emerald-400">{isDone ? '✓' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141419] border border-[#262635] rounded-xl p-6 max-w-sm w-full text-center">
            <AlertTriangle className="w-10 h-10 text-[#d90429] mx-auto mb-3" />
            <h4 className="font-['Chakra_Petch'] text-base font-bold text-white mb-2">
              PURGE ARCHIVE DOSSIERS?
            </h4>
            <p className="text-xs text-[#8e8e9f] mb-5">
              This will permanently delete all stored case records from local storage. This action cannot be reversed.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-[#0f0f15] hover:bg-[#1c1c24] text-slate-300 text-xs font-['Chakra_Petch'] rounded-md border border-[#262635] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={clearAllHistory}
                className="px-4 py-2 bg-[#d90429] hover:bg-[#b50322] text-white text-xs font-['Chakra_Petch'] font-semibold rounded-md cursor-pointer"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#262635] py-6 px-4 text-center text-xs font-mono text-[#8e8e9f] no-print">
        <div className="max-w-4xl mx-auto space-y-1">
          <div className="text-slate-300 font-semibold tracking-wider">
            MORTEM FORENSIC OBJECT DIVISION · PREDICTING THE INEVITABLE
          </div>
          <div>Scientific? No. Dramatic? Absolutely. Because even your pencil deserves to know when it will die.</div>
          <div className="text-slate-600 text-[11px] pt-1">&copy; 2026 MORTEM. All rights reserved under the laws of thermodynamics.</div>
        </div>
      </footer>
    </div>
  );
}
