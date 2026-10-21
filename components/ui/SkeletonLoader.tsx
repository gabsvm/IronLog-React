
import React from 'react';

interface SkeletonPulseProps {
    className?: string;
}

export const SkeletonPulse: React.FC<SkeletonPulseProps> = ({ className = "" }) => (
    <div className={`bg-[rgb(var(--surface-elevated))] animate-pulse rounded-[18px] ${className}`} />
);

export const HomeSkeleton = () => {
    return (
        <div className="w-full h-full flex flex-col bg-[rgb(var(--surface-app))] overflow-hidden pb-24">
            {/* Header Skeleton */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.96)] mt-safe-top">
                <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-8 h-8 rounded-[18px]" />
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

                {/* Premium Expressive editorial hero placeholder */}
                <div className="w-full aspect-[4/3] rounded-[32px] p-6 relative overflow-hidden bg-[rgb(var(--surface-elevated))] animate-pulse">
                    <div className="absolute top-6 left-6">
                        <div className="w-20 h-6 bg-[rgb(var(--border-strong))] rounded-full"></div>
                    </div>
                    <div className="absolute bottom-6 left-6 w-full pr-12">
                        <div className="w-3/4 h-8 bg-[rgb(var(--border-strong))] rounded-[18px] mb-3"></div>
                        <div className="flex gap-2 mb-4">
                            <div className="w-12 h-5 bg-[rgb(var(--border-strong))] rounded"></div>
                            <div className="w-12 h-5 bg-[rgb(var(--border-strong))] rounded"></div>
                        </div>
                        <div className="w-24 h-4 bg-[rgb(var(--border-strong))] rounded"></div>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="space-y-3">
                    <div className="w-20 h-3 bg-[rgb(var(--surface-elevated))] rounded"></div>
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center p-4 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]">
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
            <div className="fixed bottom-0 left-0 right-0 h-20 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] flex justify-around items-center px-6 pb-safe">
                <SkeletonPulse className="w-12 h-8 rounded-[18px]" />
                <SkeletonPulse className="w-12 h-8 rounded-[18px]" />
                <SkeletonPulse className="w-12 h-8 rounded-[18px]" />
            </div>
        </div>
    );
};
