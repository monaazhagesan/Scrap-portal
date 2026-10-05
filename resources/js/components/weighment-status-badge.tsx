import { Badge } from '@/components/ui/badge';
import type { WeighmentStatus } from '@/types';

const variants = {
    open: { variant: 'outline', label: 'Awaiting 2nd weight' },
    completed: { variant: 'secondary', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
} as const;

export default function WeighmentStatusBadge({
    status,
}: {
    status: WeighmentStatus;
}) {
    const { variant, label } = variants[status];

    return <Badge variant={variant}>{label}</Badge>;
}
