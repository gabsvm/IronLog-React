
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AppState } from "../types";

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

            // 1. Guardamos datos "ligeros" en el documento principal
            const mainData = {
                program: state.program || [],
                activeMeso: state.activeMeso || null,
                activeSession: state.activeSession || null,
                config: state.config || {},
                exercises: state.exercises || [],
                rpFeedback: state.rpFeedback || {},
                lastUpdated: Date.now()
            };
            
            batch.set(userRef, mainData, { merge: true });

            // 2. Guardamos los LOGS (Historial) en un documento separado para no saturar
            // la lectura inicial.
            if (state.logs && state.logs.length > 0) {
                const logsRef = doc(db, "users", userId, "data", "history");
                // Importante: Aquí sobrescribimos el array de logs completo por simplicidad.
                // En una app masiva, usaríamos 'arrayUnion', pero para <10k logs esto es seguro y previene duplicados.
                batch.set(logsRef, { logs: state.logs });
            }

            await batch.commit();
            console.log("☁️ Cloud Sync: Upload Complete");
        } catch (error) {
            console.error("❌ Cloud Sync Upload Failed:", error);
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
