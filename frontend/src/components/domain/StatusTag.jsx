import {
  AlertTriangle,
  Ban,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Clock,
  Hourglass,
  Navigation,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from '@/components/ui/Badge';

const STATUS_STYLE = {
  PENDING: { tone: 'green', icon: BellRing },
  ACCEPTED: { tone: 'yellow', icon: CheckCircle2 },
  ON_THE_WAY: { tone: 'yellow', icon: Navigation },
  IN_PROGRESS: { tone: 'yellow', icon: Wrench },
  AWAITING_CONFIRMATION: { tone: 'yellow', icon: Hourglass },
  COMPLETED: { tone: 'blue', icon: CheckCheck },
  AUTO_CLOSED: { tone: 'blue', icon: CheckCheck },
  DECLINED: { tone: 'red', icon: XCircle },
  EXPIRED: { tone: 'red', icon: Clock },
  CANCELLED: { tone: 'red', icon: Ban },
  DISPUTED: { tone: 'red', icon: AlertTriangle },
};

export default function StatusTag({ status, size = 'md', className }) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status] ?? { tone: 'gray' };
  return (
    <Badge tone={style.tone} icon={style.icon} size={size} className={className}>
      {t(`status.${status}`, { defaultValue: status })}
    </Badge>
  );
}
