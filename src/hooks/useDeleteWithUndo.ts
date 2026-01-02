import { useState, useRef } from 'react';
import { toast } from 'sonner';

export function useDeleteWithUndo(
    onActualDelete: (id: string) => void
) {
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
    const timeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const handleDelete = (id: string, description: string = "Transaction") => {
        // 1. Mark as pending visually
        setPendingDeletes(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });

        // 2. Show Undo Snackbar
        toast.success(`${description} deleted`, {
            description: "You have 3 seconds to undo this action.",
            duration: 3000,
            action: {
                label: "Undo",
                onClick: () => {
                    // Cancel deletion
                    if (timeouts.current[id]) {
                        clearTimeout(timeouts.current[id]);
                        delete timeouts.current[id];
                    }
                    setPendingDeletes(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                }
            },
            onAutoClose: () => {
                // Actual delete call
                onActualDelete(id);
                setPendingDeletes(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
                delete timeouts.current[id];
            }
        });

        // We use onAutoClose from sonner, but we can also set a manual timeout if needed.
        // However, sonner's onAutoClose is reliable for the "3 seconds" requirement.
    };

    const isPending = (id: string) => pendingDeletes.has(id);

    return { handleDelete, isPending };
}
