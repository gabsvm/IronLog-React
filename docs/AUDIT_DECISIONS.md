# Decisiones Arquitectónicas de Auditoría - GainsLab

## Decisión S4-a: Sincronización en Segundo Plano (Background Sync / Periodic Sync)

**Contexto:**
Los eventos `sync` ('sync-workouts') y `periodicsync` ('update-workouts-data') en `public/sw.js` comunican mensajes `FLUSH_SYNC_QUEUE` a ventanas (`clients`) abiertas a través de `postMessage`. Si el navegador activa el Service Worker en segundo plano pero ninguna pestaña o ventana de la aplicación se encuentra activa, el mensaje no encuentra clientes receptores.

**Alternativas consideradas:**
1. **Opción (a) - Mejor Esfuerzo (Adoptada):**
   - El Service Worker notifica a los clientes activos si están abiertos.
   - Si no hay ventanas activas, la sincronización autoritativa y el drenado de la cola de mutaciones offline de IndexedDB (`syncQueue`) se ejecuta de manera garantizada y robusta al volver a primer plano (`AppContext.tsx`, escuchador `online`, e inicialización de la app).
   - Ventajas: Cero riesgo de duplicar lógica de Firestore/Auth dentro del Service Worker, sin fuga de tokens ni desincronización de reglas en entornos web restringidos.
2. **Opción (b) - Sincronización Completa en Service Worker:**
   - Mover el SDK de Firestore o llamadas REST directas al hilo del Service Worker leyendo directamente de IndexedDB.
   - Desventajas: Alto riesgo de conflictos de concurrencia con la pestaña activa, mayor complejidad de bundle para el Service Worker y mayor consumo de memoria en dispositivos móviles como el Moto G86.

**Resolución:**
Se adopta formalmente la **Opción (a)**. `requestBackgroundSync` y `requestPeriodicSync` se mantienen como mecanismos de mejor esfuerzo oportunista, respaldados de forma determinista por el ciclo de vida de primer plano y los eventos de conectividad (`online`).
