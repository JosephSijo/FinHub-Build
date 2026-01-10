
import { Button } from './ui/button';
import { Card } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration
}: EmptyStateProps) {
  return (
    <Card className="p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
        {illustration ? (
          <div className="text-6xl mb-2 animate-bounce-slow">{illustration}</div>
        ) : (
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 shadow-sm">
            <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-display tracking-tight">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-2" size="lg">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
