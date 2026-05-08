import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { TrainingHeader, TrainingModuleCard, TrainingTipBar, TRAINING_STYLES } from '../components/training';
import axios from 'axios';
import { TrendingUp, Zap, Mic, Eye } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MODULE_META = [
  { id: 'pace-rhythm',                icon: TrendingUp, label: '01', accent: '#2E4F4F', tag: 'Delivery'     },
  { id: 'filler-word-reduction',      icon: Zap,        label: '02', accent: '#FF6B35', tag: 'Clarity'      },
  { id: 'pronunciation-articulation', icon: Mic,        label: '03', accent: '#2E4F4F', tag: 'Articulation' },
  { id: 'eye-contact-presence',       icon: Eye,        label: '04', accent: '#FF6B35', tag: 'Presence'     },
];

export const Training = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/training/modules`);
      setModules(data.modules);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{TRAINING_STYLES}</style>
      <div className="tr-root px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto" data-testid="training-page">
        <TrainingHeader />

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {MODULE_META.map((meta, i) => {
            const module = modules.find(m => m.id === meta.id);
            return (
              <TrainingModuleCard
                key={meta.id}
                meta={meta}
                module={module}
                index={i}
                onNavigate={() => navigate(`/training/${meta.id}`)}
              />
            );
          })}
        </div>

        <TrainingTipBar />
      </div>
    </Layout>
  );
};