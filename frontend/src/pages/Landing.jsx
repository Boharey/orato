import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import {
  ArrowRight, TrendingUp, Zap, Eye, Mic, Target, Calendar,
  ChevronDown, Play, Square, BarChart2, FileText
} from 'lucide-react';

/* ── Scroll‑reveal hook ───────────────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Animated counter ─────────────────────────────────────────────────────── */
function Counter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Product Demo Component (sneak peek) ──────────────────────────────────── */
const DEMO_STAGES = [
  { id: 'idle',      label: 'Ready',     duration: 1200 },
  { id: 'recording', label: 'Recording', duration: 3500 },
  { id: 'analyzing', label: 'Analyzing', duration: 2500 },
  { id: 'results',   label: 'Results',   duration: 4000 },
];

const DEMO_WORDS = [
  { w: 'I', f: false }, { w: 'think', f: false }, { w: 'um', f: true },
  { w: 'the', f: false }, { w: 'best', f: false }, { w: 'way', f: false },
  { w: 'to', f: false }, { w: 'like', f: true }, { w: 'improve', f: false },
  { w: 'your', f: false }, { w: 'speaking', f: false }, { w: 'is', f: false },
  { w: 'to', f: false }, { w: 'uh', f: true }, { w: 'practice', f: false },
  { w: 'consistently', f: false }, { w: 'and', f: false }, { w: 'get', f: false },
  { w: 'real', f: false }, { w: 'feedback.', f: false },
];

const METRICS = [
  { label: 'Words/Min',    value: '142',  unit: 'wpm',   color: '#22c55e', grade: 'good',    pct: 71  },
  { label: 'Filler Words', value: '3',    unit: 'found', color: '#f59e0b', grade: 'warning', pct: 15  },
  { label: 'Eye Contact',  value: '87',   unit: '%',     color: '#22c55e', grade: 'good',    pct: 87  },
  { label: 'Long Pauses',  value: '1',    unit: 'pause', color: '#22c55e', grade: 'good',    pct: 95  },
];

