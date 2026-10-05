const kgFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
});

const moneyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

export function formatKg(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return `${kgFormatter.format(Number(value))} kg`;
}

export function formatMoney(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return moneyFormatter.format(Number(value));
}

/**
 * Party balance as "₹1,25,000.00 Dr" (they owe us) / "₹3,58,400.00 Cr" (we owe them).
 */
export function formatBalance(
    value: number | string | null | undefined,
): string {
    const amount = Number(value ?? 0);

    if (Math.abs(amount) < 0.005) {
        return formatMoney(0);
    }

    return `${formatMoney(Math.abs(amount))} ${amount > 0 ? 'Dr' : 'Cr'}`;
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}
