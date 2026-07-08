import { cn } from '@/lib/utils';

/**
 * PageHeader — reusable dashboard page header.
 * Shows eyebrow label, h1 title, subtitle, and optional right slot.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 mb-8', className)}>
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-xl">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