function ProductDemo() {
  const [stage, setStage] = useState(0);
  const [recSec, setRecSec] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [metricIdx, setMetricIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [ref, visible] = useReveal(0.2);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    runDemo();
  }, [visible]);

  const runDemo = async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    setStage(0);
    await sleep(1200);

    setStage(1);
    setRecSec(0);
    for (let i = 1; i <= 7; i++) {
      await sleep(500);
      setRecSec(i);
    }

    setStage(2);
    setWordIdx(0);
    for (let i = 0; i < DEMO_WORDS.length; i++) {
      await sleep(100);
      setWordIdx(i + 1);
    }
    await sleep(600);

    setStage(3);
    setMetricIdx(0);
    const scoreTarget = 88;
    const scoreStep = scoreTarget / 30;
    let s = 0;
    for (let i = 0; i < 30; i++) {
      await sleep(40);
      s = Math.min(scoreTarget, Math.round(s + scoreStep));
      setScore(s);
    }
    for (let i = 1; i <= METRICS.length; i++) {
      await sleep(350);
      setMetricIdx(i);
    }

    await sleep(4000);
    setWordIdx(0); setScore(0); setMetricIdx(0); setRecSec(0);
    started.current = false;
    runDemo();
  };

  const stageLabel = DEMO_STAGES[stage]?.label || '';

  return (
    <div ref={ref} className="demo-shell">
      {/* Browser chrome */}
      <div className="demo-chrome">
        <div className="demo-dots">
          <span style={{background:'#ff5f57'}} /><span style={{background:'#febc2e'}} /><span style={{background:'#28c840'}} />
        </div>
        <div className="demo-url">orato.app / evaluation</div>
        <div style={{width:48}} />
      </div>

      {/* App UI */}
      <div className="demo-body">
        <div className="demo-sidebar">
          {['Dashboard','Evaluation','Training','Profile'].map((item, i) => (
            <div key={item} className="demo-nav-item" style={{ background: i === 1 ? '#2E4F4F' : 'transparent', color: i === 1 ? '#fff' : '#9CA3AF' }}>
              <div className="demo-nav-dot" style={{ background: i === 1 ? '#FF6B35' : '#E2E4DE' }} />
              {item}
            </div>
          ))}
        </div>

        <div className="demo-main">
          <div className="demo-page-header">
            <div>
              <div className="demo-page-title">Evaluation</div>
              <div className="demo-page-sub">Record yourself and get instant AI feedback</div>
            </div>
            <div className="demo-stage-badge" style={{ background: stage === 1 ? '#fee2e2' : stage === 2 ? '#fef3c7' : stage === 3 ? '#dcfce7' : '#f1f5f1', color: stage === 1 ? '#dc2626' : stage === 2 ? '#d97706' : stage === 3 ? '#16a34a' : '#6b7280' }}>
              {stage === 1 && <span className="demo-rec-dot" />}
              {stageLabel}
            </div>
          </div>

          <div className="demo-cols">
            <div className="demo-left">
              <div className="demo-video-box">
                <div className="demo-video-bg" />
                {stage >= 1 && (
                  <div className="demo-face">
                    <div className="demo-face-head" />
                    <div className="demo-face-shoulders" />
                    <div className="demo-eye demo-eye-l" style={{ background: stage === 3 ? '#22c55e' : '#60a5fa' }} />
                    <div className="demo-eye demo-eye-r" style={{ background: stage === 3 ? '#22c55e' : '#60a5fa' }} />
                  </div>
                )}
                {stage === 1 && (
                  <div className="demo-rec-badge">
                    <span className="demo-rec-dot" /> REC {recSec}s
                  </div>
                )}
                {stage === 2 && (
                  <div className="demo-analyzing-overlay">
                    <div className="demo-spinner" />
                    <span>Analyzing...</span>
                  </div>
                )}
                {stage === 3 && (
                  <>
                    <div className="demo-gaze-dot" style={{ top: '30%', left: '45%', animationDelay: '0s' }} />
                    <div className="demo-gaze-dot" style={{ top: '32%', left: '52%', animationDelay: '.4s' }} />
                    <div className="demo-gaze-dot" style={{ top: '28%', left: '48%', animationDelay: '.8s' }} />
                  </>
                )}
              </div>
              <div className="demo-btns">
                {stage === 0 && <div className="demo-btn demo-btn-orange"><Play className="demo-btn-icon" /> Start Recording</div>}
                {stage === 1 && <div className="demo-btn demo-btn-red"><Square className="demo-btn-icon" /> Stop Recording</div>}
                {stage === 2 && <div className="demo-btn demo-btn-gray" style={{ opacity: .5 }}><BarChart2 className="demo-btn-icon" /> Analyzing...</div>}
                {stage === 3 && <div className="demo-btn demo-btn-orange"><Play className="demo-btn-icon" /> New Recording</div>}
              </div>
            </div>

            <div className="demo-right">
              {stage < 3 ? (
                <div className="demo-transcript-box">
                  <div className="demo-box-label"><FileText style={{ width: 12, height: 12 }} /> Transcript</div>
                  <div className="demo-transcript-text">
                    {DEMO_WORDS.slice(0, wordIdx).map((w, i) => (
                      <span key={i} className={w.f ? 'demo-filler-word' : ''}>{w.w} </span>
                    ))}
                    {stage === 2 && wordIdx < DEMO_WORDS.length && <span className="demo-cursor" />}
                  </div>
                  {stage === 0 && <div className="demo-empty-hint">Your transcript will appear here after recording...</div>}
                </div>
              ) : (
                <div className="demo-results">
                  <div className="demo-score-wrap">
                    <div className="demo-score-ring">
                      <svg viewBox="0 0 72 72" width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#E2E4DE" strokeWidth="5" />
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#22c55e" strokeWidth="5"
                          strokeDasharray={`${(score / 100) * 188.5} 188.5`} strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray .05s linear' }} />
                      </svg>
                      <div className="demo-score-num">{score}</div>
                    </div>
                    <div>
                      <div className="demo-score-label">Combined Score</div>
                      <div className="demo-score-grade" style={{ color: score >= 75 ? '#16a34a' : '#d97706' }}>
                        {score >= 75 ? 'Excellent' : 'Good'}
                      </div>
                    </div>
                  </div>

                  <div className="demo-metrics">
                    {METRICS.map((m, i) => (
                      <div key={m.label} className="demo-metric-row"
                        style={{ opacity: metricIdx > i ? 1 : 0, transform: metricIdx > i ? 'translateY(0)' : 'translateY(8px)', transition: 'all .3s ease' }}>
                        <div className="demo-metric-left">
                          <span className="demo-grade-dot" style={{ background: m.color }} />
                          <span className="demo-metric-label">{m.label}</span>
                        </div>
                        <div className="demo-metric-right">
                          <span className="demo-metric-val" style={{ color: m.color }}>{m.value}</span>
                          <span className="demo-metric-unit">{m.unit}</span>
                        </div>
                        <div className="demo-metric-bar-track">
                          <div className="demo-metric-bar-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {metricIdx >= 4 && (
                    <div className="demo-filler-block">
                      <div className="demo-box-label" style={{ marginBottom: 6 }}>Filler words found</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['"um" ×1', '"like" ×1', '"uh" ×1'].map(f => (
                          <span key={f} className="demo-filler-tag">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: TrendingUp, title: 'Pace & Rhythm', description: 'Master optimal speaking pace with real-time WPM tracking and rhythm analysis.', color: '#2E4F4F' },
  { icon: Zap,        title: 'Filler Reduction', description: 'Eliminate "um", "uh", and filler words to speak with confidence and clarity.', color: '#FF6B35' },
  { icon: Eye,        title: 'Eye Contact', description: 'Build commanding presence with AI gaze tracking and engagement metrics.', color: '#2E4F4F' },
  { icon: Mic,        title: 'Articulation', description: 'Speak with precision through guided pronunciation exercises and feedback.', color: '#FF6B35' },
  { icon: Target,     title: 'AI Evaluation', description: 'Get instant feedback on your speaking performance with detailed analytics.', color: '#2E4F4F' },
  { icon: Calendar,   title: 'Streak Tracking', description: 'Stay motivated with daily practice streaks and progress visualization.', color: '#FF6B35' },
];

const STATS = [
  { value: 12000, suffix: '+', label: 'Active Speakers' },
  { value: 94,    suffix: '%', label: 'Confidence Increase' },
  { value: 3,     suffix: 'x', label: 'Faster Improvement' },
  { value: 500,   suffix: 'K', label: 'Sessions Analyzed' },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ol-root { font-family: 'DM Sans', sans-serif; }
  .ol-serif { font-family: 'Playfair Display', serif; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes lineGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes countUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .ol-hero-badge { animation: fadeUp .6s .1s both; }
  .ol-hero-h1   { animation: fadeUp .6s .2s both; }
  .ol-hero-sub  { animation: fadeUp .6s .35s both; }
  .ol-hero-ctas { animation: fadeUp .6s .5s both; }
  .ol-hero-img  { animation: fadeIn .8s .3s both; }
  .ol-hero-line { animation: lineGrow .7s .8s both; transform-origin:left; }
  .ol-float     { animation: float 4s ease-in-out infinite; }

  .ol-reveal         { opacity:0; transform:translateY(36px); transition:opacity .65s ease, transform .65s ease; }
  .ol-reveal.on      { opacity:1; transform:translateY(0); }
  .ol-reveal-l       { opacity:0; transform:translateX(-36px); transition:opacity .65s ease, transform .65s ease; }
  .ol-reveal-l.on    { opacity:1; transform:translateX(0); }

  .ol-stagger > *:nth-child(1){transition-delay:.05s}
  .ol-stagger > *:nth-child(2){transition-delay:.12s}
  .ol-stagger > *:nth-child(3){transition-delay:.19s}
  .ol-stagger > *:nth-child(4){transition-delay:.26s}
  .ol-stagger > *:nth-child(5){transition-delay:.33s}
  .ol-stagger > *:nth-child(6){transition-delay:.40s}

  .ol-feat-card {
    background:#fff; border:1px solid #E2E4DE; border-radius:16px; padding:32px;
    transition:transform .3s ease, box-shadow .3s ease, border-color .3s ease;
    position:relative; overflow:hidden;
  }
  .ol-feat-card::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg, var(--fc,#2E4F4F), transparent);
    transform:scaleX(0); transform-origin:left; transition:transform .3s ease;
  }
  .ol-feat-card:hover { transform:translateY(-6px); box-shadow:0 20px 48px rgba(46,79,79,.12); border-color:#C8D0C8; }
  .ol-feat-card:hover::after { transform:scaleX(1); }

  .ol-stat-card {
    background:#fff; border:1px solid #E2E4DE; border-radius:16px; padding:32px 24px;
    text-align:center; transition:transform .3s ease, box-shadow .3s ease;
  }
  .ol-stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(46,79,79,.1); }

  .ol-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    background:#FF6B35; color:#fff; padding:14px 28px; border-radius:999px;
    font-weight:600; font-size:14px;
    transition:background .2s, transform .2s, box-shadow .2s;
    border:none; cursor:pointer; font-family:'DM Sans',sans-serif;
  }
  .ol-btn-primary:hover { background:#e85c26; transform:translateY(-1px); box-shadow:0 8px 24px rgba(255,107,53,.3); }

  .ol-btn-outline {
    display:inline-flex; align-items:center; gap:8px;
    background:transparent; color:#2E4F4F; padding:13px 28px; border-radius:999px;
    font-weight:600; font-size:14px; border:1.5px solid #2E4F4F;
    transition:background .2s, transform .2s; cursor:pointer;
    font-family:'DM Sans',sans-serif;
  }
  .ol-btn-outline:hover { background:#2E4F4F10; transform:translateY(-1px); }

  .ol-tag {
    background:#2E4F4F12; border:1px solid #2E4F4F30; color:#2E4F4F;
    padding:5px 14px; border-radius:999px; font-size:11px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase; display:inline-block;
  }

  .ol-marquee-track { display:flex; width:max-content; animation:marquee 22s linear infinite; gap:40px; }
  .ol-marquee-track:hover { animation-play-state:paused; }

  .ol-check { color:#FF6B35; font-size:13px; }

  .ol-step-num {
    width:56px; height:56px; border-radius:50%;
    background:#2E4F4F0D; border:1.5px solid #2E4F4F30;
    color:#2E4F4F; font-family:'Playfair Display',serif;
    font-size:18px; font-weight:900;
    display:flex; align-items:center; justify-content:center;
    margin:0 auto 20px; transition:background .3s, border-color .3s;
  }
  .ol-step:hover .ol-step-num { background:#2E4F4F18; border-color:#2E4F4F70; }

  .ol-cta-section { background:linear-gradient(135deg, #2E4F4F 0%, #1a3333 100%); }

  .ol-hero-chip {
    background:rgba(255,255,255,.9); border:1px solid #E2E4DE; border-radius:12px;
    padding:12px 16px; backdrop-filter:blur(12px); text-align:center;
    box-shadow:0 4px 16px rgba(46,79,79,.12);
  }

  .ol-scroll-ind { animation:fadeIn 1s 1.5s both; }
  .ol-scroll-arrow { animation:float 2s ease-in-out infinite; }

  .ol-mesh { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .ol-mesh-circle {
    position:absolute; border-radius:50%;
    background:radial-gradient(circle, var(--c) 0%, transparent 70%);
    filter:blur(60px);
  }

  /* ── Demo styles ───────────────────────────────────────────────────────── */
  .demo-shell {
    width:100%; max-width:900px; margin:0 auto;
    border-radius:20px; overflow:hidden;
    box-shadow:0 40px 80px rgba(46,79,79,.18), 0 0 0 1px rgba(46,79,79,.08);
  }

  .demo-chrome {
    background:#F1F3F1; border-bottom:1px solid #E2E4DE;
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 16px;
  }
  .demo-dots { display:flex; gap:6px; }
  .demo-dots span { width:12px; height:12px; border-radius:50%; display:block; }
  .demo-url {
    font-size:11px; color:#9CA3AF; background:#fff;
    padding:4px 14px; border-radius:999px; border:1px solid #E2E4DE;
    font-family:'DM Mono',monospace;
  }

  .demo-body { display:flex; background:#F8FAF8; min-height:380px; }

  .demo-sidebar {
    width:140px; flex-shrink:0;
    background:#fff; border-right:1px solid #E2E4DE;
    padding:16px 0; display:flex; flex-direction:column; gap:2px;
  }
  .demo-nav-item {
    display:flex; align-items:center; gap:8px;
    padding:8px 14px; font-size:11px; font-weight:500;
    border-radius:0; cursor:default; transition:background .2s;
  }
  .demo-nav-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

  .demo-main { flex:1; padding:18px; display:flex; flex-direction:column; gap:14px; overflow:hidden; }

  .demo-page-header {
    display:flex; align-items:center; justify-content:space-between;
  }
  .demo-page-title { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:#1a2e1a; }
  .demo-page-sub { font-size:10px; color:#9CA3AF; margin-top:2px; }
  .demo-stage-badge {
    font-size:10px; font-weight:700; padding:4px 10px; border-radius:999px;
    display:flex; align-items:center; gap:5px; text-transform:uppercase; letter-spacing:.06em;
    transition:all .4s ease;
  }

  .demo-cols { display:flex; gap:12px; flex:1; }
  .demo-left { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:10px; }
  .demo-right { flex:1; }

  .demo-video-box {
    aspect-ratio:16/10; background:#1a2e1a; border-radius:12px;
    position:relative; overflow:hidden;
  }
  .demo-video-bg {
    position:absolute; inset:0;
    background:radial-gradient(ellipse at 50% 40%, #2a4a2a 0%, #0d1a0d 100%);
  }

  .demo-face {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    animation: fadeIn .4s ease;
  }
  .demo-face-head {
    position:absolute; width:52px; height:60px; border-radius:50%;
    background:#c4a882; top:22%;
  }
  .demo-face-shoulders {
    position:absolute; width:90px; height:36px; border-radius:50% 50% 0 0;
    background:#4a3728; bottom:0;
  }
  .demo-eye {
    position:absolute; width:5px; height:5px; border-radius:50%;
    top:36%; transition:background .5s;
  }
  .demo-eye-l { left:41%; }
  .demo-eye-r { left:54%; }

  .demo-rec-badge {
    position:absolute; top:8px; left:8px;
    background:rgba(239,68,68,.9); color:#fff;
    font-size:9px; font-weight:700; padding:3px 8px; border-radius:999px;
    display:flex; align-items:center; gap:4px; letter-spacing:.06em;
  }
  .demo-rec-dot {
    width:6px; height:6px; border-radius:50%; background:#fff;
    animation: demo-pulse 1s ease-in-out infinite; display:inline-block;
  }
  @keyframes demo-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

  .demo-analyzing-overlay {
    position:absolute; inset:0;
    background:rgba(10,20,10,.75); backdrop-filter:blur(2px);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:8px; color:#fff; font-size:11px; font-weight:600;
    animation: fadeIn .3s ease;
  }
  .demo-spinner {
    width:22px; height:22px; border-radius:50%;
    border:2.5px solid rgba(255,255,255,.2); border-top-color:#FF6B35;
    animation: demo-spin .7s linear infinite;
  }
  @keyframes demo-spin { to{transform:rotate(360deg)} }

  .demo-gaze-dot {
    position:absolute; width:8px; height:8px; border-radius:50%;
    background:#22c55e; animation: demo-gaze 1.8s ease-in-out infinite;
  }
  @keyframes demo-gaze { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.6);opacity:.2} }

  .demo-btns { display:flex; gap:6px; }
  .demo-btn {
    flex:1; display:flex; align-items:center; justify-content:center; gap:5px;
    padding:7px 10px; border-radius:8px;
    font-size:10px; font-weight:600; cursor:default; transition:all .3s ease;
  }
  .demo-btn-orange { background:#FF6B35; color:#fff; }
  .demo-btn-red    { background:#ef4444; color:#fff; }
  .demo-btn-gray   { background:#E2E4DE; color:#6b7280; }
  .demo-btn-icon   { width:10px; height:10px; }

  .demo-transcript-box {
    background:#fff; border:1px solid #E2E4DE; border-radius:12px;
    padding:14px; height:100%; min-height:180px;
  }
  .demo-box-label {
    font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    color:#9CA3AF; margin-bottom:10px; display:flex; align-items:center; gap:4px;
  }
  .demo-transcript-text {
    font-size:11px; line-height:1.8; color:#374151;
    font-family:'DM Mono',monospace;
  }
  .demo-filler-word {
    background:#fef3c7; color:#92400e;
    border-radius:3px; padding:0 3px; font-weight:700;
  }
  .demo-cursor {
    display:inline-block; width:2px; height:12px;
    background:#2E4F4F; animation: demo-pulse .8s infinite; vertical-align:middle;
    margin-left:2px;
  }
  .demo-empty-hint {
    font-size:10px; color:#C8D0C8; margin-top:8px; font-style:italic;
  }

  .demo-results {
    background:#fff; border:1px solid #E2E4DE; border-radius:12px;
    padding:14px; height:100%; display:flex; flex-direction:column; gap:12px;
    animation: fadeIn .4s ease;
  }
  .demo-score-wrap {
    display:flex; align-items:center; gap:12px;
    padding-bottom:10px; border-bottom:1px solid #F1F3F1;
  }
  .demo-score-ring { position:relative; width:72px; height:72px; flex-shrink:0; }
  .demo-score-num {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-family:'Playfair Display',serif; font-size:18px; font-weight:900; color:#1a2e1a;
  }
  .demo-score-label { font-size:9px; color:#9CA3AF; text-transform:uppercase; letter-spacing:.1em; }
  .demo-score-grade { font-size:14px; font-weight:700; margin-top:2px; }

  .demo-metrics { display:flex; flex-direction:column; gap:8px; }
  .demo-metric-row { display:flex; flex-wrap:wrap; align-items:center; gap:4px; }
  .demo-metric-left { display:flex; align-items:center; gap:5px; flex:1; }
  .demo-grade-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .demo-metric-label { font-size:10px; color:#6b7280; }
  .demo-metric-right { display:flex; align-items:baseline; gap:3px; }
  .demo-metric-val { font-size:12px; font-weight:700; }
  .demo-metric-unit { font-size:9px; color:#9CA3AF; }
  .demo-metric-bar-track { width:100%; background:#F1F3F1; border-radius:999px; height:3px; }
  .demo-metric-bar-fill { height:100%; border-radius:999px; transition:width .6s ease; }

  .demo-filler-block {
    padding-top:8px; border-top:1px solid #F1F3F1;
    animation: fadeIn .3s ease;
  }
  .demo-filler-tag {
    background:#fef3c7; color:#92400e; border:1px solid #fde68a;
    padding:2px 8px; border-radius:999px; font-size:9px; font-weight:600;
    font-family:'DM Mono',monospace;
  }

  /* Demo section wrapper */
  .demo-section-wrapper {
    position:relative;
  }
  .demo-section-wrapper::before {
    content:''; position:absolute; inset:-60px;
    background:radial-gradient(ellipse at 50% 50%, rgba(46,79,79,.06) 0%, transparent 70%);
    pointer-events:none;
  }
`;

export const Landing = () => {
  const [statsRef, statsVis] = useReveal();
  const [featRef,  featVis]  = useReveal();
  const [howRef,   howVis]   = useReveal();
  const [demoRef,  demoVis]  = useReveal(0.1);
  const [ctaRef,   ctaVis]   = useReveal();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const onMouse = (e) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width - .5, y: (e.clientY - r.top) / r.height - .5 });
  };

  return (
    <div className="ol-root min-h-screen bg-background overflow-x-hidden" data-testid="landing-page">
      <style>{STYLES}</style>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={onMouse}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ paddingTop: 80, background: 'linear-gradient(160deg, #f8faf8 0%, #eef4ee 50%, #fdf6f2 100%)' }}
      >
        <div className="ol-mesh">
          <div className="ol-mesh-circle" style={{ '--c':'rgba(46,79,79,.08)', width:600, height:600, top:'-10%', left:'-10%', transform:`translate(${mouse.x*-25}px,${mouse.y*-18}px)`, transition:'transform .12s linear' }} />
          <div className="ol-mesh-circle" style={{ '--c':'rgba(255,107,53,.06)', width:400, height:400, bottom:'5%', right:'0%', transform:`translate(${mouse.x*18}px,${mouse.y*12}px)`, transition:'transform .12s linear' }} />
          <div className="ol-mesh-circle" style={{ '--c':'rgba(46,79,79,.05)', width:300, height:300, top:'40%', right:'25%', transform:`translate(${mouse.x*12}px,${mouse.y*8}px)`, transition:'transform .12s linear' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="ol-hero-badge"><span className="ol-tag">AI Communication Coach</span></div>
              <div className="ol-hero-h1 space-y-1">
                <h1 className="ol-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-light leading-[1.08] tracking-tight text-foreground">Speak with</h1>
                <h1 className="ol-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-black leading-[1.08] tracking-tight" style={{ color: '#2E4F4F' }}>Confidence</h1>
                <h1 className="ol-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-light leading-[1.08] tracking-tight text-foreground italic">& Clarity</h1>
                <div className="ol-hero-line h-[3px] w-20 rounded-full mt-4" style={{ background: '#FF6B35' }} />
              </div>
              <p className="ol-hero-sub text-lg leading-relaxed max-w-lg text-muted-foreground">
                Transform your communication with AI-powered analysis. Real-time gaze tracking, filler detection, and personalized coaching — all in one platform.
              </p>
              <div className="ol-hero-ctas flex flex-wrap gap-4">
                <Link to="/register"><button className="ol-btn-primary" data-testid="hero-get-started-btn">Get Started Free <ArrowRight className="w-4 h-4" /></button></Link>
                <Link to="/login"><button className="ol-btn-outline" data-testid="hero-login-btn">Sign In</button></Link>
              </div>
              <div className="ol-hero-ctas flex flex-wrap gap-6">
                {['No credit card', 'Free plan included', 'Instant results'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="ol-check">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="ol-hero-img relative">
              <div className="absolute rounded-2xl" style={{ inset: -12, border: '1px solid rgba(46,79,79,.12)', borderRadius: 24 }} />
              <div className="absolute rounded-2xl" style={{ inset: -24, border: '1px solid rgba(46,79,79,.06)', borderRadius: 28 }} />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid #E2E4DE' }}>
                <img src="https://images.unsplash.com/photo-1646369505567-3a9cbb052342?crop=entropy&cs=srgb&fm=jpg&q=85" alt="Confident speaker" className="w-full object-cover" style={{ height: 400 }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(46,79,79,.5) 0%, transparent 50%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="grid grid-cols-3 gap-2">
                    {[['165', 'WPM', '#2E4F4F'], ['98%', 'Confidence', '#FF6B35'], ['92%', 'Eye Contact', '#2E4F4F']].map(([val, label, color]) => (
                      <div key={label} className="ol-hero-chip">
                        <div className="text-lg font-black ol-serif" style={{ color }}>{val}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,.9)', color: '#2E4F4F', border: '1px solid #E2E4DE' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Analysis
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ol-scroll-ind absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" style={{ color: '#2E4F4F60' }}>
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="ol-scroll-arrow"><ChevronDown className="w-4 h-4" /></div>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <div style={{ background: '#2E4F4F', padding: '14px 0', overflow: 'hidden' }}>
        <div className="ol-marquee-track" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, fontWeight: 600, letterSpacing: '.1em' }}>
          {[...Array(2)].map((_, ri) =>
            ['PACE TRAINING', '·', 'FILLER DETECTION', '·', 'EYE CONTACT ANALYSIS', '·', 'AI COACHING', '·', 'CONFIDENCE SCORING', '·', 'STREAK TRACKING', '·', 'REAL-TIME FEEDBACK', '·'].map((t, i) => (
              <span key={`${ri}-${i}`} style={{ color: t === '·' ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.6)' }}>{t}</span>
            ))
          )}
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#F5F7F5' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div ref={statsRef} className={`grid grid-cols-2 lg:grid-cols-4 gap-6 ol-stagger`}>
            {STATS.map(({ value, suffix, label }, i) => (
              <div key={label} className={`ol-stat-card ol-reveal ${statsVis ? 'on' : ''}`} style={{ transitionDelay: `${i * .1}s` }}>
                <div className="ol-serif text-4xl font-black mb-1" style={{ color: '#FF6B35' }}><Counter target={value} suffix={suffix} /></div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-background" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div ref={featRef} className={`text-center mb-16 ol-reveal ${featVis ? 'on' : ''}`}>
            <span className="ol-tag mb-4 inline-block">Features</span>
            <h2 className="ol-serif text-4xl sm:text-5xl font-black mt-4 mb-3 text-foreground">
              Everything to Master<span className="block font-light italic" style={{ color: '#2E4F4F' }}>Communication</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Six core modules. One platform. Measurable results every session.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ol-stagger">
            {FEATURES.map(({ icon: Icon, title, description, color }, i) => (
              <div key={title} className={`ol-feat-card ol-reveal ${featVis ? 'on' : ''}`} style={{ '--fc': color, transitionDelay: `${i * .08}s` }} data-testid={`feature-card-${i}`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${color}12` }}><Icon className="w-5 h-5" style={{ color }} /></div>
                <h3 className="ol-serif text-xl font-bold mb-2 text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#F5F7F5' }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div ref={howRef} className={`text-center mb-16 ol-reveal ${howVis ? 'on' : ''}`}>
            <span className="ol-tag mb-4 inline-block">How It Works</span>
            <h2 className="ol-serif text-4xl sm:text-5xl font-black mt-4 text-foreground">Three Steps to Fluency</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative ol-stagger">
            <div className="hidden md:block absolute top-7 left-[18%] right-[18%] h-px" style={{ background: 'linear-gradient(90deg, transparent, #2E4F4F30, transparent)' }} />
            {[
              { n: '01', title: 'Record', desc: 'Hit record and speak naturally. Camera and mic capture everything in real time.' },
              { n: '02', title: 'Analyze', desc: 'AI processes gaze, pace, fillers, and confidence in seconds after stopping.' },
              { n: '03', title: 'Improve', desc: 'Get actionable metrics, review your transcript, and track progress over time.' },
            ].map(({ n, title, desc }, i) => (
              <div key={n} className={`ol-step ol-reveal text-center ${howVis ? 'on' : ''}`} style={{ transitionDelay: `${i * .15}s` }}>
                <div className="ol-step-num">{n}</div>
                <h3 className="ol-serif text-xl font-bold mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEMO ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-background overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div ref={demoRef} className={`text-center mb-12 ol-reveal ${demoVis ? 'on' : ''}`}>
            <span className="ol-tag mb-4 inline-block">See It In Action</span>
            <h2 className="ol-serif text-4xl sm:text-5xl font-black mt-4 mb-3 text-foreground">
              Watch ORATO
              <span className="block font-light italic" style={{ color: '#FF6B35' }}>Work For You</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A live demo of the evaluation flow — from recording to instant AI feedback. Everything you see runs in your browser.
            </p>
          </div>

          <div className={`demo-section-wrapper ol-reveal ${demoVis ? 'on' : ''}`} style={{ transitionDelay: '.15s' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(46,79,79,.07) 0%, transparent 70%)', transform: 'scale(1.3)' }} />
            <ProductDemo />
          </div>

          <div className={`flex flex-wrap justify-center gap-6 mt-8 ol-reveal ${demoVis ? 'on' : ''}`} style={{ transitionDelay: '.3s' }}>
            {[
              { dot: '#22c55e', text: 'Green = within ideal range' },
              { dot: '#f59e0b', text: 'Amber = needs attention' },
              { dot: '#ef4444', text: 'Red = out of range' },
            ].map(({ dot, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="ol-cta-section py-32 relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ width:500, height:500, background:'radial-gradient(circle, rgba(255,107,53,.08) 0%, transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(60px)' }} />
          <div className="absolute rounded-full" style={{ width:300, height:300, background:'radial-gradient(circle, rgba(255,255,255,.04) 0%, transparent 70%)', top:'-20%', right:'-5%', filter:'blur(40px)' }} />
        </div>
        <div ref={ctaRef} className={`max-w-3xl mx-auto px-6 text-center relative z-10 ol-reveal ${ctaVis ? 'on' : ''}`}>
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.15)' }}>Join ORATO</span>
          <h2 className="ol-serif text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight text-white">
            Ready to Transform<br />
            <span className="font-light italic" style={{ color: '#FF6B35' }}>Your Speaking Skills?</span>
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,.6)' }}>
            Join thousands of professionals and students improving their communication every day.
          </p>
          <Link to="/register">
            <button className="ol-btn-primary" data-testid="cta-get-started-btn" style={{ fontSize: 15, padding: '16px 40px' }}>
              Start Training Now <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>No credit card required · Free plan available</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="ol-serif text-2xl font-light tracking-widest text-primary">ORATO</span>
          <p className="text-sm text-muted-foreground">© 2025 ORATO. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {['Privacy', 'Terms', 'Contact'].map(t => (
              <span key={t} className="hover:text-primary cursor-pointer transition-colors">{t}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};