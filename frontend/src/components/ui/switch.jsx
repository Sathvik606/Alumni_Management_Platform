import * as React from 'react';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full border border-border/70 bg-muted transition',
        checked && 'bg-primary/80',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block size-5 translate-x-0.5 rounded-full bg-background shadow-sm transition',
          checked && 'translate-x-[22px] bg-white',
        )}
      />
    </button>
  );
});
Switch.displayName = 'Switch';

export { Switch };
