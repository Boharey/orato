import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { DashboardCard, DASHBOARD_STYLES } from '../components/dashboard';
import { StreakCalendar } from '../components/StreakCalendar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Zap, Eye, Award } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({ wpm: [], fillers: [], eye_gaze: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/${user.id}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = (data) => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.value, 0);
    return (sum / data.length).toFixed(1);
  };
  const generateFeedback = (analytics) => {
  const avgWpm = calculateAverage(analytics.wpm);
  const avgFillers = calculateAverage(analytics.fillers);
  const avgEye = calculateAverage(analytics.eye_gaze);

  const feedback = [];

  // -------------------
  // SPEED / RHYTHM
  // -------------------
  if (avgWpm < 100) {
    feedback.push({
      type: "pace",
      message: "Your speaking pace is quite slow. Focus on rhythm and flow.",
      action: "Practice speaking fluency exercises."
    });
  } else if (avgWpm > 170) {
    feedback.push({
      type: "pace",
      message: "You're speaking too fast. Slow down for clarity.",
      action: "Practice controlled breathing and pauses."
    });
  }

  // -------------------
  // FILLERS
  // -------------------
  if (avgFillers > 5) {
    feedback.push({
      type: "fillers",
      message: "You are using too many filler words.",
      action: "Do targeted filler reduction drills."
    });
  }

  // -------------------
  // EYE CONTACT
  // -------------------
  if (avgEye < 60) {
    feedback.push({
      type: "eye",
      message: "Your eye contact is low.",
      action: "Practice speaking while maintaining camera focus."
    });
  }

    return feedback;
  };



  const summaryCards = [
    {
      icon: TrendingUp,
      title: 'Average WPM',
      value: calculateAverage(analytics.wpm),
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: Zap,
      title: 'Avg Filler Count',
      value: calculateAverage(analytics.fillers),
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: Eye,
      title: 'Avg Eye Contact',
      value: `${calculateAverage(analytics.eye_gaze)}%`,
      color: 'bg-green-500/10 text-green-600',
    },
    {
      icon: Award,
      title: 'Total Sessions',
      value: analytics.wpm?.length || 0,
      color: 'bg-purple-500/10 text-purple-600',
    },
  ];


  const feedbackList = generateFeedback(analytics);
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
        <div className="mb-12 db-h">
          <h1 className="db-serif text-4xl md:text-5xl font-light tracking-tight text-foreground mb-3">Dashboard</h1>
          <p className="text-muted-foreground text-base">Track your communication skills progress</p>
        </div>

        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7 mb-12">
          {summaryCards.map((card, index) => (
            <DashboardCard
              key={index}
              icon={card.icon}
              title={card.title}
              value={card.value}
              color={card.color}
              index={index}
              testId={`summary-card-${index}`}
            />
          ))}
        </div>

          {/* Feedback Section */}
          {feedbackList.length > 0 && (
            <div className="mb-12 bg-card border border-border rounded-lg p-6 md:p-8 db-f1">
              <h3 className="db-serif text-xl font-semibold text-foreground mb-6">
                AI Coaching Feedback
              </h3>

              <div className="space-y-4">
                {feedbackList.map((item, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-lg border border-border/50 bg-muted/40 hover:bg-muted/60 transition-colors duration-200"
                  >
                    <p className="font-semibold text-foreground mb-2">{item.message}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* WPM Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200 db-c1" data-testid="wpm-chart">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Words Per Minute Trend</h3>
            {analytics.wpm && analytics.wpm.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.wpm}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis dataKey="date" stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E4DE',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2E4F4F" strokeWidth={2} dot={{ fill: '#2E4F4F' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data yet. Complete an evaluation to see your progress.
              </div>
            )}
          </div>

          {/* Streak Calendar */}
          <div className="bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200 db-c2">
            <StreakCalendar />
          </div>

          {/* Filler Count Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200 db-c3" data-testid="filler-chart">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Filler Words Trend</h3>
            {analytics.fillers && analytics.fillers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.fillers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis dataKey="date" stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E4DE',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#FF6B35" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data yet. Complete an evaluation to see your progress.
              </div>
            )}
          </div>

          {/* Eye Gaze Chart */}
          <div className="bg-card border border-border rounded-lg p-6 md:p-8 hover:border-border/80 transition-all duration-200 db-c4" data-testid="eye-gaze-chart">
            <h3 className="db-serif text-xl font-semibold text-foreground mb-6">Eye Contact %</h3>
            {analytics.eye_gaze && analytics.eye_gaze.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.eye_gaze}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DE" />
                  <XAxis dataKey="date" stroke="#6B706B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B706B" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E4DE',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2E4F4F" strokeWidth={2} dot={{ fill: '#2E4F4F' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};