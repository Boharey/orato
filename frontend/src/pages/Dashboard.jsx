import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
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
      <div className="p-8 max-w-[1600px] mx-auto" data-testid="dashboard-page">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Track your communication skills progress</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                data-testid={`summary-card-${index}`}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WPM Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6" data-testid="wpm-chart">
            <h3 className="text-lg font-serif font-medium mb-6">Words Per Minute Trend</h3>
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
          <div className="bg-card border border-border rounded-lg p-6">
            <StreakCalendar />
          </div>

          {/* Filler Count Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6" data-testid="filler-chart">
            <h3 className="text-lg font-serif font-medium mb-6">Filler Words Trend</h3>
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
          <div className="bg-card border border-border rounded-lg p-6" data-testid="eye-gaze-chart">
            <h3 className="text-lg font-serif font-medium mb-6">Eye Contact %</h3>
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