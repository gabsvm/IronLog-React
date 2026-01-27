import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const upgradeToPro = async (userId: string) => {
    if (!db) return;
    const userRef = doc(db, 'users', userId, 'data', 'subscription');
    try {
        await setDoc(userRef, {
            isPro: true,
            tier: 'pro',
            paymentProcessedAt: Date.now()
        }, { merge: true });
        console.log(`User ${userId} successfully upgraded to PRO.`);
    } catch (error) {
        console.error(`Failed to upgrade user ${userId} to PRO:`, error);
    }
};