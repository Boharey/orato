import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TrainingTipBar = () => {
  const navigate = useNavigate();

  return (
    <div
      className="mt-2 flex items-center gap-4 px-6 py-4 rounded-2xl"
      style={{ background: '#F6F8F6', border: '1px solid #E8EAE8' }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: '#FF6B35' }}
      />
      <p className="text-sm text-muted-foreground leading-relaxed">
        After practising a module, head to{' '}
        <button
          onClick={() => navigate('/evaluation')}
          className="font-semibold underline underline-offset-2 hover:text-foreground transition-colors"
          style={{ color: '#2E4F4F' }}
        >
          Evaluation
        </button>{' '}
        to record yourself and measure improvement.
      </p>
    </div>
  );
};
