import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import axios from 'axios';
import { ArrowLeft, ArrowRight, PlayCircle, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const toSlug = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const STYLES = `
  @keyframes tm-fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .tm-enter { animation: tm-fadeUp .4s ease both; }

  .tm-tech-row {
    background:#fff; border:1px solid #E2E4DE; border-radius:14px;
    padding:18px 20px; cursor:pointer;
    display:flex; align-items:center; gap:16px;
    transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    position:relative; overflow:hidden;
  }
  .tm-tech-row::before {
    content:''; position:absolute; left:0; top:0; bottom:0;
    width:3px; background:var(--tc,#2E4F4F);
    transform:scaleY(0); transform-origin:bottom;
    transition:transform .25s ease;
    border-radius:0 2px 2px 0;
  }
  .tm-tech-row:not(.locked):hover { transform:translateX(4px); box-shadow:0 6px 24px rgba(46,79,79,.08); border-color:#C8D0C8; }
  .tm-tech-row:not(.locked):hover::before { transform:scaleY(1); }
  .tm-tech-row:not(.locked):hover .tm-arrow { opacity:1; transform:translateX(0); }
  .tm-tech-row.locked {
    opacity:0.55;
    cursor:not-allowed;
    filter:grayscale(20%);
  }
  .tm-tech-row.locked:hover { transform:none; box-shadow:none; border-color:#E2E4DE; }
  .tm-arrow { opacity:0; transform:translateX(-6px); transition:opacity .2s, transform .2s; }

  .tm-num {
    width:36px; height:36px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-family:'Playfair Display',serif; font-weight:900; font-size:14px;
  }
  .tm-lock-message {
    font-size:11px; color:#9ca3af; margin-top:4px;
  }
`;

export const TrainingModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    fetchModule();
    fetchSessionCount();
  }, [moduleId]);

  const fetchModule = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/training/modules`);
      setModule(data.modules.find(m => m.id === moduleId) || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionCount = async () => {
    try {
      const res = await axios.get(`${API_URL}/evaluation/session-count`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSessionCount(res.data.count);
    } catch (e) {
      console.error('Failed to fetch session count', e);
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

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="p-8 max-w-3xl mx-auto" data-testid="training-module-page">

        {/* Back */}
        <button onClick={() => navigate('/training')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          data-testid="back-to-training-btn">
          <ArrowLeft className="w-4 h-4" /> Back to Modules
        </button>

        {/* Header */}
        <div className="mb-10 tm-enter">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#FF6B35' }}>
            {module.sections?.length} techniques
          </p>
          <h1 className="text-4xl font-serif font-light tracking-tight mb-3" data-testid="module-title">
            {module.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl" data-testid="module-description">
            {module.description}
          </p>
          {/* Progress summary */}
          <div className="mt-3 text-xs text-muted-foreground">
            🎯 You have completed <strong>{sessionCount}</strong> practice session{sessionCount !== 1 ? 's' : ''}.
          </div>
        </div>

        {/* Progress hint */}
        <div className="flex items-center gap-3 p-4 rounded-xl mb-8 text-sm"
          style={{ background: '#2E4F4F0A', border: '1px solid #2E4F4F20' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#2E4F4F' }} />
          <span className="text-foreground">
            Work through each technique in order, or jump to what you need most.
          </span>
        </div>

        {/* Technique list */}
        <div className="space-y-3">
          {module.sections?.map((section, i) => {
            const slug = toSlug(section.heading);
            const hasVideo = !!section.video;
            const pointCount = section.points?.length || 0;
            // ✅ USE BACKEND'S LOCKED FLAG ONLY
            const isLocked = section.locked === true;

            return (
              <div
                key={i}
                className={`tm-enter tm-tech-row ${isLocked ? 'locked' : ''}`}
                style={{ '--tc': i % 2 === 0 ? '#2E4F4F' : '#FF6B35', animationDelay: `${i * 0.06}s` }}
                data-testid={`module-section-${i}`}
                onClick={() => {
                  if (!isLocked) navigate(`/training/${moduleId}/${slug}`);
                }}
              >
                {/* Number */}
                <div className="tm-num" style={{
                  background: i % 2 === 0 ? '#2E4F4F12' : '#FF6B3512',
                  color: i % 2 === 0 ? '#2E4F4F' : '#FF6B35'
                }}>
                  {isLocked ? <Lock className="w-4 h-4" /> : String(i + 1).padStart(2, '0')}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                    {section.heading}
                    {isLocked && <span className="ml-2 text-xs text-muted-foreground">(locked)</span>}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{pointCount} step{pointCount !== 1 ? 's' : ''}</span>
                    {hasVideo && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#FF6B35' }}>
                        <PlayCircle className="w-3 h-3" /> Video included
                      </span>
                    )}
                  </div>
                  {isLocked && (
                    <p className="tm-lock-message">
                      🔒 Complete more practice sessions (≥1 min) to unlock this technique.
                    </p>
                  )}
                </div>

                {/* Arrow (only if not locked) */}
                {!isLocked && <ArrowRight className="tm-arrow w-4 h-4 flex-shrink-0 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* CTA (unchanged) */}
        <div className="mt-12 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #2E4F4F 0%, #1a3333 100%)' }}>
          <h3 className="text-lg font-serif font-medium text-white mb-1">Ready to practice?</h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,.6)' }}>
            Record yourself and get scored on what you've learned here.
          </p>
          <button onClick={() => navigate('/evaluation')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: '#FF6B35', color: '#fff' }}
            data-testid="go-to-evaluation-btn">
            Go to Evaluation <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Layout>
  );
};