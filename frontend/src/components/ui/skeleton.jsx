import { cn } from '@/lib/utils';

function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />;
}

export { Skeleton };
