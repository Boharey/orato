import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import axios from 'axios';
import { TrendingUp, Zap, Mic, Eye, ArrowUpRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MODULE_META = [
  { id: 'pace-rhythm',                icon: TrendingUp, label: '01', accent: '#2E4F4F', tag: 'Delivery'     },
  { id: 'filler-word-reduction',      icon: Zap,        label: '02', accent: '#FF6B35', tag: 'Clarity'      },
  { id: 'pronunciation-articulation', icon: Mic,        label: '03', accent: '#2E4F4F', tag: 'Articulation' },
  { id: 'eye-contact-presence',       icon: Eye,        label: '04', accent: '#FF6B35', tag: 'Presence'     },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  .tr-root  { font-family:'DM Sans',sans-serif; }
  .tr-serif { font-family:'Playfair Display',serif; }

  @keyframes tr-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  .tr-h  { animation:tr-up .5s ease both; }
  .tr-c1 { animation:tr-up .5s .08s ease both; }
  .tr-c2 { animation:tr-up .5s .15s ease both; }
  .tr-c3 { animation:tr-up .5s .22s ease both; }
  .tr-c4 { animation:tr-up .5s .29s ease both; }

  .tr-card {
    background:#fff;
    border:1px solid #E8EAE8;
    border-radius:20px;
    padding:28px 28px 24px;
    cursor:pointer;
    position:relative;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    transition:transform .26s cubic-bezier(.22,.68,0,1.15), box-shadow .26s ease, border-color .26s ease;
  }
  .tr-card:hover {
    transform:translateY(-5px);
    box-shadow:0 20px 52px rgba(46,79,79,.09);
  }
  .tr-card[data-t="teal"]:hover  { box-shadow:0 20px 52px rgba(46,79,79,.11),  0 0 0 1.5px rgba(46,79,79,.18); }
  .tr-card[data-t="orange"]:hover{ box-shadow:0 20px 52px rgba(255,107,53,.09), 0 0 0 1.5px rgba(255,107,53,.2); }

  .tr-bar {
    position:absolute; bottom:0; left:0; right:0; height:3px;
    transform:scaleX(0); transform-origin:left;
    transition:transform .32s ease;
  }
  .tr-card:hover .tr-bar { transform:scaleX(1); }

  .tr-arrow {
    width:34px; height:34px; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
    transition:transform .22s ease;
  }
  .tr-card:hover .tr-arrow { transform:translate(3px,-3px); }

  .tr-tag {
    display:inline-block; font-size:10px; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase;
    padding:4px 11px; border-radius:999px;
  }

  .tr-divider { height:1px; background:#EEF0EE; margin:18px 0; }

  .tr-num {
    font-family:'Playfair Display',serif;
    font-size:10px; font-weight:900; letter-spacing:.14em; text-transform:uppercase;
    opacity:.28; margin-bottom:4px;
  }
`;

export const Training = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchModules(); }, []);

  const fetchModules = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/training/modules`);
      setModules(data.modules);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    </Layout>
  );

  const cls = ['tr-c1','tr-c2','tr-c3','tr-c4'];

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="tr-root p-8 max-w-5xl mx-auto" data-testid="training-page">

        {/* Header */}
        <div className="mb-12 tr-h">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color:'#FF6B35' }}>
            Training
          </p>
          <h1 className="tr-serif text-[2.6rem] leading-tight font-light tracking-tight text-foreground mb-3">
            Communication<br /><span className="font-black">Modules</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Four skill areas. Work through each module's techniques at your own pace.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MODULE_META.map((meta, i) => {
            const mod    = modules.find(m => m.id === meta.id);
            if (!mod) return null;
            const Icon   = meta.icon;
            const isTeal = meta.accent === '#2E4F4F';
            const count  = mod.sections?.length || 0;
            const desc   = mod.description.length > 100
              ? mod.description.slice(0, 100).trimEnd() + '…'
              : mod.description;

            return (
              <div
                key={meta.id}
                className={`tr-card ${cls[i]}`}
                data-t={isTeal ? 'teal' : 'orange'}
                data-testid={`training-module-${i}`}
                onClick={() => navigate(`/training/${meta.id}`)}
              >
                {/* Accent bar */}
                <div className="tr-bar" style={{ background: meta.accent }} />

                {/* Top row */}
                <div className="flex items-start justify-between mb-1">
                  <span className="tr-tag" style={{ background:`${meta.accent}12`, color:meta.accent }}>
                    {meta.tag}
                  </span>
                  <div className="tr-arrow" style={{ background:`${meta.accent}0e` }}>
                    <ArrowUpRight className="w-4 h-4" style={{ color:meta.accent }} />
                  </div>
                </div>

                {/* Module number */}
                <p className="tr-num" style={{ color:meta.accent }}>{meta.label}</p>

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background:`${meta.accent}0e` }}>
                  <Icon className="w-[18px] h-[18px]" style={{ color:meta.accent }} />
                </div>

                {/* Title */}
                <h3 className="tr-serif text-[1.2rem] font-bold text-foreground leading-snug mb-2">
                  {mod.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>

                {/* Footer */}
                <div className="tr-divider" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {count} technique{count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs font-semibold" style={{ color:meta.accent }}>
                    Explore →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip bar */}
        <div className="mt-8 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
          style={{ background:'#F6F8F6', border:'1px solid #E8EAE8' }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:'#FF6B35' }} />
          <p className="text-xs text-muted-foreground">
            After practising a module, head to{' '}
            <button onClick={() => navigate('/evaluation')}
              className="font-semibold underline underline-offset-2 hover:text-foreground transition-colors"
              style={{ color:'#2E4F4F' }}>
              Evaluation
            </button>{' '}
            to record yourself and measure improvement.
          </p>
        </div>

      </div>
    </Layout>
  );
};