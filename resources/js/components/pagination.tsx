import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

export default function Pagination<T>({ page }: { page: Paginated<T> }) {
    if (page.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
                Showing {page.from}–{page.to} of {page.total}
            </span>
            <nav className="flex flex-wrap gap-1" aria-label="Pagination">
                {page.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                'rounded-md border px-3 py-1',
                                link.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={index}
                            className="rounded-md border px-3 py-1 text-muted-foreground opacity-50"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </nav>
        </div>
    );
}
