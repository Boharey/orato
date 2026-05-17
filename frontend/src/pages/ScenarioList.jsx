import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Clock, ArrowRight, Search, X } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios'; // <-- shared data

const CATEGORIES = ['All', 'Interview', 'Presentation', 'Group Discussion', 'Communication'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const DIFFICULTY_COLOR = {
  Beginner:     { bg: 'rgba(34,197,94,0.10)',  text: '#16a34a' },
  Intermediate: { bg: 'rgba(245,158,11,0.10)', text: '#d97706' },
  Advanced:     { bg: 'rgba(239,68,68,0.10)',  text: '#dc2626' },
};

export const ScenarioList = () => {
  const navigate = useNavigate();
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return SCENARIOS.filter(s => {
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      const matchCat  = category   === 'All' || s.category   === category;
      const matchDiff = difficulty === 'All' || s.difficulty === difficulty;
      return matchSearch && matchCat && matchDiff;
    });
  }, [search, category, difficulty]);

  const clearSearch = () => setSearch('');

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-1">
            Practice Scenarios
          </h1>
          <p className="text-muted-foreground text-sm">
            Ready-made scripts for common situations. Click a card to see theory, guidance, and a full script.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 mb-8">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search scenarios…"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter pills row */}
          <div className="flex flex-wrap gap-4">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                  style={
                    category === c
                      ? { background: '#2E4F4F', color: '#fff', borderColor: '#2E4F4F' }
                      : { background: 'transparent', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px bg-border self-stretch hidden sm:block" />

            {/* Difficulty filter */}
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                  style={
                    difficulty === d
                      ? { background: '#FF6B35', color: '#fff', borderColor: '#FF6B35' }
                      : { background: 'transparent', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result count */}
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} scenario{filtered.length !== 1 ? 's' : ''} found
          {search && <> for "<span className="font-medium text-foreground">{search}</span>"</>}
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((scenario) => {
              const dc = DIFFICULTY_COLOR[scenario.difficulty];
              return (
                <div
                  key={scenario.id}
                  onClick={() => navigate(`/scenarios/${scenario.id}`)}
                  className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                  style={{ borderLeft: `4px solid ${scenario.accent}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: dc.bg, color: dc.text }}
                    >
                      {scenario.difficulty}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {scenario.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {scenario.duration}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-serif font-medium mb-2 group-hover:text-primary transition-colors leading-snug flex-1">
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="flex justify-end mt-4">
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm font-medium mb-1">No scenarios found</p>
            <p className="text-xs">Try a different search term or clear your filters.</p>
            <button
              onClick={() => { setSearch(''); setCategory('All'); setDifficulty('All'); }}
              className="mt-4 text-xs text-primary underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};