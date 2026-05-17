import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import {
  Video, Square, Play, RotateCw, Mic, Eye, Activity,
  Brain, FileText, ChevronDown, ChevronUp, Zap, Clock, Target, Upload
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

  @keyframes ev-ping   { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.35);opacity:.15} }
  @keyframes ev-fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ev-spin   { to{transform:rotate(360deg)} }
  @keyframes ev-pop    { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }

  .ev-result-enter { animation: ev-fadeUp .4s ease both; }

  .ev-result-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 12px 0;
    border-bottom: 1px solid #E2E4DE;
  }
  .ev-result-label { font-size: 13px; font-weight: 500; color: #5A6A5A; }
  .ev-result-value { font-size: 18px; font-weight: 700; color: #1F2E2E; font-family: 'Playfair Display', serif; }
  .ev-filler-list  { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px; }
  .ev-filler {
  background-color: #fef3c7;
  color: #b45309;
  border-radius: 4px;
  padding: 0 2px;
  font-weight: 500;
}
  .ev-score-ring-wrap {
    position: relative; width: 82px; height: 82px;
    display: flex; align-items: center; justify-content: center;
  }
  .ev-score-ring-wrap svg { position: absolute; inset: 0; transform: rotate(-90deg); }
  .ev-score-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; }

  .ev-demo-bar-track { background:#F1F3F1; border-radius:999px; height:4px; overflow:hidden; }
  .ev-demo-bar-fill  { height:100%; border-radius:999px; transition:width .6s ease; }

  @keyframes demo-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .ev-demo-pulse { animation: demo-pulse 1.2s ease-in-out infinite; }
  .ev-filler-badge {
    background: #fef3c7; color: #92400e;
    border-radius: 20px; padding: 4px 10px;
    font-size: 12px; font-weight: 600;
  }

  .ev-grade-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; box-shadow:0 0 6px currentColor; }
  .ev-grade-good    { background:#22c55e; color:#22c55e; }
  .ev-grade-warning { background:#f59e0b; color:#f59e0b; }
  .ev-grade-bad     { background:#ef4444; color:#ef4444; }
  .ev-grade-unknown { background:#9ca3af; color:#9ca3af; }

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

  .ev-script-overlay {
    position: absolute;
    top: 8px; bottom: 8px; left: 8px; right: 8px;
    z-index: 5;
    padding: 12px;
    background: rgba(0,0,0,0.55);
    border-radius: 14px;
    backdrop-filter: blur(6px);
    display: flex;
    flex-direction: column;
    transition: opacity 0.3s ease;
  }
  .ev-script-overlay textarea {
    background: transparent; color: #fff; border: none;
    padding: 4px 2px; font-size: 14px; line-height: 1.8;
    font-family: 'DM Mono', monospace;
    width: 100%; flex: 1; resize: none; outline: none; overflow-y: auto;
  }
  .ev-script-overlay textarea::placeholder { color: rgba(255,255,255,0.4); }
  .ev-script-overlay-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: rgba(255,255,255,0.5);
    margin-bottom: 6px; flex-shrink: 0;
  }

  .ev-metric-enter { animation: ev-fadeUp .4s ease both; }
`;

const FACTS = [
  "A single well-placed pause can boost your perceived confidence by 20%.",
  "Speakers who maintain eye contact are rated as 30% more trustworthy.",
  "Slowing down just 10% makes you sound more authoritative and clear.",
  "Listeners remember the first and last thing you say best — nail your opener and close.",
  "The average listener's attention starts to drift after just 10 seconds — use changes in pace to recapture it.",
  "Using hand gestures while you speak actually helps you think more clearly.",
  "A smile while speaking makes your voice sound warmer and more engaging.",
  "Your filler words drop by 50% when you practice with a script first.",
  "Recording yourself just once can instantly reveal 3 habits you never noticed.",
  "The ideal speaking rate for comprehension is 120-160 words per minute.",
];

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
      <div className="mt-4 px-6 max-w-xs text-center" style={{ animation: 'ev-fadeUp 0.6s ease both' }}>
        <span className="text-[11px] text-white/80 italic leading-snug">
          {fact || ""}
        </span>
      </div>
    </div>
  );
};


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

const AnimatedScoreRing = ({ score }) => {
  const r = 33, circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score ?? 0));
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? '#22c55e' : pct >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <div className="ev-score-ring-wrap">
      <svg viewBox="0 0 82 82" width="82" height="82">
        <circle cx="41" cy="41" r={r} fill="none" stroke="#E2E4DE" strokeWidth="6" />
        <circle cx="41" cy="41" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <span className="ev-score-num" style={{ color }}>{score}</span>
    </div>
  );
};

const AnimatedMetricRow = ({ label, value, unit, grade, barPct, delay = 0, feedback = '' }) => {
  const gradeColor = { good: '#22c55e', warning: '#f59e0b', bad: '#ef4444', unknown: '#9ca3af' }[grade] || '#9ca3af';
  return (
    <div className="ev-metric-enter" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: gradeColor }} />
          <span className="text-[10px] font-medium" style={{ color: gradeColor }}>
            {grade === 'good' ? 'On target' : grade === 'warning' ? 'Needs work' : grade === 'bad' ? 'Off range' : 'No data'}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{value ?? '—'}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className="ev-demo-bar-track">
        <div className="ev-demo-bar-fill" style={{ width: `${barPct}%`, background: gradeColor }} />
      </div>
      {feedback && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{feedback}</p>
      )}
    </div>
  );
};

// Drop-in replacement for AnnotatedVideoPlayer in Evaluation.jsx
// Fixes:
// 1. Shows error state if video fails to load (CORS / path issue visible to user)
// 2. Logs full URL so you can verify it in browser console
// 3. Uses REACT_APP_BACKEND_URL correctly — no double-slash

const AnnotatedVideoPlayer = ({ src }) => {
  const [error, setError] = React.useState(false);

  // REACT_APP_BACKEND_URL should be "http://localhost:8000" (no trailing slash)
  // src comes from backend as "/static/annotated/uid.mp4"
  const API_BASE = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
  const fullUrl  = `${API_BASE}${src}`;

  console.log('[AnnotatedVideoPlayer] loading:', fullUrl);

  if (error) {
    return (
      <div className="absolute inset-0 z-10 bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3">
        <p className="text-white text-sm font-medium">Annotated video failed to load</p>
        <p className="text-white/50 text-xs px-6 text-center">{fullUrl}</p>
        <a
          href={fullUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg text-white"
          style={{ background: 'rgba(255,107,53,0.8)' }}
        >
          Open directly ↗
        </a>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-black rounded-2xl overflow-hidden">
      <video
        src={fullUrl}
        controls
        autoPlay={false}
        className="w-full h-full object-contain"
        onError={() => {
          console.error('[AnnotatedVideoPlayer] failed to load:', fullUrl);
          setError(true);
        }}
        onLoadedData={() => {
          console.log('[AnnotatedVideoPlayer] loaded successfully:', fullUrl);
        }}
      />
      <div
        className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold text-white"
        style={{ background: 'rgba(46,79,79,0.85)' }}
      >
        ✦ Annotated Output
      </div>
    </div>
  );
};

const VideoControls = ({ videoRef, objectUrlRef, recordedBlob }) => {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady]       = useState(false);   // true after metadata is loaded

  // ── load video once a blob is available ──────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !recordedBlob) return;

    // create object URL if needed
    if (!objectUrlRef.current) {
      objectUrlRef.current = URL.createObjectURL(recordedBlob);
    }

    const src = objectUrlRef.current;
    if (vid.src === src && vid.readyState >= 2) {
      // already loaded
      setDuration(vid.duration);
      setReady(true);
      return;
    }

    vid.src = src;
    vid.load();

    const onMeta = () => {
      setDuration(vid.duration);
      setReady(true);
    };
    vid.addEventListener('loadedmetadata', onMeta, { once: true });
    return () => vid.removeEventListener('loadedmetadata', onMeta);
  }, [recordedBlob, videoRef, objectUrlRef]);

  // ── play / pause / timeupdate ─────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onPlay   = () => setPlaying(true);
    const onPause  = () => setPlaying(false);
    const onEnded  = () => setPlaying(false);
    const onTime   = () => setProgress(vid.currentTime);

    vid.addEventListener('play',      onPlay);
    vid.addEventListener('pause',     onPause);
    vid.addEventListener('ended',     onEnded);
    vid.addEventListener('timeupdate', onTime);

    return () => {
      vid.removeEventListener('play',      onPlay);
      vid.removeEventListener('pause',     onPause);
      vid.removeEventListener('ended',     onEnded);
      vid.removeEventListener('timeupdate', onTime);
    };
  }, [videoRef]);

  // ── toggle play / pause ───────────────────────────────────────────
  const toggle = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.paused ? vid.play().catch(() => {}) : vid.pause();
  };

  // ── seek via slider ───────────────────────────────────────────────
  const handleSeek = (e) => {
    const newTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  // ── formatting helper ─────────────────────────────────────────────
  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!ready) {
    // Show a simple loading state until metadata arrives
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-lg">
        <div className="text-white text-sm animate-pulse">Loading video…</div>
      </div>
    );
  }

  return (
    <>
      {/* invisible overlay to toggle play/pause on click */}
      <div
        className="absolute inset-0 z-[8] cursor-pointer"
        onClick={toggle}
        style={{ background: 'transparent' }}
      />

      {/* big play button when paused */}
      {!playing && (
        <div className="absolute inset-0 z-[9] flex items-center justify-center pointer-events-none">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
        </div>
      )}

      {/* controls bar at the bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-4 pt-6 pb-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)' }}
      >
        {/* slider – now with real duration */}
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 mb-2 cursor-pointer"
          style={{ accentColor: '#FF6B35' }}
        />

        <div className="flex items-center gap-3">
          {/* play/pause button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
          >
            {playing ? (
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                <rect x="5" y="4" width="4" height="16" />
                <rect x="15" y="4" width="4" height="16" />
              </svg>
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
          <span className="text-white text-xs font-mono">
            {fmt(progress)} / {fmt(duration)}
          </span>
          <span className="ml-auto text-white/50 text-[10px]">
            Space · Enter to analyze
          </span>
        </div>
      </div>
    </>
  );
};

/// Speech timeline visualisation
const SpeechTimeline = ({ timeline, totalDuration, videoRef }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  if (!timeline || timeline.length === 0) return null;
  const handleClick = (segment) => {
    if (videoRef && videoRef.current) {
      videoRef.current.currentTime = segment.start;
    }
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mt-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
        Speech Timeline
      </div>
      <div className="relative h-10 w-full rounded-md overflow-hidden flex bg-muted">
        {timeline.map((segment, idx) => {
          const width = ((segment.end - segment.start) / totalDuration) * 100;
          if (width <= 0) return null;
          const isSpeech = segment.type === 'speech';
          return (
            <div
              key={idx}
              className={`h-full cursor-pointer transition-all hover:opacity-80 ${isSpeech ? 'bg-green-500' : 'bg-gray-300'}`}
              style={{ width: `${width}%` }}
              title={`${isSpeech ? 'Speech' : 'Pause'} — ${(segment.end - segment.start).toFixed(1)}s`}
              onClick={() => handleClick(segment)}
              onMouseEnter={() => setHoveredSegment(segment)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          );
        })}
      </div>
      {hoveredSegment && (
        <div className="text-[10px] text-muted-foreground mt-1 text-center">
          {hoveredSegment.type === 'speech' ? 'Speech' : 'Pause'} — {(hoveredSegment.end - hoveredSegment.start).toFixed(1)}s
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1 text-center">
        Click on any segment to jump to that time
      </p>
    </div>
  );
};

export const Evaluation = () => {
  const [recording, setRecording]       = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [results, setResults]           = useState(null);
  const [stream, setStream]             = useState(null);
  const [script, setScript]             = useState('');
  const [scriptOpen, setScriptOpen]     = useState(false);
  const [currentFact]                   = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]);

  const videoRef         = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const fileInputRef     = useRef(null);
  const objectUrlRef     = useRef(null);

  const [language, setLanguage]         = useState('en');   // for language

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.script) {
      setScript(location.state.script);
      setScriptOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (e.code === 'Space' && recordedBlob && !analyzing) {
        e.preventDefault();
        const vid = videoRef.current;
        if (!vid || !objectUrlRef.current) return;
        vid.paused ? vid.play().catch(() => {}) : vid.pause();
      }
      if (e.code === 'Enter' && recordedBlob && !results && !analyzing) {
        e.preventDefault();
        analyzeRecording();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [recordedBlob, analyzing, results]);

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
      fd.append('language', language); //language append
      const { data } = await axios.post(`${API_URL}/evaluation/analyze`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setResults(data);
      console.log("Backend response:", data); 
      console.log("speech_timeline:", data.speech_timeline);
      toast.success('Analysis complete!');
    } catch (err) {
      const msg = err?.response?.data?.detail;
      toast.error(msg || 'Analysis failed');
      if (msg?.includes('audio')) {
        setRecordedBlob(null);
        if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
        if (videoRef.current) videoRef.current.src = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setRecordedBlob(null);
    setResults(null);
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    if (videoRef.current) { videoRef.current.src = ''; videoRef.current.srcObject = null; }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const playRecording = () => {
    if (!recordedBlob || !videoRef.current) return;
    if (!objectUrlRef.current) objectUrlRef.current = URL.createObjectURL(recordedBlob);
    const vid = videoRef.current;
    if (vid.src !== objectUrlRef.current) {
      vid.src = objectUrlRef.current;
      vid.load();
      vid.addEventListener('canplay', () => { vid.play().catch(() => {}); }, { once: true });
    } else {
      vid.paused ? vid.play().catch(() => {}) : vid.pause();
    }
  };

  const MAX_FILE_MB = 200;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File too large. Max size is ${MAX_FILE_MB} MB.`);
      e.target.value = '';
      return;
    }
    const blob = new Blob([file], { type: file.type });
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(blob);
    setRecordedBlob(blob);
    toast.success('Video loaded — ready to analyze');
  };

  const getGrade = (metric, value) => {
    if (value == null) return 'unknown';
    switch (metric) {
      case 'wpm':
        if (value >= 120 && value <= 160) return 'good';
        if (value >= 100 && value <= 180) return 'warning';
        return 'bad';
      case 'fillers':
        if (value <= 2) return 'good';
        if (value <= 6) return 'warning';
        return 'bad';
      case 'eye_contact':
        if (value >= 70) return 'good';
        if (value >= 50) return 'warning';
        return 'bad';
      case 'blink_rate':
        if (value >= 10 && value <= 20) return 'good';
        if (value >= 8 && value <= 30) return 'warning';
        return 'bad';
      default:
        return 'unknown';
    }
  };

  const getMetricFeedback = (metric, value, grade) => {
    if (value == null) return '';
    switch (metric) {
      case 'wpm':
        if (grade === 'good') return 'Your pace is ideal. Keep it up!';
        if (grade === 'warning') return 'Try slowing down a bit for better clarity.';
        return 'Your pace is off. Focus on controlled speaking.';
      case 'fillers':
        if (grade === 'good') return 'Great! Keep it up.';
        if (grade === 'warning') return 'A few fillers, but still okay.';
        return 'Too many fillers. Practice replacing them with pauses.';
      case 'long_pauses':
        if (grade === 'good') return 'Perfect! Good speech flow.';
        if (grade === 'warning') return 'Some pauses; try to connect sentences.';
        return 'Frequent pauses disrupt flow. Aim for smoother delivery.';
      case 'eye_contact':
        if (grade === 'good') return 'Excellent eye contact!';
        if (grade === 'warning') return 'Room for improvement. Try looking at the camera more.';
        return 'Low eye contact - work on engaging with the audience.';
      case 'blink_rate':
        if (grade === 'good') return 'Balanced blinking. Looks natural.';
        if (grade === 'warning') return 'Slightly irregular blinking. Keep it natural.';
        return 'Try to blink naturally while speaking.';
      default:
        return '';
    }
  };

  const grades = results?.grades ?? {
    wpm:         getGrade('wpm',         results?.wpm),
    fillers:     getGrade('fillers',     results?.filler_count),
    eye_contact: getGrade('eye_contact', results?.gaze_on_screen_pct),
    blink_rate:  getGrade('blink_rate',  results?.blink_count),
  };

  const generateFeedback = (r) => {
    if (!r) return null;
    const issues    = [];
    const strengths = [];

    if (r.wpm > 175)
      issues.push({ priority: 3, icon: '⚡', title: 'Slow down', detail: `You spoke at ${Math.round(r.wpm)} WPM — too fast for comfortable listening. Aim for 120-160 WPM. Try recording again at a deliberately slower pace.` });
    else if (r.wpm < 100)
      issues.push({ priority: 3, icon: '⏱️', title: 'Pick up the pace', detail: `You spoke at ${Math.round(r.wpm)} WPM — too slow and may sound uncertain. Aim for 120-160 WPM.` });
    else if (r.wpm >= 120 && r.wpm <= 160)
      strengths.push({ icon: '✓', title: 'Great pace', detail: `${Math.round(r.wpm)} WPM — ideal for clarity and engagement.` });

    if (r.filler_rate > 10) {
      const topFillers = Object.entries(r.filler_words || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([w]) => `"${w}"`).join(' and ');
      issues.push({ priority: 1, icon: '🗣️', title: 'Cut the fillers', detail: `${r.filler_rate?.toFixed(1)}% of your words were fillers — ${r.filler_count} total. Most-used: ${topFillers || '"um"'}. Replace them with a deliberate 1-second pause instead.` });
    } else if (r.filler_rate > 5)
      issues.push({ priority: 2, icon: '🗣️', title: 'Reduce fillers', detail: `${r.filler_count} filler words (${r.filler_rate?.toFixed(1)}%). Good but room to improve. Try to eliminate your most-used ones.` });
    else
      strengths.push({ icon: '✓', title: 'Clean speech', detail: `Only ${r.filler_count} filler words — excellent verbal discipline.` });

    const dur = r.duration || 60;
    const pausesPerMin = (r.long_pauses / (dur / 60)).toFixed(1);
    if (r.long_pauses > 4)
      issues.push({ priority: 2, icon: '⏸️', title: 'Fix the dead air', detail: `${r.long_pauses} long pauses (${pausesPerMin}/min). These break your flow and signal uncertainty. Prepare your next point before finishing the current one.` });
    else if (r.long_pauses === 0)
      strengths.push({ icon: '✓', title: 'No dead air', detail: 'No disruptive pauses — your delivery was continuous and confident.' });

    if (r.speech_ratio != null && r.speech_ratio < 0.60)
      issues.push({ priority: 2, icon: '🎙️', title: 'Too much silence', detail: `Only ${Math.round(r.speech_ratio * 100)}% of your recording was speech. Fill the silence with preparation — know your next point before speaking.` });

    if (r.vocabulary_richness != null && r.vocabulary_richness < 0.45)
      issues.push({ priority: 3, icon: '📚', title: 'Vary your words', detail: `Vocabulary richness: ${Math.round(r.vocabulary_richness * 100)}/100. You repeated many of the same words. Try using synonyms and richer language.` });
    else if (r.vocabulary_richness != null && r.vocabulary_richness >= 0.70)
      strengths.push({ icon: '✓', title: 'Rich vocabulary', detail: `Vocabulary richness: ${Math.round(r.vocabulary_richness * 100)}/100 — strong word variety.` });

    if (r.repeated_phrases && r.repeated_phrases.length > 0) {
      const top = r.repeated_phrases[0];
      issues.push({ priority: 3, icon: '🔁', title: 'Repeated phrases', detail: `You said "${top.phrase}" ${top.count} times. Repeated phrases make your delivery sound rehearsed. Vary your sentence structure.` });
    }

    if (r.gaze_on_screen_pct != null) {
      if (r.gaze_on_screen_pct < 40)
        issues.push({ priority: 1, icon: '👁️', title: 'Look at the camera', detail: `Only ${r.gaze_on_screen_pct}% eye contact — this is the strongest signal interviewers notice. Place a sticky note next to your camera as a visual reminder to look up.` });
      else if (r.gaze_on_screen_pct < 60)
        issues.push({ priority: 2, icon: '👁️', title: 'Improve eye contact', detail: `${r.gaze_on_screen_pct}% eye contact. Try to maintain camera contact for at least 70% of your answer.` });
      else if (r.gaze_on_screen_pct >= 75)
        strengths.push({ icon: '✓', title: 'Strong eye contact', detail: `${r.gaze_on_screen_pct}% — excellent. This builds trust with the interviewer.` });
    }

    if (r.pace_variation != null) {
      if (r.pace_variation < 5)
        issues.push({ priority: 3, icon: '📈', title: 'Avoid monotone delivery', detail: `Your pace had very little variation. Vary your speed — slow down for key points, speed up for context. This keeps listeners engaged.` });
      else if (r.pace_variation >= 10 && r.pace_variation <= 35)
        strengths.push({ icon: '✓', title: 'Engaging delivery', detail: 'Good pace variation — you naturally sped up and slowed down, keeping your delivery interesting.' });
    }

    issues.sort((a, b) => a.priority - b.priority);

    return {
      topIssues: issues.slice(0, 3),
      strengths: strengths.slice(0, 3),
    };
  };

  const feedback = results ? generateFeedback(results) : null;

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="p-6 md:p-8 max-w-7xl mx-auto" data-testid="evaluation-page">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-1">Evaluation</h1>
          <p className="text-muted-foreground text-sm">Record yourself speaking and get AI-powered feedback</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl overflow-hidden aspect-video relative">
              <video ref={videoRef} data-testid="evaluation-video"
              className="w-full h-full object-cover bg-black" playsInline
              onError={() => {}}
              style={{ display: results?.video_data ? 'none' : 'block' }} />
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
              {script && !recordedBlob && !analyzing && (
                <div className="ev-script-overlay" style={{ opacity: recording ? 0.35 : 1 }}>
                  <p className="ev-script-overlay-label">Script — {recording ? 'glance only' : 'editing enabled'}</p>
                  <textarea
                    value={script}
                    onChange={e => setScript(e.target.value)}
                    placeholder="Your script will appear here..."
                    readOnly={recording}
                  />
                </div>
              )}
              {analyzing && <AnalyzingOverlay fact={currentFact} />}
              {results?.video_data && !analyzing && (
                <AnnotatedVideoPlayer src={results.video_data} />
              )}
              {recordedBlob && !analyzing && !results?.video_data && (
                <VideoControls videoRef={videoRef} objectUrlRef={objectUrlRef} recordedBlob={recordedBlob} />
              )}
            </div>

            <div className="flex gap-2.5 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium"
                disabled={recording || analyzing}
              >
                <option value="en">🇬🇧 English</option>
                <option value="ne">🇳🇵 Nepali</option>
              </select>

              {!recording && !recordedBlob && (
                <>
                  <button onClick={startRecording} data-testid="start-recording-btn"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: '#FF6B35' }}>
                    <Video className="w-4 h-4" /> Start Recording
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} data-testid="upload-video-btn"
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border border-border bg-card text-foreground hover:bg-muted transition-all">
                    <Upload className="w-4 h-4" /> Upload Video
                  </button>
                </>
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
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
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

            {/* Transcript card – always show if results exist, even if empty */}
            {results && (
              <div className="ev-result-enter">
                <Transcript 
                  transcript={results.transcript || "No transcript available (analysis may have failed)."} 
                  fillerWords={results.filler_words || {}} 
                />
              </div>
            )}

            {/* Speech Timeline */}
            {results?.speech_timeline && results.speech_timeline.length > 0 && (
              <SpeechTimeline
                timeline={results.speech_timeline}
                totalDuration={results.duration || 0}
                videoRef={videoRef}
              />
            )}
            
            {/* Coach Feedback card */}
                {feedback && (
                  <div className="ev-result-enter bg-card border border-border rounded-2xl p-5 space-y-4" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center gap-2 pb-3 border-b border-border">
                      <Brain className="w-4 h-4 text-primary" />
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Coach Feedback</p>
                    </div>

                    {feedback.topIssues.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Focus on these</p>
                        {feedback.topIssues.map((issue, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-xl"
                            style={{
                              background: i === 0 ? 'rgba(239,68,68,0.06)' : i === 1 ? 'rgba(245,158,11,0.06)' : 'rgba(46,79,79,0.04)',
                              border: `1px solid ${i === 0 ? 'rgba(239,68,68,0.15)' : i === 1 ? 'rgba(245,158,11,0.15)' : 'rgba(46,79,79,0.1)'}`
                            }}>
                            <span className="text-base flex-shrink-0 mt-0.5">{issue.icon}</span>
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-0.5">{issue.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{issue.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {feedback.strengths.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">What went well</p>
                        {feedback.strengths.map((s, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="text-green-500 text-xs font-bold mt-0.5 flex-shrink-0">{s.icon}</span>
                            <div>
                              <span className="text-xs font-semibold text-foreground">{s.title} </span>
                              <span className="text-xs text-muted-foreground">{s.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feedback.topIssues.length === 0
                          ? "Outstanding session. You're interview-ready."
                          : `Work on ${feedback.topIssues.map(i => i.title.toLowerCase()).join(', ')} and your score will improve significantly.`}
                      </p>
                    </div>
                  </div>
                )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {!recording && (
              <ScriptPanel script={script} setScript={setScript} visible={scriptOpen} setVisible={setScriptOpen} />
            )}

            {results ? (
              <>
                {/* Metrics card */}
                <div className="ev-result-enter bg-card border border-border rounded-2xl p-5 space-y-4" data-testid="evaluation-results">
                  {/* Combined Score */}
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <AnimatedScoreRing score={results.combined_score ?? 0} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Combined Score</p>
                      <p className="text-xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {results.combined_score >= 75 ? 'Excellent! 🥳' : results.combined_score >= 55 ? 'Great job! 👍' : results.combined_score >= 35 ? 'Fair 😊' : 'Needs Practice 💪'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {results.combined_score >= 75 ? "You're doing great – keep polishing those skills." :
                         results.combined_score >= 55 ? "Good effort. A few tweaks and you'll be at the top." :
                         results.combined_score >= 35 ? "You're on the right track. Keep practicing." :
                         "Everyone starts somewhere. Regular practice will get you there."}
                      </p>
                    </div>
                  </div>

                  {/* Metric rows */}
                  <div className="space-y-3">
                    {results.audio_score != null && (
                      <AnimatedMetricRow
                        label="Audio Score" value={results.audio_score} unit="/ 100"
                        grade={results.audio_score >= 75 ? 'good' : results.audio_score >= 50 ? 'warning' : 'bad'}
                        barPct={results.audio_score} delay={0.1}
                        feedback={results.audio_score >= 75 ? 'Strong overall delivery.' : results.audio_score >= 50 ? 'Good effort — focus on fluency and vocabulary.' : 'Work on pace, fillers and speech continuity.'}
                      />
                    )}
                    <AnimatedMetricRow
                      label="Words Per Minute" value={results.wpm} unit="wpm"
                      grade={grades.wpm} barPct={Math.min(100, (results.wpm / 220) * 100)} delay={0.2}
                      feedback={getMetricFeedback('wpm', results.wpm, grades.wpm)}
                    />
                    <AnimatedMetricRow
                      label="Filler Words" value={results.filler_count} unit="found"
                      grade={grades.fillers} barPct={Math.min(100, (results.filler_count / 20) * 100)} delay={0.4}
                      feedback={getMetricFeedback('fillers', results.filler_count, grades.fillers)}
                    />
                    {results.filler_rate != null && (
                      <AnimatedMetricRow
                        label="Filler Rate" value={results.filler_rate} unit="% of words"
                        grade={grades.fillers} barPct={Math.min(100, (results.filler_rate / 20) * 100)} delay={0.5}
                        feedback={results.filler_rate < 3 ? 'Excellent — very clean speech.' : results.filler_rate < 8 ? 'Acceptable. Aim for under 3%.' : 'High filler rate. Replace fillers with deliberate pauses.'}
                      />
                    )}
                    <AnimatedMetricRow
                      label="Long Pauses" value={results.long_pauses} unit="pauses"
                      grade={grades.pauses ?? (results.long_pauses === 0 ? 'good' : results.long_pauses <= 3 ? 'warning' : 'bad')}
                      barPct={results.long_pauses === 0 ? 100 : results.long_pauses <= 3 ? 50 : 20} delay={0.6}
                      feedback={getMetricFeedback('long_pauses', results.long_pauses, grades.pauses ?? (results.long_pauses === 0 ? 'good' : results.long_pauses <= 3 ? 'warning' : 'bad'))}
                    />
                    {results.avg_pause_duration > 0 && (
                      <AnimatedMetricRow
                        label="Avg Pause Length" value={results.avg_pause_duration} unit="sec"
                        grade={results.avg_pause_duration < 2 ? 'good' : results.avg_pause_duration < 3 ? 'warning' : 'bad'}
                        barPct={Math.max(0, 100 - (results.avg_pause_duration / 5) * 100)} delay={0.7}
                        feedback={results.avg_pause_duration < 2 ? 'Pauses are brief and natural.' : 'Pauses are a bit long. Try to keep them under 2 seconds.'}
                      />
                    )}
                    {results.speech_ratio != null && (
                      <AnimatedMetricRow
                        label="Speech Continuity" value={Math.round(results.speech_ratio * 100)} unit="%"
                        grade={grades.speech_ratio ?? (results.speech_ratio >= 0.75 ? 'good' : results.speech_ratio >= 0.55 ? 'warning' : 'bad')}
                        barPct={results.speech_ratio * 100} delay={0.8}
                        feedback={results.speech_ratio >= 0.75 ? 'You spoke consistently throughout.' : results.speech_ratio >= 0.55 ? 'Some dead air. Try to reduce long silences.' : 'Too much silence. Work on maintaining flow.'}
                      />
                    )}
                    {results.vocabulary_richness != null && (
                      <AnimatedMetricRow
                        label="Vocabulary Richness" value={Math.round(results.vocabulary_richness * 100)} unit="/ 100"
                        grade={grades.vocabulary ?? (results.vocabulary_richness >= 0.70 ? 'good' : results.vocabulary_richness >= 0.50 ? 'warning' : 'bad')}
                        barPct={results.vocabulary_richness * 100} delay={0.9}
                        feedback={results.vocabulary_richness >= 0.70 ? 'Great word variety — sounds natural and engaging.' : results.vocabulary_richness >= 0.50 ? 'Decent variety. Try using more synonyms.' : 'Low word variety. Expand your vocabulary for impact.'}
                      />
                    )}
                    {results.pace_variation != null && (
                      <AnimatedMetricRow
                        label="Expressiveness" value={Math.round(results.pace_variation)} unit="variation"
                        grade={grades.pace_variation ?? (results.pace_variation >= 10 && results.pace_variation <= 35 ? 'good' : results.pace_variation < 5 ? 'bad' : 'warning')}
                        barPct={Math.min(100, (results.pace_variation / 50) * 100)} delay={1.0}
                        feedback={results.pace_variation >= 10 && results.pace_variation <= 35 ? 'Good variation in pace — sounds engaging.' : results.pace_variation < 5 ? 'Very monotone. Vary your speed to keep listeners engaged.' : 'Pace is quite erratic. Aim for controlled variation.'}
                      />
                    )}
                    {results.gaze_on_screen_pct != null && (
                      <AnimatedMetricRow
                        label="Eye Contact" value={results.gaze_on_screen_pct} unit="%"
                        grade={grades.eye_contact} barPct={results.gaze_on_screen_pct} delay={1.1}
                        feedback={getMetricFeedback('eye_contact', results.gaze_on_screen_pct, grades.eye_contact)}
                      />
                    )}
                    {results.blink_count != null && (
                      <AnimatedMetricRow
                        label="Blink Count" value={results.blink_count} unit="blinks"
                        grade={grades.blink_rate} barPct={Math.min(100, (results.blink_count / 50) * 100)} delay={1.2}
                        feedback={getMetricFeedback('blink_rate', results.blink_count, grades.blink_rate)}
                      />
                    )}
                  </div>

                  {/* Filler words breakdown */}
                  {results.filler_words && Object.keys(results.filler_words).length > 0 && (
                    <div className="ev-metric-enter pt-3 border-t border-border" style={{ animationDelay: '0.55s' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Filler Words Found</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(results.filler_words).map(([word, count]) => (
                          <span key={word} className="ev-filler-badge">"{word}" x {count}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                
              </>
            ) : (
              /* Empty state */
              <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(46,79,79,.08)' }}>
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-medium mb-1">No Results Yet</h3>
                  <p className="text-xs text-muted-foreground">
                    Record & analyze to see your pace, fillers, eye contact & blink rate.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  {[
                    ['120-160', 'Ideal WPM'],
                    ['< 5%',    'Filler target'],
                    ['> 70%',   'Eye contact'],
                    ['10-20/min', 'Blink rate'],
                  ].map(([val, label]) => (
                    <div key={label} className="rounded-xl p-2 text-center" style={{ background: '#F5F7F5', border: '1px solid #E2E4DE' }}>
                      <div className="text-sm font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>{val}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
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

