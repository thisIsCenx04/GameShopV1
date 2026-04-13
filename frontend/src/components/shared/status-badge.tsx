import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  Active: 'bg-success/10 text-success border-success/30',
  Completed: 'bg-success/10 text-success border-success/30',
  Approved: 'bg-success/10 text-success border-success/30',
  Resolved: 'bg-success/10 text-success border-success/30',
  Paid: 'bg-primary/10 text-primary border-primary/30',
  Delivered: 'bg-primary/10 text-primary border-primary/30',
  Pending: 'bg-warning/10 text-warning border-warning/30',
  Open: 'bg-warning/10 text-warning border-warning/30',
  Investigating: 'bg-neon-purple/10 text-neon-purple border-neon-purple/30',
  Disputed: 'bg-destructive/10 text-destructive border-destructive/30',
  Rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  Cancelled: 'bg-muted text-muted-foreground border-border',
  Hidden: 'bg-muted text-muted-foreground border-border',
  Draft: 'bg-muted text-muted-foreground border-border',
  Sold: 'bg-secondary text-secondary-foreground border-border',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', statusStyles[status] || '')}>
      {status}
    </Badge>
  );
}
