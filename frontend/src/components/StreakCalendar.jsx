import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const StreakCalendar = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    dates: [],
    current_streak: 0,
    longest_streak: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user]);

  const fetchStreak = async () => {
    try {
      const response = await axios.get(`${API_URL}/streak/${user.id}`);
      setStreakData(response.data);
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const generateCalendarData = () => {
    const today = new Date();
    const weeks = [];
    const activeDates = new Set(streakData.dates);

    // Generate last 12 weeks
    for (let weekOffset = 11; weekOffset >= 0; weekOffset--) {
      const week = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (weekOffset * 7 + (6 - day)));
        const dateStr = date.toISOString().split('T')[0];
        week.push({
          date: dateStr,
          active: activeDates.has(dateStr),
        });
      }
      weeks.push(week);
    }

    return weeks;
  };

  const weeks = generateCalendarData();

  return (
    <div className="space-y-4" data-testid="streak-calendar">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-medium">Practice Streak</h3>
        <div className="flex gap-5">
          <div className="text-right">
            <p
              className="text-2xl font-bold text-accent"
              data-testid="current-streak"
            >
              {streakData.current_streak}
            </p>
            <p className="text-xs text-muted-foreground">current</p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-bold text-primary"
              data-testid="longest-streak"
            >
              {streakData.longest_streak || streakData.current_streak}
            </p>
            <p className="text-xs text-muted-foreground">longest</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  data-testid={`calendar-day-${day.date}`}
                  className={`w-3 h-3 rounded-sm ${
                    day.active
                      ? 'bg-primary'
                      : 'bg-muted border border-border'
                  }`}
                  title={day.date}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-muted border border-border rounded-sm"></div>
          <span>No activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-sm"></div>
          <span>Practiced</span>
        </div>
      </div>
    </div>
  );
};