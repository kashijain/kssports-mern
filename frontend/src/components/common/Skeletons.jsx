import React from 'react';

export const ProductSkeleton = () => {
  return (
    <div className="card-premium h-full bg-white dark:bg-dark-card rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-gray-800 w-full" />
      <div className="p-5 flex flex-col flex-grow">
        <div className="h-3 w-1/3 bg-slate-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-5 w-full bg-slate-200 dark:bg-gray-800 rounded mb-2" />
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-gray-800 rounded mb-4" />
        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="h-8 w-1/3 bg-slate-200 dark:bg-gray-800 rounded" />
          <div className="h-12 w-12 bg-slate-200 dark:bg-gray-800 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const CategorySkeleton = () => {
  return (
    <div className="rounded-2xl overflow-hidden aspect-square bg-slate-200 dark:bg-gray-800 animate-pulse border border-slate-100 dark:border-dark-border" />
  );
};

export const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600/30 border-t-primary-600"></div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">
        Loading Gear...
      </p>
    </div>
  );
};
