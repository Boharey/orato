import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Clock, ArrowRight } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'behavioral-leadership',
    title: 'Behavioral Interview: Leadership Under Pressure',
    difficulty: 'Intermediate',
    duration: '2 min read',
    description: 'Answer a leadership question using a clear STAR structure.',
    accent: '#2E4F4F',
  },
  {
    id: 'technical-explain-project',
    title: 'Technical Interview: Explain Your Project',
    difficulty: 'Intermediate',
    duration: '2 min read',
    description: 'Present a technical project clearly without overwhelming the interviewer.',
    accent: '#FF6B35',
  },
  {
    id: 'strength-question',
    title: 'Interview: "What is your greatest strength?"',
    difficulty: 'Beginner',
    duration: '1 min read',
    description: 'Answer confidently without sounding arrogant.',
    accent: '#2E4F4F',
  },
  {
    id: 'weakness-question',
    title: 'Interview: "What is your biggest weakness?"',
    difficulty: 'Intermediate',
    duration: '1 min read',
    description: 'Show self-awareness and growth instead of self-destruction.',
    accent: '#FF6B35',
  },
  {
    id: 'group-discussion-opening',
    title: 'Group Discussion: Strong Opening Statement',
    difficulty: 'Advanced',
    duration: '1 min read',
    description: 'Start a discussion confidently and establish leadership presence.',
    accent: '#2E4F4F',
  },
  {
    id: 'college-presentation-opening',
    title: 'College Presentation: Confident Opening',
    difficulty: 'Beginner',
    duration: '1 min read',
    description: 'Start an academic presentation with authority and clarity.',
    accent: '#FF6B35',
  },
];

export const ScenarioList = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-1">Practice Scenarios</h1>
          <p className="text-muted-foreground text-sm">
            Ready‑made scripts for common situations. Click a card to see theory, guidance, and a full script.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              onClick={() => navigate(`/scenarios/${scenario.id}`)}
              className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              style={{ borderLeft: `4px solid ${scenario.accent}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                  {scenario.difficulty}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {scenario.duration}
                </span>
              </div>
              <h3 className="text-lg font-serif font-medium mb-2 group-hover:text-primary transition-colors">
                {scenario.title}
              </h3>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
              <div className="flex justify-end mt-4">
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};