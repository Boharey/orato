import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import axios from 'axios';
import { ArrowLeft, ArrowRight, PlayCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const toSlug = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Split point into title + body if separated by " → "
const parsePoint = (point) => {
  const parts = point.split(' → ');
  if (parts.length >= 2) return { label: parts[0], body: parts.slice(1).join(' → ') };
  return { label: null, body: point };
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

  @keyframes tp-fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tp-fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes tp-lineIn  { from{transform:scaleX(0)} to{transform:scaleX(1)} }

  .tp-enter  { animation: tp-fadeUp .45s ease both; }
  .tp-img-in { animation: tp-fadeIn .6s .1s ease both; }

  .tp-step {
    display:flex; gap:14px; align-items:flex-start;
    padding:16px 18px; border-radius:14px;
    background:#fff; border:1px solid #E2E4DE;
    transition:box-shadow .2s;
  }
  .tp-step:hover { box-shadow:0 4px 16px rgba(46,79,79,.07); }

  .tp-step-num {
    width:28px; height:28px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700;
  }

  .tp-why-block {
    border-left:3px solid #FF6B35;
    padding:14px 16px; border-radius:0 10px 10px 0;
    background:#FFF7F4;
  }

  .tp-nav-btn {
    display:flex; align-items:center; gap:8px;
    padding:10px 18px; border-radius:12px; font-size:13px; font-weight:600;
    border:1.5px solid #E2E4DE; background:#fff; color:#374151; cursor:pointer;
    transition:all .2s;
  }
  .tp-nav-btn:hover { border-color:#2E4F4F; color:#2E4F4F; background:#2E4F4F08; }
  .tp-nav-btn:disabled { opacity:.35; cursor:not-allowed; }

  .tp-progress-dot {
    width:6px; height:6px; border-radius:50%;
    background:#E2E4DE; transition:all .2s;
  }
  .tp-progress-dot.active { background:#2E4F4F; width:18px; border-radius:3px; }

  .tp-accent-line { height:3px; background:linear-gradient(90deg,#2E4F4F,#FF6B35); border-radius:2px; transform-origin:left; animation:tp-lineIn .6s .3s ease both; }

  .tp-video-wrap {
    border-radius:16px; overflow:hidden;
    border:1px solid #E2E4DE;
    box-shadow:0 8px 32px rgba(46,79,79,.1);
  }
`;

export const TechniquePage = () => {
  const { moduleId, techniqueSlug } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchModule(); }, [moduleId]);

  const fetchModule = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/training/modules`);
      const mod = data.modules.find(m => m.id === moduleId);
      setModule(mod || null);
      if (mod) {
        const idx = mod.sections.findIndex(s => toSlug(s.heading) === techniqueSlug);
        setSectionIndex(idx >= 0 ? idx : 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    </Layout>
  );

  if (!module) return (
    <Layout><div className="p-8 text-muted-foreground">Module not found</div></Layout>
  );

  const section   = module.sections[sectionIndex];
  const total     = module.sections.length;
  const isFirst   = sectionIndex === 0;
  const isLast    = sectionIndex === total - 1;
  const prevSlug  = !isFirst ? toSlug(module.sections[sectionIndex - 1].heading) : null;
  const nextSlug  = !isLast  ? toSlug(module.sections[sectionIndex + 1].heading) : null;

  const goTo = (slug) => navigate(`/training/${moduleId}/${slug}`);

  // Separate "Why it works" points from regular points
  const whyPoints   = section.points.filter(p => p.toLowerCase().startsWith('why it works'));
  const stepsPoints = section.points.filter(p => !p.toLowerCase().startsWith('why it works'));

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8 tp-enter">
          <button onClick={() => navigate('/training')} className="hover:text-foreground transition-colors">Training</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/training/${moduleId}`)} className="hover:text-foreground transition-colors truncate max-w-[140px]">
            {module.title}
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium truncate max-w-[160px]">{section.heading}</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1.5 mb-8 tp-enter" style={{ animationDelay: '.05s' }}>
          {module.sections.map((_, i) => (
            <button key={i} onClick={() => goTo(toSlug(module.sections[i].heading))}
              className={`tp-progress-dot ${i === sectionIndex ? 'active' : ''}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-2">{sectionIndex + 1} / {total}</span>
        </div>

        {/* Heading */}
        <div className="mb-8 tp-enter" style={{ animationDelay: '.1s' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ background: sectionIndex % 2 === 0 ? '#2E4F4F12' : '#FF6B3512', color: sectionIndex % 2 === 0 ? '#2E4F4F' : '#FF6B35' }}>
              Technique {String(sectionIndex + 1).padStart(2, '0')}
            </span>
          </div>
          <h1 className="text-3xl font-serif font-black text-foreground leading-tight mb-3">
            {section.heading}
          </h1>
          <div className="tp-accent-line w-16" />
        </div>

        {/* Video */}
        {section.video && (
          <div className="mb-8 tp-img-in">
            <div className="flex items-center gap-2 mb-3">
              <PlayCircle className="w-4 h-4" style={{ color: '#FF6B35' }} />
              <span className="text-sm font-semibold text-foreground">Video Lesson</span>
            </div>
            <div className="tp-video-wrap aspect-video">
              <iframe
                src={section.video}
                title={section.heading}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Steps */}
        {stepsPoints.length > 0 && (
          <div className="mb-8 tp-enter" style={{ animationDelay: '.2s' }}>
            <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">How to Practice</h2>
            <div className="space-y-3">
              {stepsPoints.map((point, i) => {
                const { label, body } = parsePoint(point);
                return (
                  <div key={i} className="tp-step" style={{ animationDelay: `${.2 + i * .06}s` }}>
                    <div className="tp-step-num" style={{
                      background: sectionIndex % 2 === 0 ? '#2E4F4F12' : '#FF6B3512',
                      color: sectionIndex % 2 === 0 ? '#2E4F4F' : '#FF6B35'
                    }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      {label && <p className="text-xs font-bold text-foreground mb-0.5">{label}</p>}
                      <p className="text-sm text-foreground leading-relaxed">{body}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#E2E4DE' }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Why it works */}
        {whyPoints.map((point, i) => {
          const { body } = parsePoint(point);
          return (
            <div key={i} className="tp-why-block mb-8 tp-enter" style={{ animationDelay: '.35s' }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#FF6B35' }}>
                Why It Works
              </p>
              <p className="text-sm text-foreground leading-relaxed">{body}</p>
            </div>
          );
        })}

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-8 tp-enter" style={{ animationDelay: '.4s' }}>
          <button
            className="tp-nav-btn"
            disabled={isFirst}
            onClick={() => prevSlug && goTo(prevSlug)}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button onClick={() => navigate(`/training/${moduleId}`)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            All techniques
          </button>

          {isLast ? (
            <button
              className="tp-nav-btn"
              style={{ background: '#2E4F4F', color: '#fff', borderColor: '#2E4F4F' }}
              onClick={() => navigate('/evaluation')}
            >
              Practice Now <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="tp-nav-btn"
              onClick={() => nextSlug && goTo(nextSlug)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </Layout>
  );
};