
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AppState } from "../types";

/**
 * Firestore no soporta valores `undefined`.
 * Esta función elimina las claves con undefined o las convierte en null
 * usando el truco de JSON.stringify/parse que elimina undefined automáticamente.
 */
const sanitizeForFirestore = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};

export const syncService = {
    /**
     * SUBIDA (PUSH): Envía el estado local a Firebase.
     * Estrategia: 'Merge'. Sobrescribe la configuración y el programa,
     * pero fusiona los logs (historial).
     */
    uploadState: async (userId: string, state: Partial<AppState>) => {
        if (!userId || !db) return;
        
        try {
            const batch = writeBatch(db);
            const userRef = doc(db, "users", userId);

            // 1. Preparamos los datos y LIMPIAMOS los 'undefined'
            const rawMainData = {
                program: state.program || [],
                activeMeso: state.activeMeso || null,
                activeSession: state.activeSession || null,
                config: state.config || {},
                exercises: state.exercises || [],
                rpFeedback: state.rpFeedback || {},
                lastUpdated: Date.now()
            };

            // Sanitización crítica: convierte undefined -> desaparece del objeto
            const mainData = sanitizeForFirestore(rawMainData);
            
            batch.set(userRef, mainData, { merge: true });

            // 2. Guardamos los LOGS (Historial) en un documento separado
            if (state.logs && state.logs.length > 0) {
                const logsRef = doc(db, "users", userId, "data", "history");
                // También limpiamos los logs por si acaso
                const logsData = sanitizeForFirestore({ logs: state.logs });
                batch.set(logsRef, logsData);
            }

            await batch.commit();
            console.log(`☁️ Cloud Sync: Upload Complete (User: ${userId}) at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error("❌ Cloud Sync Upload Failed:", error);
            throw error; // Rethrow so manual triggers can catch it
        }
    },

    /**
     * DESCARGA (PULL): Obtiene datos de Firebase.
     */
    downloadState: async (userId: string): Promise<Partial<AppState> | null> => {
        if (!userId || !db) return null;

        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                
                // Obtener logs del sub-documento
                const logsRef = doc(db, "users", userId, "data", "history");
                const logsSnap = await getDoc(logsRef);
                const logsData = logsSnap.exists() ? logsSnap.data().logs : [];

                return {
                    program: data.program,
                    activeMeso: data.activeMeso,
                    activeSession: data.activeSession, // Sincronizamos sesión activa también
                    config: data.config,
                    exercises: data.exercises,
                    rpFeedback: data.rpFeedback,
                    logs: logsData
                };
            }
            return null; // Usuario nuevo en nube
        } catch (error) {
            console.error("❌ Cloud Sync Download Failed:", error);
            return null;
        }
    }
};
