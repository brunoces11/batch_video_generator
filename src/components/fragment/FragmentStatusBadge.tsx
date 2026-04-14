import {
  Clock,
  Upload,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { STATUS_COLORS } from '../../lib/constants';
import type { FragmentStatus } from '../../lib/types';

const icons: Record<FragmentStatus, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  submitting: <Upload className="h-3 w-3" />,
  processing: <Loader2 className="h-3 w-3 animate-spin" />,
  polling: <Search className="h-3 w-3 animate-pulse" />,
  completed: <CheckCircle2 className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
  timed_out: <AlertTriangle className="h-3 w-3" />,
  cancelled: <Ban className="h-3 w-3" />,
};

const labels: Record<FragmentStatus, string> = {
  pending: 'Pending',
  submitting: 'Submitting',
  processing: 'Processing',
  polling: 'Polling',
  completed: 'Completed',
  failed: 'Failed',
  timed_out: 'Timed Out',
  cancelled: 'Cancelled',
};

interface Props {
  status: FragmentStatus;
}

export function FragmentStatusBadge({ status }: Props) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <Badge className={`${colors.bg} ${colors.text}`} dot dotColor={colors.dot}>
      <span className="flex items-center gap-1">
        {icons[status]}
        {labels[status]}
      </span>
    </Badge>
  );
}
