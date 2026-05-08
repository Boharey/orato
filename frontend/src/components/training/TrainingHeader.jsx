import React from 'react';

export const TrainingHeader = () => {
  return (
    <div className="mb-16 tr-h">
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#FF6B35' }}>
        Training
      </p>
      <h1 className="tr-serif text-4xl md:text-5xl leading-tight font-light tracking-tight text-foreground mb-6">
        Communication <span className="font-black">Modules</span>
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
        Four skill areas. Work through each module's techniques at your own pace.
      </p>
    </div>
  );
};
