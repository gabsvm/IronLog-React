# Repyntra — integración inicial de marca (2026-10-25)

## Decisión de identidad
- Nombre de producto aprobado: **Repyntra**.
- Lema de trabajo: **Cada repetición cuenta.**
- Símbolo: **Peak Signal**, dos trayectorias ascendentes que evocan fuerza y progreso; versión de producción redibujada como vector reproducible a partir del concepto visual aprobado.
- Color principal de marca: violeta `#B79CFF`, con recorrido del símbolo `#972BFF → #4B53F5`; segunda trayectoria cian/azul `#2087FE → #00E5DB`. Fondo del icono `#071424`.
- Variantes entregadas: color/oscuro, blanco/oscuro, color/claro y mono/claro; wordmarks para superficies claras y oscuras.

## Alcance del cambio
- Android KMP: etiqueta del launcher, identidad de Home, textos de perfil/importación, recursos de icono adaptativo/round/legacy y notificaciones.
- Acento por defecto para nuevos usuarios: VIOLET. Las elecciones de acento guardadas se conservan. No se alteró la selección de otras paletas.
- Paleta clara de superficies azuladas y selección cian; temas y textos inspeccionados a 360dp en AVD Android 16.
- Foreground adaptativo reducido al 78 % para proteger los extremos del símbolo frente al recorte del splash/launcher; artes promocionales conservan el icono a tamaño completo.
- Los identificadores internos **no se renombran** por compatibilidad: applicationId `com.gabsvm.gainslab.kmp`, namespace Kotlin, esquemas Room, preferencias, rutas de datos, APIs de sincronización, RPCs, IDs Expo/React Native legado, ni la cuenta Supabase.
- La app React Native legado NO forma parte de esta primera integración de la nueva marca.
- Los nombres internos de algunos recursos siguen conteniendo `gainslab_` a propósito para reducir cambios técnicos en el flujo del temporizador/launcher.

## Recursos editables y reproducibles
- `artifacts/branding/repyntra/build_brand.py`: fuente reproductible para SVG y PNG a partir de vectores y tipografía de sistema. Requiere Python 3 + Pillow en Windows.
- `artifacts/branding/repyntra/repyntra-*.svg`: cuatro variantes vectoriales.
- `artifacts/branding/repyntra/repyntra-*.png`: artes finales 1024 px, foreground/monochrome sin fondo, wordmarks.
- `kmp/androidApp/src/main/res/drawable-nodpi/`: assets de Android de 432 px y wordmarks dark/light.
- `kmp/androidApp/src/main/res/mipmap-*/`: iconos legado de densidad.

## Validación y límites
- Revisión de que el nombre carecía de coincidencias públicas exactas evidentes en búsquedas web de 25/10/2026. Esto **NO** prueba que el nombre sea registrable o libre mundialmente. Verificar INPI/OMPI y denominaciones semejantes antes de publicar.
- El diseño final debe aprobarse en launcher Android real, pantalla de inicio en dark/light, tamaño 48dp y modo de iconos temáticos.
- No declarar tests, APK ni QA emulador como completados sin pruebas posteriores al commit.
- El incidente SQLite 787/586 registros outbox de G86 permanece fuera de alcance y SIN resolver.
- No usar para la publicación elementos visuales procedentes de RP Hypertrophy.
