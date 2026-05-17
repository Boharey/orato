import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { ArrowLeft, BookOpen, CheckCircle, Lightbulb, FileText } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios'; // <-- shared data

export const ScenarioDetail = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const scenario = SCENARIOS.find(s => s.id === scenarioId);

  if (!scenario) {
    return (
      <Layout>
        <div className="p-8">
          <Button variant="ghost" onClick={() => navigate('/scenarios')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scenarios
          </Button>
          <p className="text-muted-foreground">Scenario not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/scenarios')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scenarios
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2">
            {scenario.title}
          </h1>
        </div>

        {/* Theory */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-medium">Theory & Context</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{scenario.theory}</p>
        </div>

        {/* Approach */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-serif font-medium">How to Approach It</h2>
          </div>
          <ul className="space-y-3">
            {scenario.approach.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guidance */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-serif font-medium">Key Tips</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            {scenario.guidance.map((tip, i) => (
              <li key={i} className="text-sm">{tip}</li>
            ))}
          </ul>
        </div>

        {/* Script */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-medium">Full Script</h2>
          </div>
          <div className="p-4 bg-muted/40 border border-border rounded-lg text-sm leading-relaxed whitespace-pre-line">
            {scenario.script}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() =>
            navigate('/evaluation', {
              state: { script: scenario.script, title: scenario.title },
            })
          }
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ background: '#2E4F4F' }}
        >
          Use This Script in Evaluation
        </Button>
      </div>
    </Layout>
  );
};