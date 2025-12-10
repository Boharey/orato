import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { ArrowRight, TrendingUp, Zap, Eye, Mic, Target, Calendar } from 'lucide-react';

export const Landing = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Pace & Rhythm Training',
      description: 'Master optimal speaking pace with real-time WPM tracking and rhythm analysis.',
    },
    {
      icon: Zap,
      title: 'Filler Reduction',
      description: 'Eliminate "um", "uh", and other filler words to speak with confidence and clarity.',
    },
    {
      icon: Eye,
      title: 'Eye Contact & Presence',
      description: 'Build commanding presence with eye contact tracking and engagement metrics.',
    },
    {
      icon: Mic,
      title: 'Pronunciation & Articulation',
      description: 'Speak with precision through guided pronunciation exercises and feedback.',
    },
    {
      icon: Target,
      title: 'AI-Powered Evaluation',
      description: 'Get instant feedback on your speaking performance with detailed analytics.',
    },
    {
      icon: Calendar,
      title: 'Streak Tracking',
      description: 'Stay motivated with daily practice streaks and progress visualization.',
    },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-accent font-bold text-sm uppercase tracking-widest" data-testid="hero-overline">
                  Communication Skills Platform
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light tracking-tight text-foreground" data-testid="hero-title">
                  Speak with
                  <span className="block font-black mt-2">Confidence & Clarity</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl" data-testid="hero-description">
                  Transform your communication skills with AI-powered training. Practice, evaluate, and improve your speaking abilities with real-time feedback and personalized insights.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button data-testid="hero-get-started-btn" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button data-testid="hero-login-btn" size="lg" variant="outline" className="px-8">
                    Login
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1646369505567-3a9cbb052342?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Confident speaker addressing audience"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <p className="text-accent font-bold text-sm uppercase tracking-widest">Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight">
              Everything You Need to
              <span className="block font-black mt-2">Master Communication</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  data-testid={`feature-card-${index}`}
                  className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif font-medium mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight">
            Ready to Transform Your
            <span className="block font-black mt-2 text-accent">Speaking Skills?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of professionals and students who are improving their communication skills every day.
          </p>
          <Link to="/register">
            <Button data-testid="cta-get-started-btn" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-12">
              Start Training Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-serif font-light tracking-tight text-primary">ORATO</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ORATO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};