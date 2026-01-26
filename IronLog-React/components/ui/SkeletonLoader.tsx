
import React from 'react';

interface SkeletonPulseProps {
    className?: string;
}

export const SkeletonPulse: React.FC<SkeletonPulseProps> = ({ className = "" }) => (
    <div className={`bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg ${className}`} />
);

export const HomeSkeleton = () => {
    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden pb-24">
            {/* Header Skeleton */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 mt-safe-top">
                <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-8 h-8 rounded-lg" />
                    <SkeletonPulse className="w-24 h-6" />
                </div>
                <SkeletonPulse className="w-8 h-8 rounded-full" />
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-hidden">
                {/* Header Text */}
                <div className="space-y-2 mt-2">
                    <SkeletonPulse className="w-48 h-8 rounded-md" />
                    <SkeletonPulse className="w-32 h-4 rounded-md" />
                </div>

                {/* Progress Bar */}
                <div className="flex gap-1.5 w-full">
                    <SkeletonPulse className="flex-1 h-1.5 rounded-full" />
                    <SkeletonPulse className="flex-1 h-1.5 rounded-full" />
                    <SkeletonPulse className="flex-1 h-1.5 rounded-full" />
                </div>

                {/* Main "Up Next" Card - Exact match to V3 design */}
                <div className="w-full aspect-[4/3] rounded-3xl p-6 relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 animate-pulse">
                    <div className="absolute top-6 left-6">
                        <div className="w-20 h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-6 left-6 w-full pr-12">
                        <div className="w-3/4 h-8 bg-zinc-300 dark:bg-zinc-700 rounded-lg mb-3"></div>
                        <div className="flex gap-2 mb-4">
                            <div className="w-12 h-5 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                            <div className="w-12 h-5 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                        </div>
                        <div className="w-24 h-4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="space-y-3">
                    <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center p-4 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900">
                            <SkeletonPulse className="w-10 h-10 rounded-full mr-4" />
                            <div className="flex-1 space-y-2">
                                <SkeletonPulse className="w-32 h-4" />
                                <SkeletonPulse className="w-24 h-3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Nav Skeleton */}
            <div className="fixed bottom-0 left-0 right-0 h-20 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex justify-around items-center px-6 pb-safe-bottom">
                <SkeletonPulse className="w-12 h-8 rounded-lg" />
                <SkeletonPulse className="w-12 h-8 rounded-lg" />
                <SkeletonPulse className="w-12 h-8 rounded-lg" />
            </div>
        </div>
    );
};
