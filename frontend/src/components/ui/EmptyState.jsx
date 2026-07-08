import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — reusable empty state component.
 * Minimal icon, title, description, optional CTA.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  ctaLabel,
  ctaTo,
  onCta,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-dashed',
        'border-white/10 bg-white/[0.02]',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {(ctaLabel && ctaTo) && (
        <Button asChild className="mt-5" size="sm">
          <Link to={ctaTo}>{ctaLabel}</Link>
        </Button>
      )}
      {(ctaLabel && onCta) && (
        <Button onClick={onCta} className="mt-5" size="sm">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
