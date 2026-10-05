# Pasos manuales tras la serie Q (dueño)

Todo lo que el agente NO pudo o NO debía hacer: desplegar, tocar Firebase real o probar en
el teléfono. Seguilos en este orden. El detalle de Firebase está en
[FIREBASE_MANUAL_STEPS.md](FIREBASE_MANUAL_STEPS.md).

## 1. Fijar el admin (antes de desplegar reglas)
- El cliente ya no compara emails: `isAdmin` sale del claim `admin` o del email del dueño
  **verificado** (`constants/admin.ts`, igual que las reglas).
- Verificá el email del dueño en Firebase Auth o fijá el claim con el script de
  FIREBASE_MANUAL_STEPS §2. Sin eso el panel admin pierde escritura al desplegar.

## 2. Desplegar las reglas (Q3 + Q21)
1. Antes de desplegar, abrí en la consola tu `users/{uid}` y compará sus claves con
   `userAllowedKeys()` en `firestore.rules` (Q3 tolera claves heredadas en updates, pero
   conviene saber cuáles hay).
2. Probá en local: `npm run test:rules` y `npm run test:integration` (JDK 21 en PATH).
3. Desplegá solo las reglas, siguiendo FIREBASE_MANUAL_STEPS §3
   (`firebase deploy --only firestore:rules`).
- Q3: los updates validan solo las claves que cambian.
- Q21: agrega `historyFormat` y `users/{uid}/logs/{id}`. Son inofensivas con el flag apagado.

## 3. Flags de build
- **`VITE_CLOUD_LOGS_V2`** (historial por sesión, Q21; desde S5 también nutrición, peso corporal, cardio y alimentos propios, un documento por elemento y sin recortes). Apagado por defecto. Para encenderlo:
  1. reglas de Q21 ya desplegadas (paso 2);
  2. `VITE_CLOUD_LOGS_V2=1` en `.env` y build nuevo para **todos** tus dispositivos (un
     build viejo seguiría leyendo `data/history`, que con el flag deja de actualizarse);
  3. primer arranque con red: migra `data/history` a `logs/` (no lo borra) y marca
     `historyFormat: 2` en `users/{uid}`; las secciones de dieta/peso/cardio/alimentos se
     copian a `nutritionLogs/`, `bodyLogs/`, `cardioSessions/` y `customFoods/` y se marca
     `collectionsFormat` (los arrays viejos del documento principal se siguen escribiendo,
     recortados, para builds sin el flag). Comprobalo en la consola.
  - Volver atrás: apagar el flag y rebuild. `data/history` conserva lo que había al migrar;
    las sesiones nuevas desde entonces solo están en `logs/` (y en el teléfono).
- **App Check** (`VITE_FIREBASE_APPCHECK_SITE_KEY`, `VITE_FIREBASE_APPCHECK_DEBUG`): seguí
  FIREBASE_MANUAL_STEPS §5. Monitorear, sin "Enforce" todavía.

## 4. En el teléfono (Moto G86 Power, Android 15)
- Instalar el APK de prueba sin perder datos:
  `adb install -r apk-out/gainslab-release-test.apk` (misma keystore de debug de siempre).
- **Alarmas y recordatorios exactos** (Q8): Perfil → Entrenamiento → "Alarmas y
  recordatorios exactos" → Activar → conceder en Ajustes. Android 14+ lo trae denegado.
- **Notificaciones**: Ajustes de Android → Apps → GainsLab → Notificaciones activadas
  (canales de descanso y de recordatorio).
- **Notificación del descanso** (Q9): durante un descanso, probá "+30 s" y "Saltar" con la
  app en segundo plano y la pantalla apagada.
- **Recordatorios de entreno** (Q13): activarlos en Entrenamiento, elegir días y hora;
  comprobar que no avisa el día que ya entrenaste y que sobreviven a un reinicio.
- **Widget "Iniciar entreno"** (Q17): mantener pulsado el escritorio → Widgets → GainsLab →
  arrastrarlo. Un toque abre la app y arranca el entreno (en frío y con la app abierta).

## 5. Datos
- **Importadores CSV** (Q12): solo se validaron con fixtures sintéticos. Exportá un CSV real
  de Hevy y otro de Strong, importalos (Perfil → Datos → Importar CSV) y revisá sesiones,
  fechas, pesos (kg/lb) y el mapeo de ejercicios. Reimportar no debe duplicar.
- **Respaldos** (Q6): tras una sesión, Perfil → Datos debe listar un respaldo automático;
  probá "Restaurar" en una instalación de prueba.

## 6. Borrado de cuenta (con una cuenta de PRUEBA, nunca la tuya)
- FIREBASE_MANUAL_STEPS §4: crear cuenta de prueba, sincronizar algo, borrarla desde la app
  y comprobar en la consola que no quedan `users/{uid}`, `data/history` (ni `logs/` si el
  flag V2 está encendido) y que el usuario desapareció de Auth. `data/subscription` no se
  toca por diseño (lo maneja el backend de pagos).

## 7. Novedades de la serie S (ver AUDIT_FOLLOWUP_10_REPORT)
- **Compartir CSV a la PWA**: instalá la PWA desde Chrome en Android (menú → Instalar app).
  En Hevy/Strong exportá el CSV y usá Compartir → GainsLab: se abre el importador. La app
  Capacitor (APK) no recibe "Compartir" (haría falta un intent-filter nativo); ahí seguí
  usando Perfil → Datos → Importar CSV.
- **Atajos del ícono** (mantener pulsado el ícono de la PWA): Iniciar entreno, Registrar
  comida, Historial.
- **Modo claro**: revisá un entreno en modo claro (la serie activa ya no sale negra).
- **Datos en la nube**: con el flag apagado, peso/cardio/alimentos ya sincronizan lo más
  reciente (antes, pasado el tope, se quedaban con lo más viejo). Con `VITE_CLOUD_LOGS_V2=1`
  todo el historial de dieta/peso/cardio/alimentos va sin recortes (desplegá antes las reglas).
- **Idioma**: la app solo descarga el idioma activo; cambiar de idioma la primera vez tarda
  un instante (descarga el otro diccionario, que el service worker ya tiene en caché).

