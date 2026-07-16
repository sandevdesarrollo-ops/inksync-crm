import React from 'react';
import { cn } from '@/lib/utils';

// Subtle 4-segment progress indicator: "Step x of 4" + current step label + thin gold track.
export default function Stepper({ labels, current, stepText }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{stepText}</span>
        <span className="truncate text-sm font-medium">{labels[current - 1]}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden="true">
        {labels.map((label, i) => (
          <div
            key={label}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < current ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}
