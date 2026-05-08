import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import {
  Video, Square, Play, RotateCw, Mic, Eye, Activity,
  Brain, FileText, ChevronDown, ChevronUp, Zap, Clock, Target
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

  @keyframes ev-ping   { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.35);opacity:.15} }
  @keyframes ev-fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ev-spin   { to{transform:rotate(360deg)} }
  @keyframes ev-bar    { from{width:0} to{width:var(--w)} }
  @keyframes ev-pop    { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }

  .ev-result-enter { animation: ev-fadeUp .4s ease both; }
  .ev-metric-enter { animation: ev-pop .35s ease both; }

  .ev-grade-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    box-shadow: 0 0 6px currentColor;
  }
  .ev-grade-good    { background:#22c55e; color:#22c55e; }
  .ev-grade-warning { background:#f59e0b; color:#f59e0b; }
  .ev-grade-bad     { background:#ef4444; color:#ef4444; }
  .ev-grade-unknown { background:#9ca3af; color:#9ca3af; }

  .ev-score-ring {
    position:relative; width:96px; height:96px;
    display:flex; align-items:center; justify-content:center;
  }
  .ev-score-ring svg { position:absolute; inset:0; transform:rotate(-90deg); }

  .ev-bar-track { background:#f1f5f1; border-radius:999px; height:6px; overflow:hidden; }
  .ev-bar-fill  { height:100%; border-radius:999px; animation: ev-bar .8s ease both; }

  .ev-transcript-word { display:inline; }
  .ev-filler { background:#fef3c7; color:#92400e; border-radius:4px; padding:1px 4px; font-weight:600; }

  .ev-script-area {
    resize:none; width:100%;
    border:1.5px solid #E2E4DE; border-radius:10px;
    padding:12px; font-size:13px; line-height:1.7;
    font-family:'DM Mono',monospace;
    background:#FAFBFA; outline:none;
    transition:border-color .2s, box-shadow .2s;
  }
  .ev-script-area:focus { border-color:#2E4F4F; box-shadow:0 0 0 3px rgba(46,79,79,.08); }
  .ev-script-area::placeholder { color:#A0A8A0; }

  .ev-analyzing-step { animation: ev-fadeUp .3s ease both; }

  .ev-metric-card {
    background:#fff; border:1px solid #E2E4DE; border-radius:14px;
    padding:16px 18px; display:flex; align-items:center; gap:14px;
    transition:box-shadow .2s;
  }
  .ev-metric-card:hover { box-shadow:0 4px 16px rgba(46,79,79,.08); }

  .ev-section-label {
    font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    color:#9CA3AF; margin-bottom:10px;
  }
`;

/* ─── Communication facts ────────────────────────────────────────────────── */
const FACTS = [
  "A single well‑placed pause can boost your perceived confidence by 20%.",
  "Speakers who maintain eye contact are rated as 30% more trustworthy.",
  "Slowing down just 10% makes you sound more authoritative and clear.",
  "Listeners remember the first and last thing you say best – nail your opener and close.",
  "The average listener's attention starts to drift after just 10 seconds – use changes in pace to recapture it.",
  "Using hand gestures while you speak actually helps you think more clearly.",
  "A smile while speaking makes your voice sound warmer and more engaging.",
  "Your filler words drop by 50% when you practice with a script first.",
  "Recording yourself just once can instantly reveal 3 habits you never noticed.",
  "The ideal speaking rate for comprehension is 120–160 words per minute.",
];


/* ─── Grade helpers ───────────────────────────────────────────────────────── */
const gradeClass  = g => `ev-grade-${g || 'unknown'}`;
const gradeLabel  = { good: 'On target', warning: 'Needs work', bad: 'Off range', unknown: 'No data' };
const gradeColor  = { good: '#22c55e', warning: '#f59e0b', bad: '#ef4444', unknown: '#9ca3af' };

/* ─── Score ring ──────────────────────────────────────────────────────────── */
const ScoreRing = ({ score, label }) => {
  const r = 42, circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score ?? 0));
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="ev-score-ring">
      <svg viewBox="0 0 96 96" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#F1F5F1" strokeWidth="7" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="text-center">
        <div className="text-xl font-black" style={{ color, fontFamily: "'Playfair Display', serif" }}>
          {score != null ? `${score}` : '—'}
        </div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
};

/* ─── Metric card ─────────────────────────────────────────────────────────── */
const MetricCard = ({ icon: Icon, label, value, unit, grade, range, delay = 0 }) => (
  <div className="ev-metric-card ev-metric-enter" style={{ animationDelay: `${delay}s` }}>
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${gradeColor[grade] || '#9ca3af'}15` }}>
      <Icon className="w-4 h-4" style={{ color: gradeColor[grade] || '#9ca3af' }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`ev-grade-dot ${gradeClass(grade)}`} />
          <span className="text-[10px]" style={{ color: gradeColor[grade] || '#9ca3af' }}>
            {gradeLabel[grade] || '—'}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          {value ?? '—'}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {range && (
        <div className="ev-bar-track">
          <div className="ev-bar-fill" style={{
            '--w': `${Math.min(100, (value / range.max) * 100)}%`,
            width: `${Math.min(100, (value / range.max) * 100)}%`,
            background: gradeColor[grade] || '#9ca3af'
          }} />
        </div>
      )}
      {range && (
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>0</span><span>Ideal: {range.label}</span><span>{range.max}</span>
        </div>
      )}
    </div>
  </div>
);

/* ─── Transcript ──────────────────────────────────────────────────────────── */
const FILLERS_SET = new Set(['um','uh','like','you know','actually','basically','so']);

const Transcript = ({ transcript, fillerWords }) => {
  const [expanded, setExpanded] = useState(true);
  if (!transcript) return null;
  const fillers = new Set([
    ...Object.keys(fillerWords || {}).map(f => f.toLowerCase()),
    ...FILLERS_SET,
  ]);
  const words = transcript.split(' ');
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Transcript</span>
          <span className="text-xs text-muted-foreground">({words.length} words)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
            {words.map((word, i) => {
              const clean = word.toLowerCase().replace(/[^a-z ]/g, '');
              return (
                <span key={i} className={`ev-transcript-word${fillers.has(clean) ? ' ev-filler' : ''}`}>
                  {word}{' '}
                </span>
              );
            })}
          </p>
          <p className="text-[10px] text-muted-foreground mt-3">
            <span className="ev-filler">Filler words</span> highlighted above
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Analyzing overlay – now with fact ──────────────────────────────────── */
const AnalyzingOverlay = ({ fact }) => {
  const steps = [
    { icon: Mic,      label: 'Transcribing speech...' },
    { icon: Activity, label: 'Measuring pace & fillers...' },
    { icon: Eye,      label: 'Analyzing gaze & blinks...' },
    { icon: Brain,    label: 'Computing combined score...' },
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 1500);
    return () => clearInterval(t);
  }, []);
  const Icon = steps[step].icon;
  return (
    <div className="absolute inset-0 rounded-2xl z-10 flex flex-col items-center justify-center gap-4"
      style={{ background: 'rgba(10,20,15,.88)', backdropFilter: 'blur(4px)' }}>
      <div className="relative flex items-center justify-center">
        <span className="absolute w-14 h-14 rounded-full" style={{ background: 'rgba(255,107,53,.2)', animation: 'ev-ping 1.5s ease-in-out infinite' }} />
        <div className="relative w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#FF6B35' }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="ev-analyzing-step text-white text-sm font-medium tracking-wide" key={step}>
        {steps[step].label}
      </p>
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ background: i === step ? '#FF6B35' : 'rgba(255,255,255,.25)', transform: i === step ? 'scale(1.4)' : 'scale(1)' }} />
        ))}
      </div>
      {/* NEW: fact tip */}
      <div className="mt-4 px-6 max-w-xs text-center" style={{ animation: 'ev-fadeUp 0.6s ease both' }}>
        <span className="text-[11px] text-white/80 italic leading-snug">
          💡 {fact || "Did you know? \u200B"}
        </span>
      </div>
    </div>
  );
};

