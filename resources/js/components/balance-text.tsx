import { formatBalance } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Receivable (Dr) in green, payable (Cr) in red.
 */
export default function BalanceText({
    value,
    className,
}: {
    value: number;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'tabular-nums',
                value > 0.005 && 'text-emerald-600 dark:text-emerald-400',
                value < -0.005 && 'text-destructive',
                Math.abs(value) <= 0.005 && 'text-muted-foreground',
                className,
            )}
        >
            {formatBalance(value)}
        </span>
    );
}
