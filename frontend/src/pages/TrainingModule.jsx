import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { ArrowLeft, PlayCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const TrainingModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModule();
  }, [moduleId]);

  const fetchModule = async () => {
    try {
      const response = await axios.get(`${API_URL}/training/modules`);
      const foundModule = response.data.modules.find(m => m.id === moduleId);
      setModule(foundModule);
    } catch (error) {
      console.error('Error fetching module:', error);
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

  if (!module) {
    return (
      <Layout>
        <div className="p-8">
          <p className="text-muted-foreground">Module not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto" data-testid="training-module-page">
        <Button
          data-testid="back-to-training-btn"
          onClick={() => navigate('/training')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Training
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2" data-testid="module-title">
            {module.title}
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="module-description">{module.description}</p>
        </div>

        <div className="space-y-12">
          {module.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6" data-testid={`module-section-${sectionIndex}`}>
              <div className="bg-card border border-border rounded-lg p-8 space-y-6">
                <h2 className="text-2xl font-serif font-medium" data-testid={`section-heading-${sectionIndex}`}>
                  {section.heading}
                </h2>

                <div className="space-y-3">
                  {section.points.map((point, pointIndex) => (
                    <div key={pointIndex} className="flex items-start" data-testid={`section-point-${sectionIndex}-${pointIndex}`}>
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                        {pointIndex + 1}
                      </span>
                      <p className="text-foreground leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>

                {section.video && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <PlayCircle className="w-5 h-5 text-accent" />
                      <h3 className="font-medium">Video Lesson</h3>
                    </div>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        data-testid={`section-video-${sectionIndex}`}
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
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <h3 className="text-lg font-serif font-medium mb-2">Ready to practice?</h3>
          <p className="text-muted-foreground mb-4">
            Head to the Evaluation page to record yourself and get instant feedback on your progress.
          </p>
          <Button
            data-testid="go-to-evaluation-btn"
            onClick={() => navigate('/evaluation')}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Go to Evaluation
          </Button>
        </div>
      </div>
    </Layout>
  );
};