/* ─── Script panel ────────────────────────────────────────────────────────── */
const ScriptPanel = ({ script, setScript, visible, setVisible }) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <button
      onClick={() => setVisible(v => !v)}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Script / Reference</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">optional</span>
      </div>
      {visible ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
    {visible && (
      <div className="px-5 pb-5">
        <p className="text-xs text-muted-foreground mb-3">
          Paste a script or talking points here. Keep it visible while recording so you can glance at it without losing eye contact.
        </p>
        <textarea
          className="ev-script-area"
          rows={6}
          placeholder="Paste your script, key points, or outline here..."
          value={script}
          onChange={e => setScript(e.target.value)}
        />
      </div>
    )}
  </div>
);

/* ─── Main ────────────────────────────────────────────────────────────────── */
export const Evaluation = () => {
  const [recording, setRecording]       = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [results, setResults]           = useState(null);
  const [stream, setStream]             = useState(null);
  const [script, setScript]             = useState('');
  const [scriptOpen, setScriptOpen]     = useState(false);
  const [currentFact]                   = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]); // NEW
   
  const videoRef          = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const chunksRef         = useRef([]);

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  const startRecording = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false, sampleRate: 48000, channelCount: 1 },
      });
      setStream(ms);
      videoRef.current.srcObject = ms;
      videoRef.current.play();

      let opts = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus'))
        opts = { mimeType: 'video/webm;codecs=vp8,opus', audioBitsPerSecond: 128000 };
      else if (MediaRecorder.isTypeSupported('video/webm'))
        opts = { mimeType: 'video/webm', audioBitsPerSecond: 128000 };

      const mr = new MediaRecorder(ms, opts);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        setRecordedBlob(new Blob(chunksRef.current, { type: 'video/webm' }));
        ms.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      };
      mr.start();
      setRecording(true);
      toast.success('Recording started');
    } catch (err) {
      toast.error('Failed to access camera/microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const analyzeRecording = async () => {
    if (!recordedBlob) return;
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('video', new File([recordedBlob], 'recording.webm', { type: 'video/webm' }));
      const { data } = await axios.post(`${API_URL}/evaluation/analyze`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setResults(data);
      toast.success('Analysis complete!');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setRecordedBlob(null); setResults(null);
    if (videoRef.current) { videoRef.current.src = null; videoRef.current.srcObject = null; }
  };

  const playRecording = () => {
    if (recordedBlob && videoRef.current) {
      videoRef.current.src = URL.createObjectURL(recordedBlob);
      videoRef.current.play();
    }
  };

  const grades = results?.grades || {};

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="p-6 md:p-8 max-w-7xl mx-auto" data-testid="evaluation-page">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-1">Evaluation</h1>
          <p className="text-muted-foreground text-sm">Record yourself speaking and get AI-powered feedback</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">

          {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Video */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden aspect-video relative">
              <video ref={videoRef} data-testid="evaluation-video"
                className="w-full h-full object-cover bg-black" playsInline />
              {!recording && !recordedBlob && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(46,79,79,.1)' }}>
                    <Video className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
                </div>
              )}
              {recording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ background: 'rgba(239,68,68,.9)', backdropFilter: 'blur(4px)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
                </div>
              )}
              {analyzing && <AnalyzingOverlay fact={currentFact} />}
            </div>

            {/* Controls */}
            <div className="flex gap-2.5">
              {!recording && !recordedBlob && (
                <button onClick={startRecording} data-testid="start-recording-btn"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: '#FF6B35' }}>
                  <Video className="w-4 h-4" /> Start Recording
                </button>
              )}
              {recording && (
                <button onClick={stopRecording} data-testid="stop-recording-btn"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: '#ef4444' }}>
                  <Square className="w-4 h-4" /> Stop Recording
                </button>
              )}
              {recordedBlob && !results && (
                <>
                  <button onClick={playRecording} data-testid="play-recording-btn" disabled={analyzing}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border border-border bg-card text-foreground hover:bg-muted transition-all disabled:opacity-50">
                    <Play className="w-4 h-4" /> Play
                  </button>
                  <button onClick={analyzeRecording} data-testid="analyze-btn" disabled={analyzing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: '#2E4F4F' }}>
                    {analyzing
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'ev-spin .7s linear infinite' }} /> Analyzing...</>
                      : <><Zap className="w-4 h-4" /> Analyze</>}
                  </button>
                  <button onClick={reset} data-testid="reset-btn" disabled={analyzing}
                    className="flex items-center justify-center px-4 py-3 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-all disabled:opacity-50">
                    <RotateCw className="w-4 h-4" />
                  </button>
                </>
              )}
              {results && (
                <button onClick={reset} data-testid="new-recording-btn"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: '#FF6B35' }}>
                  <RotateCw className="w-4 h-4" /> New Recording
                </button>
              )}
            </div>

            {/* Script panel */}
            {!results && (
              <ScriptPanel script={script} setScript={setScript} visible={scriptOpen} setVisible={setScriptOpen} />
            )}

            {/* Transcript (after results) */}
            {results?.transcript && (
              <div className="ev-result-enter">
                <Transcript transcript={results.transcript} fillerWords={results.filler_words} />
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — Results ─────────────────────────────────── */}
          <div className="space-y-4">
            {results ? (
              <div className="ev-result-enter space-y-4" data-testid="evaluation-results">

                {/* Combined score */}
                <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5">
                  <ScoreRing score={results.combined_score} label="Score" />
                  <div>
                    <p className="ev-section-label mb-1">Combined Score</p>
                    <p className="text-2xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {results.combined_score >= 75 ? 'Excellent' : results.combined_score >= 55 ? 'Good' : results.combined_score >= 35 ? 'Fair' : 'Needs Practice'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Weighted: pace · fillers · eye contact · blink rate
                    </p>
                  </div>
                </div>

                {/* Speech metrics */}
                <div>
                  <p className="ev-section-label px-1">Speech</p>
                  <div className="space-y-2">
                    <MetricCard icon={Activity} label="Words Per Minute" value={results.wpm}
                      grade={grades.wpm} range={{ max: 220, label: '120–160' }} delay={0.05} />
                    <MetricCard icon={Zap} label="Filler Words" value={results.filler_count}
                      unit="words" grade={grades.fillers} range={{ max: 20, label: '<5%' }} delay={0.1} />
                    <MetricCard icon={Clock} label="Long Pauses" value={results.long_pauses}
                      grade={results.long_pauses === 0 ? 'good' : results.long_pauses <= 3 ? 'warning' : 'bad'} delay={0.15} />
                  </div>
                </div>

                {/* Video metrics */}
                {(results.gaze_on_screen_pct != null || results.blink_count != null) && (
                  <div>
                    <p className="ev-section-label px-1">Video Analysis</p>
                    <div className="space-y-2">
                      {results.gaze_on_screen_pct != null && (
                        <MetricCard icon={Eye} label="Eye Contact" value={results.gaze_on_screen_pct}
                          unit="%" grade={grades.eye_contact} range={{ max: 100, label: '>70%' }} delay={0.2} />
                      )}
                      {results.blink_count != null && (
                        <MetricCard icon={Target} label="Blink Count" value={results.blink_count}
                          unit="blinks" grade={grades.blink_rate} range={{ max: 50, label: '10–20/min' }} delay={0.25} />
                      )}
                      {results.attention_score != null && (
                        <MetricCard icon={Brain} label="Attention Score" value={results.attention_score}
                          unit="%" grade={results.attention_score >= 70 ? 'good' : results.attention_score >= 50 ? 'warning' : 'bad'} delay={0.3} />
                      )}
                    </div>
                  </div>
                )}

                {/* Filler breakdown */}
                {results.filler_words && Object.keys(results.filler_words).length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <p className="ev-section-label">Filler Breakdown</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(results.filler_words).map(([word, count]) => (
                        <div key={word} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          <span className="font-mono">"{word}"</span>
                          <span className="font-bold">×{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Empty state */
              <div className="bg-card border border-border rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center gap-4" style={{ minHeight: 320 }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(46,79,79,.08)' }}>
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-medium mb-1">No Results Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Record yourself speaking, then click Analyze to get scored on pace, fillers, eye contact, and blink rate.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {[
                    ['120–160', 'Ideal WPM'],
                    ['< 5%', 'Filler target'],
                    ['> 70%', 'Eye contact'],
                    ['10–20/min', 'Blink rate'],
                  ].map(([val, label]) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#F5F7F5', border: '1px solid #E2E4DE' }}>
                      <div className="text-sm font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>{val}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};