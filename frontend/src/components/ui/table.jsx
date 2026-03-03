import * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, ...props }) {
  return <table className={cn('w-full border-collapse text-left text-sm', className)} {...props} />;
}

function TableHeader({ className, ...props }) {
  return <thead className={cn('text-xs uppercase tracking-wide text-muted-foreground', className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={cn('divide-y divide-border/70', className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return <tr className={cn('transition hover:bg-muted/40', className)} {...props} />;
}

function TableHead({ className, ...props }) {
  return <th className={cn('px-4 py-3.5 text-[11px] font-semibold text-muted-foreground', className)} {...props} />;
}

function TableCell({ className, ...props }) {
  return <td className={cn('px-4 py-4 text-sm text-foreground', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
