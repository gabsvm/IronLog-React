// S5: every per-item V2 collection under users/{uid} (account deletion wipes all).
export { deleteAllInCollection } from './cloudCollectionSync';

export const V2_COLLECTIONS = ['logs', 'nutritionEntries', 'nutritionDays', 'bodyLogs', 'cardioSessions', 'customFoods'] as const;
