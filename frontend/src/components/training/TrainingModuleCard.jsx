import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const TrainingModuleCard = ({ meta, module, index, onNavigate }) => {
  if (!module) return null;

  const Icon = meta.icon;
  const isTeal = meta.accent === '#2E4F4F';
  const count = module.sections?.length || 0;
  const desc = module.description.length > 100
    ? module.description.slice(0, 100).trimEnd() + '…'
    : module.description;

  const animationClasses = ['tr-c1', 'tr-c2', 'tr-c3', 'tr-c4'][index] || 'tr-c1';

  return (
    <div
      className={`tr-card ${animationClasses}`}
      data-t={isTeal ? 'teal' : 'orange'}
      data-testid={`training-module-${index}`}
      onClick={onNavigate}
    >
      {/* Accent bar */}
      <div className="tr-bar" style={{ background: meta.accent }} />

      {/* Top row - Tag and Arrow */}
      <div className="flex items-start justify-between mb-4">
        <span className="tr-tag" style={{ background: `${meta.accent}12`, color: meta.accent }}>
          {meta.tag}
        </span>
        <div className="tr-arrow" style={{ background: `${meta.accent}0e` }}>
          <ArrowUpRight className="w-4 h-4" style={{ color: meta.accent }} />
        </div>
      </div>

      {/* Module number */}
      <p className="tr-num" style={{ color: meta.accent }}>
        {meta.label}
      </p>

      {/* Icon and Title Side by Side */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.accent}0e` }}
        >
          <Icon className="w-6 h-6" style={{ color: meta.accent }} />
        </div>
        <div className="flex-1">
          <h3 className="tr-serif text-xl md:text-[1.25rem] font-bold text-foreground leading-snug">
            {module.title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
        {desc}
      </p>

      {/* Footer */}
      <div className="tr-divider" />
      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-muted-foreground">
          {count} technique{count !== 1 ? 's' : ''}
        </span>
        <span className="text-xs font-semibold" style={{ color: meta.accent }}>
          Explore →
        </span>
      </div>
    </div>
  );
};
