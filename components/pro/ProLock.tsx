
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PaywallModal } from './PaywallModal';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface ProLockProps {
    children: React.ReactNode;
    featureName: string;
    blur?: boolean;
}

export const ProLock: React.FC<ProLockProps> = ({ children, featureName, blur = true }) => {
    const { subscription } = useAuth();
    const [showModal, setShowModal] = useState(false);

    if (subscription.isPro) {
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden rounded-xl">
            <div className={`${blur ? 'blur-sm pointer-events-none select-none opacity-50' : ''}`}>
                {children}
            </div>
            
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-100/50 dark:bg-black/50 backdrop-blur-[2px]">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xl text-center border border-zinc-200 dark:border-white/10 max-w-[200px]">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white shadow-lg shadow-yellow-500/30">
                        <Icon name="Lock" size={18} />
                    </div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">{featureName}</h4>
                    <Button size="sm" onClick={() => setShowModal(true)} className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-black">
                        Unlock PRO
                    </Button>
                </div>
            </div>

            {showModal && <PaywallModal onClose={() => setShowModal(false)} feature={featureName} />}
        </div>
    );
};
