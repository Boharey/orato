import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { DashboardCard, DASHBOARD_STYLES } from '../components/dashboard';
import { StreakCalendar } from '../components/StreakCalendar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Zap, Eye, Award, CalendarDays, CalendarRange, Brain, ArrowUp, ArrowDown } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Helper: sanitize and clamp values
const sanitizeData = (data, min, max) => {
  if (!Array.isArray(data)) return [];
  return data
    .filter(item => item && typeof item.value === 'number' && !isNaN(item.value))
    .map(item => ({
      ...item,
      value: Math.min(max, Math.max(min, item.value))
    }));
};

// Helper: group by daily / weekly / monthly (averaged)
const groupByPeriod = (data, period) => {
  if (!data || data.length === 0) return [];
  if (period === 'daily') return data;

  const groups = new Map();
  data.forEach(item => {
    const date = new Date(item.date);
    let key;
    if (period === 'weekly') {
      const day = date.getDay();
      const diff = (day === 0 ? 6 : day - 1);
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      key = monday.toISOString().slice(0, 10);
    } else {
      key = date.toISOString().slice(0, 7);
    }
    if (!groups.has(key)) groups.set(key, { total: 0, count: 0 });
    const group = groups.get(key);
    group.total += item.value;
    group.count += 1;
  });

  return Array.from(groups.entries())
    .map(([periodKey, { total, count }]) => ({
      date: periodKey,
      value: total / count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({ wpm: [], fillers: [], eye_gaze: [], combined: [], fillerFreq: {} });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('daily');

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/${user.id}`);
      const raw = response.data;
      setAnalytics({
        wpm: sanitizeData(raw.wpm, 0, 300),
        fillers: sanitizeData(raw.fillers, 0, 100),
        eye_gaze: sanitizeData(raw.eye_gaze, 0, 100),
        combined: sanitizeData(raw.combined, 0, 100),
        fillerFreq: raw.filler_frequencies || {}
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fillerChartData = useMemo(() => {
    if (!analytics.fillerFreq) return [];
    return Object.entries(analytics.fillerFreq)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [analytics.fillerFreq]);

  const calculateAverage = (data) => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.value, 0);
    return (sum / data.length).toFixed(1);
  };

  const getPeriodAverages = (data, currentDays = 30, prevDays = 30) => {
    if (!data || data.length === 0) return { current: null, previous: null };
    const now = new Date();
    const currentStart = new Date(now); currentStart.setDate(now.getDate() - currentDays);
    const prevStart = new Date(currentStart); prevStart.setDate(currentStart.getDate() - prevDays);

    const currentData = data.filter(d => new Date(d.date) >= currentStart);
    const prevData = data.filter(d => new Date(d.date) >= prevStart && new Date(d.date) < currentStart);

    const avg = arr => arr.length === 0 ? null : arr.reduce((s, d) => s + d.value, 0) / arr.length;
    return { current: avg(currentData), previous: avg(prevData) };
  };

  const getTrend = (metric, currentAvg, prevAvg) => {
    if (currentAvg === null || prevAvg === null || prevAvg === 0) return null;
    const pct = ((currentAvg - prevAvg) / prevAvg) * 100;
    // For fillers: lower is better → invert improvement direction
    const improved = metric === 'fillers' ? pct < 0 : pct > 0;
    return { pct: Math.abs(pct).toFixed(1), improved };
  };

  const TrendBadge = ({ trend }) => {
    if (!trend) return <span className="text-xs text-muted-foreground ml-1">—</span>;
    const { pct, improved } = trend;
    return improved ? (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600 bg-green-500/10 rounded-full px-1.5 py-0.5 ml-1">
        <ArrowUp className="w-3 h-3" />{pct}%
      </span>
    ) : (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500 bg-red-500/10 rounded-full px-1.5 py-0.5 ml-1">
        <ArrowDown className="w-3 h-3" />{pct}%
      </span>
    );
  };

  // --- Enhanced feedback generator (like Evaluation.jsx) ---
  const generateDetailedFeedback = (analytics) => {
    const avgWpm = parseFloat(calculateAverage(analytics.wpm));
    const avgFillers = parseFloat(calculateAverage(analytics.fillers));
    const avgEye = parseFloat(calculateAverage(analytics.eye_gaze));
    const avgCombined = parseFloat(calculateAverage(analytics.combined));

    const issues = [];
    const strengths = [];

    // Pace
    if (avgWpm > 175)
      issues.push({ priority: 2, icon: '⚡', title: 'Slow down', detail: `You average ${Math.round(avgWpm)} WPM — too fast. Aim for 120-160 WPM. Try recording at a deliberately slower pace.` });
    else if (avgWpm < 100)
      issues.push({ priority: 2, icon: '⏱️', title: 'Pick up the pace', detail: `You average ${Math.round(avgWpm)} WPM — too slow. Aim for 120-160 WPM.` });
    else if (avgWpm >= 120 && avgWpm <= 160)
      strengths.push({ icon: '✓', title: 'Great pace', detail: `${Math.round(avgWpm)} WPM — ideal for clarity and engagement.` });

    // Fillers
    if (avgFillers > 10)
      issues.push({ priority: 1, icon: '🗣️', title: 'Cut the fillers', detail: `You average ${avgFillers.toFixed(1)} filler words per session. Replace them with a deliberate 1‑second pause.` });
    else if (avgFillers > 5)
      issues.push({ priority: 2, icon: '🗣️', title: 'Reduce fillers', detail: `You average ${avgFillers.toFixed(1)} filler words. Good but room to improve.` });
    else
      strengths.push({ icon: '✓', title: 'Clean speech', detail: `Only ${avgFillers.toFixed(1)} filler words on average — excellent verbal discipline.` });

    // Eye contact
    if (avgEye < 40)
      issues.push({ priority: 1, icon: '👁️', title: 'Look at the camera', detail: `Only ${avgEye}% eye contact — this is the strongest signal interviewers notice. Place a sticky note next to your camera.` });
    else if (avgEye < 60)
      issues.push({ priority: 2, icon: '👁️', title: 'Improve eye contact', detail: `${avgEye}% eye contact. Aim for at least 70%.` });
    else if (avgEye >= 75)
      strengths.push({ icon: '✓', title: 'Strong eye contact', detail: `${avgEye}% — excellent. This builds trust.` });

    // Combined score (optional)
    if (avgCombined && avgCombined < 50)
      issues.push({ priority: 2, icon: '📊', title: 'Overall communication', detail: `Your combined score is ${avgCombined}. Focus on the areas above to improve.` });
    else if (avgCombined >= 80)
      strengths.push({ icon: '✓', title: 'Excellent overall', detail: `Combined score ${avgCombined} — you're interview‑ready.` });

    issues.sort((a, b) => a.priority - b.priority);
    return {
      topIssues: issues.slice(0, 3),
      strengths: strengths.slice(0, 3),
    };
  };

  const feedback = generateDetailedFeedback(analytics);

  const groupedWpm = useMemo(() => groupByPeriod(analytics.wpm, timeRange), [analytics.wpm, timeRange]);
  const groupedFillers = useMemo(() => groupByPeriod(analytics.fillers, timeRange), [analytics.fillers, timeRange]);
  const groupedEyeGaze = useMemo(() => groupByPeriod(analytics.eye_gaze, timeRange), [analytics.eye_gaze, timeRange]);
  const groupedCombined = useMemo(() => groupByPeriod(analytics.combined, timeRange), [analytics.combined, timeRange]);

  const trends = useMemo(() => {
    const wpmP = getPeriodAverages(analytics.wpm);
    const fillersP = getPeriodAverages(analytics.fillers);
    const eyeP = getPeriodAverages(analytics.eye_gaze);
    const combinedP = getPeriodAverages(analytics.combined);
    const now = new Date();
    const cutoff = new Date(now); cutoff.setDate(now.getDate() - 30);
    const prevCutoff = new Date(cutoff); prevCutoff.setDate(cutoff.getDate() - 30);
    const currentSessions = (analytics.wpm || []).filter(d => new Date(d.date) >= cutoff).length;
    const prevSessions = (analytics.wpm || []).filter(d => new Date(d.date) >= prevCutoff && new Date(d.date) < cutoff).length;
    const sessionsTrend = prevSessions === 0 ? null : {
      pct: Math.abs(((currentSessions - prevSessions) / prevSessions) * 100).toFixed(1),
      improved: currentSessions >= prevSessions
    };
    return {
      combined: getTrend('combined', combinedP.current, combinedP.previous),
      wpm: getTrend('wpm', wpmP.current, wpmP.previous),
      fillers: getTrend('fillers', fillersP.current, fillersP.previous),
      eye_gaze: getTrend('eye_gaze', eyeP.current, eyeP.previous),
      sessions: sessionsTrend,
    };
  }, [analytics]);

  const summaryCards = [
    { icon: Award, title: 'Avg Combined Score', value: calculateAverage(analytics.combined), color: 'bg-indigo-500/10 text-indigo-600', trend: trends.combined },
    { icon: TrendingUp, title: 'Average WPM', value: calculateAverage(analytics.wpm), color: 'bg-blue-500/10 text-blue-600', trend: trends.wpm },
    { icon: Zap, title: 'Avg Filler Count', value: calculateAverage(analytics.fillers), color: 'bg-amber-500/10 text-amber-600', trend: trends.fillers },
    { icon: Eye, title: 'Avg Eye Contact', value: `${calculateAverage(analytics.eye_gaze)}%`, color: 'bg-green-500/10 text-green-600', trend: trends.eye_gaze },
    { icon: Award, title: 'Total Sessions', value: analytics.wpm?.length || 0, color: 'bg-purple-500/10 text-purple-600', trend: trends.sessions },
  ];

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
      <style>{DASHBOARD_STYLES}</style>
      <div className="db-root px-4 sm:px-8 py-8 sm:py-12 max-w-[1600px] mx-auto" data-testid="dashboard-page">
        <div className="mb-12 db-h flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="db-serif text-4xl md:text-5xl font-light tracking-tight text-foreground mb-3">Dashboard</h1>
            <p className="text-muted-foreground text-base">Track your communication skills progress</p>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={() => setTimeRange('daily')} className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 ${timeRange === 'daily' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              <CalendarDays className="w-4 h-4" /> Daily
            </button>
            <button onClick={() => setTimeRange('weekly')} className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 ${timeRange === 'weekly' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              <CalendarRange className="w-4 h-4" /> Weekly
            </button>
            <button onClick={() => setTimeRange('monthly')} className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 ${timeRange === 'monthly' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              <CalendarRange className="w-4 h-4" /> Monthly
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-7 mb-12">
          {summaryCards.map((card, index) => (
            <div key={index} className="flex flex-col">
              <DashboardCard
                icon={card.icon}
                title={card.title}
                value={card.value}
                color={card.color}
                index={index}
                testId={`summary-card-${index}`}
              />
              <div className="flex items-center gap-1 px-1 pt-1.5 text-xs text-muted-foreground">
                <span>vs prev 30d</span>
                <TrendBadge trend={card.trend} />
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Coach Feedback Card */}
        <div className="mb-12 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="db-serif text-xl font-semibold text-foreground">Coach Feedback</h3>
          </div>

          {feedback.topIssues.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Focus on these</p>
              {feedback.topIssues.map((issue, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-4 rounded-xl"
                  style={{
                    background: i === 0 ? 'rgba(239,68,68,0.06)' : i === 1 ? 'rgba(245,158,11,0.06)' : 'rgba(46,79,79,0.04)',
                    border: `1px solid ${i === 0 ? 'rgba(239,68,68,0.15)' : i === 1 ? 'rgba(245,158,11,0.15)' : 'rgba(46,79,79,0.1)'}`
                  }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{issue.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">{issue.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{issue.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {feedback.strengths.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">What went well</p>
              {feedback.strengths.map((s, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30">
                  <span className="text-green-500 text-sm font-bold flex-shrink-0">{s.icon}</span>
                  <div>
                    <span className="text-xs font-semibold text-foreground">{s.title} </span>
                    <span className="text-xs text-muted-foreground">{s.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feedback.topIssues.length === 0
                ? "Outstanding progress! Keep up the great work — you're already performing at a high level."
                : `Work on ${feedback.topIssues.map(i => i.title.toLowerCase()).join(', ')} and your scores will improve significantly.`}
            </p>
          </div>
        </div>


        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Combined Score Trend */}
          <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Combined Score Trend</h3>
            {groupedCombined.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={groupedCombined}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis dataKey="date" stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B706B" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E4DE', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No combined score data yet.</div>
            )}
          </div>

          {/* WPM Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Words Per Minute Trend</h3>
            {groupedWpm.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={groupedWpm}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis dataKey="date" stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E4DE', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="#2E4F4F" strokeWidth={2} dot={{ fill: '#2E4F4F' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data yet.</div>
            )}
          </div>

          {/* Streak Calendar */}
          <div className="bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200">
            <StreakCalendar />
          </div>

          {/* Filler Count Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Filler Words Trend</h3>
            {groupedFillers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupedFillers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis dataKey="date" stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E4DE', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#FF6B35" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data yet.</div>
            )}
          </div>

          {/* Filler Words Distribution */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 md:p-8">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Most Used Fillers</h3>
            {fillerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={fillerChartData} margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis type="number" stroke="#6B706B" />
                  <YAxis dataKey="name" type="category" stroke="#6B706B" width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E4DE', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="#FF6B35" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No filler data yet.
              </div>
            )}
          </div>

          {/* Eye Gaze Chart */}
          <div className="bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Eye Contact %</h3>
            {groupedEyeGaze.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={groupedEyeGaze}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis dataKey="date" stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B706B" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E4DE', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="#2E4F4F" strokeWidth={2} dot={{ fill: '#2E4F4F' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data yet.</div>
            )}
          </div>

          
        </div>
      </div>
    </Layout>
  );
};