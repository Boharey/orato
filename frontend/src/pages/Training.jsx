import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const Training = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL}/training/modules`);
      setModules(response.data.modules);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto" data-testid="training-page">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2">Training Modules</h1>
          <p className="text-muted-foreground">Master communication skills with structured lessons</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <div
              key={module.id}
              data-testid={`training-module-${index}`}
              onClick={() => navigate(`/training/${module.id}`)}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-serif font-medium group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-muted-foreground leading-relaxed">{module.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};