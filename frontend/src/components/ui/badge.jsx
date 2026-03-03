import * as React from 'react';
import { cn } from '@/lib/utils';

function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-primary/15 text-primary border border-primary/30',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-400/20 text-amber-700 dark:text-amber-200 border border-amber-500/30',
    danger: 'bg-destructive/10 text-destructive border border-destructive/30',
    muted: 'bg-muted text-muted-foreground border border-border/60',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
