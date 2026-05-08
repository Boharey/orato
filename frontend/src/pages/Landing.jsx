import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ArrowRight, TrendingUp, Zap, Eye, Mic, Target, Calendar, ChevronDown } from 'lucide-react';

/* ── Scroll-reveal hook ───────────────────────────────────────────────────── */
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
    background:#fff;
    border:1px solid #E2E4DE;
    border-radius:16px;
    padding:32px;
    transition:transform .3s ease, box-shadow .3s ease, border-color .3s ease;
    position:relative;
    overflow:hidden;
  }
  .ol-feat-card::after {
    content:'';
    position:absolute;
    bottom:0; left:0; right:0;
    height:3px;
    background:linear-gradient(90deg, var(--fc,#2E4F4F), transparent);
    transform:scaleX(0);
    transform-origin:left;
    transition:transform .3s ease;
  }
  .ol-feat-card:hover { transform:translateY(-6px); box-shadow:0 20px 48px rgba(46,79,79,.12); border-color:#C8D0C8; }
  .ol-feat-card:hover::after { transform:scaleX(1); }

  .ol-stat-card {
    background:#fff;
    border:1px solid #E2E4DE;
    border-radius:16px;
    padding:32px 24px;
    text-align:center;
    transition:transform .3s ease, box-shadow .3s ease;
  }
  .ol-stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(46,79,79,.1); }

  .ol-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    background:#FF6B35; color:#fff;
    padding:14px 28px; border-radius:999px;
    font-weight:600; font-size:14px;
    transition:background .2s, transform .2s, box-shadow .2s;
    border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif;
  }
  .ol-btn-primary:hover { background:#e85c26; transform:translateY(-1px); box-shadow:0 8px 24px rgba(255,107,53,.3); }

  .ol-btn-outline {
    display:inline-flex; align-items:center; gap:8px;
    background:transparent; color:#2E4F4F;
    padding:13px 28px; border-radius:999px;
    font-weight:600; font-size:14px;
    border:1.5px solid #2E4F4F;
    transition:background .2s, transform .2s;
    cursor:pointer;
    font-family:'DM Sans',sans-serif;
  }
  .ol-btn-outline:hover { background:#2E4F4F10; transform:translateY(-1px); }

  .ol-tag {
    background:#2E4F4F12;
    border:1px solid #2E4F4F30;
    color:#2E4F4F;
    padding:5px 14px;
    border-radius:999px;
    font-size:11px;
    font-weight:600;
    letter-spacing:.1em;
    text-transform:uppercase;
    display:inline-block;
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
    margin:0 auto 20px;
    transition:background .3s, border-color .3s;
  }
  .ol-step:hover .ol-step-num { background:#2E4F4F18; border-color:#2E4F4F70; }

  .ol-cta-section { background:linear-gradient(135deg, #2E4F4F 0%, #1a3333 100%); }

  .ol-hero-chip {
    background:rgba(255,255,255,.9);
    border:1px solid #E2E4DE;
    border-radius:12px;
    padding:12px 16px;
    backdrop-filter:blur(12px);
    text-align:center;
    box-shadow:0 4px 16px rgba(46,79,79,.12);
  }

  .ol-scroll-ind { animation:fadeIn 1s 1.5s both; }
  .ol-scroll-arrow { animation:float 2s ease-in-out infinite; }

  .ol-mesh {
    position:absolute; inset:0; pointer-events:none; overflow:hidden;
  }
  .ol-mesh-circle {
    position:absolute; border-radius:50%;
    background:radial-gradient(circle, var(--c) 0%, transparent 70%);
    filter:blur(60px);
  }
`;

export const Landing = () => {
  const [statsRef, statsVis] = useReveal();
  const [featRef,  featVis]  = useReveal();
  const [howRef,   howVis]   = useReveal();
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
        {/* Mesh orbs */}
        <div className="ol-mesh">
          <div className="ol-mesh-circle" style={{ '--c':'rgba(46,79,79,.08)', width:600, height:600, top:'-10%', left:'-10%', transform:`translate(${mouse.x*-25}px,${mouse.y*-18}px)`, transition:'transform .12s linear' }} />
          <div className="ol-mesh-circle" style={{ '--c':'rgba(255,107,53,.06)', width:400, height:400, bottom:'5%', right:'0%', transform:`translate(${mouse.x*18}px,${mouse.y*12}px)`, transition:'transform .12s linear' }} />
          <div className="ol-mesh-circle" style={{ '--c':'rgba(46,79,79,.05)', width:300, height:300, top:'40%', right:'25%', transform:`translate(${mouse.x*12}px,${mouse.y*8}px)`, transition:'transform .12s linear' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="space-y-8">
              <div className="ol-hero-badge">
                <span className="ol-tag">AI Communication Coach</span>
              </div>
              <div className="ol-hero-h1 space-y-1">
                <h1 className="ol-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-light leading-[1.08] tracking-tight text-foreground">
                  Speak with
                </h1>
                <h1 className="ol-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-black leading-[1.08] tracking-tight" style={{ color: '#2E4F4F' }}>
                  Confidence
                </h1>
                <h1 className="ol-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-light leading-[1.08] tracking-tight text-foreground italic">
                  & Clarity
                </h1>
                <div className="ol-hero-line h-[3px] w-20 rounded-full mt-4" style={{ background: '#FF6B35' }} />
              </div>
              <p className="ol-hero-sub text-lg leading-relaxed max-w-lg text-muted-foreground">
                Transform your communication with AI-powered analysis. Real-time gaze tracking, filler detection, and personalized coaching — all in one platform.
              </p>
              <div className="ol-hero-ctas flex flex-wrap gap-4">
                <Link to="/register">
                  <button className="ol-btn-primary" data-testid="hero-get-started-btn">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="ol-btn-outline" data-testid="hero-login-btn">
                    Sign In
                  </button>
                </Link>
              </div>
              <div className="ol-hero-ctas flex flex-wrap gap-6">
                {['No credit card', 'Free plan included', 'Instant results'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="ol-check">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — image card */}
            <div className="ol-hero-img relative">
              {/* Decorative rings */}
              <div className="absolute rounded-2xl" style={{ inset: -12, border: '1px solid rgba(46,79,79,.12)', borderRadius: 24 }} />
              <div className="absolute rounded-2xl" style={{ inset: -24, border: '1px solid rgba(46,79,79,.06)', borderRadius: 28 }} />

              <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid #E2E4DE' }}>
                <img
                  src="https://images.unsplash.com/photo-1646369505567-3a9cbb052342?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Confident speaker"
                  className="w-full object-cover"
                  style={{ height: 400 }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(46,79,79,.5) 0%, transparent 50%)' }} />

                {/* Bottom chips row */}
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

                {/* Live badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,.9)', color: '#2E4F4F', border: '1px solid #E2E4DE' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Analysis
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
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
                <div className="ol-serif text-4xl font-black mb-1" style={{ color: '#FF6B35' }}>
                  <Counter target={value} suffix={suffix} />
                </div>
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
              Everything to Master
              <span className="block font-light italic" style={{ color: '#2E4F4F' }}>Communication</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Six core modules. One platform. Measurable results every session.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ol-stagger">
            {FEATURES.map(({ icon: Icon, title, description, color }, i) => (
              <div
                key={title}
                className={`ol-feat-card ol-reveal ${featVis ? 'on' : ''}`}
                style={{ '--fc': color, transitionDelay: `${i * .08}s` }}
                data-testid={`feature-card-${i}`}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${color}12` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
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
            {/* Connector */}
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

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="ol-cta-section py-32 relative overflow-hidden" data-testid="cta-section">
        {/* Mesh orbs on dark bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ width:500, height:500, background:'radial-gradient(circle, rgba(255,107,53,.08) 0%, transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(60px)' }} />
          <div className="absolute rounded-full" style={{ width:300, height:300, background:'radial-gradient(circle, rgba(255,255,255,.04) 0%, transparent 70%)', top:'-20%', right:'-5%', filter:'blur(40px)' }} />
        </div>

        <div ref={ctaRef} className={`max-w-3xl mx-auto px-6 text-center relative z-10 ol-reveal ${ctaVis ? 'on' : ''}`}>
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.15)' }}>
            Join ORATO
          </span>
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