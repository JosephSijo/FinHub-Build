import React from 'react';
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
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        {illustration ? (
          <div className="text-6xl mb-2">{illustration}</div>
        ) : (
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        <div className="space-y-2 max-w-sm">
          <h3 className="text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-4">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
