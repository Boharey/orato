import React from 'react';

export const DashboardCard = ({ icon: Icon, title, value, color, index, testId }) => {
  const animationClasses = ['db-c1', 'db-c2', 'db-c3', 'db-c4'][index] || 'db-c1';

  return (
    <div
      key={index}
      data-testid={testId || `summary-card-${index}`}
      className={`db-card ${animationClasses}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`db-icon-wrapper ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold mb-2 text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
    </div>
  );
};
