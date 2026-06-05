import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export function Pagination({ links }: PaginationProps) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 py-4">
            {links.map((link, index) => {
                const isPrevious = link.label.includes('Previous') || link.label.includes('&laquo;');
                const isNext = link.label.includes('Next') || link.label.includes('&raquo;');

                return (
                    <Button
                        key={index}
                        asChild
                        variant={link.active ? 'default' : 'outline'}
                        size={isPrevious || isNext ? 'default' : 'icon'}
                        className={!link.url ? 'pointer-events-none opacity-50' : ''}
                        disabled={!link.url}
                    >
                        {link.url ? (
                            <Link href={link.url} preserveScroll>
                                {isPrevious ? (
                                    <div className="flex items-center">
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        <span>Précédent</span>
                                    </div>
                                ) : isNext ? (
                                    <div className="flex items-center">
                                        <span>Suivant</span>
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </div>
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Link>
                        ) : (
                            <span>
                                {isPrevious ? (
                                    <div className="flex items-center">
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        <span>Précédent</span>
                                    </div>
                                ) : isNext ? (
                                    <div className="flex items-center">
                                        <span>Suivant</span>
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </div>
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </span>
                        )}
                    </Button>
                );
            })}
        </div>
    );
}
