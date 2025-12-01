import React from 'react';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mini Dashboard Skeleton */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </Card>

      {/* Content Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TransactionListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function GoalsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
