# GainsLab

Diario de entrenamiento de fuerza e hipertrofia, gratuito y de código abierto.
PWA para web y app Android (Capacitor), en español e inglés, que funciona sin conexión.

## Qué hace

- **Registro de series** con peso, repeticiones y RIR, superseries, calentamientos y protocolos
  (myo-reps, drop sets, cluster, rest-pause, EMOM, top/back-off), temporizador de descanso y
  sugerencias de progresión basadas en tus sesiones anteriores.
- **Rutinas y mesociclos**: plantillas, editor de rutinas, semanas y descargas, programa KONG.
- **Progreso**: series de trabajo por semana, mejores marcas, volumen por músculo y constancia.
- **Diario**: historial completo con edición, importación CSV (Hevy, Strong) y exportación CSV/JSON.
- **Nutrición y cuerpo**: calorías y macros, agua, cardio, peso y medidas.
- **Tus datos**: todo se guarda en el dispositivo; la cuenta y la sincronización en la nube son opcionales.

Todas las funciones son gratuitas. No hay planes de pago.

## Desarrollo

Requisitos: Node.js 20+ (para Android, JDK 21 y Android SDK).

```bash
npm install
npm run dev
```

La app funciona sin backend. Para cuentas y sincronización, copia `.env.example` a `.env.local`
y rellena la configuración de tu propio proyecto de Firebase (Auth + Firestore). Las reglas están
en `firestore.rules`.

Comprobaciones:

```bash
npm run verify                                   # lint, tipos, build, tests unitarios, KONG y bundle
node node_modules/@playwright/test/cli.js test   # E2E sobre el build
npm run test:visual                              # regresión visual
```

APK de depuración: `npm run android-debug-apk`.

## Apoyar el proyecto

GainsLab se mantiene con donaciones. El enlace aparecerá aquí y en Perfil → Proyecto.

## Licencia

[GNU AGPL-3.0](LICENSE). Puedes usar, estudiar, modificar y redistribuir el código; si ofreces una
versión modificada como servicio en red, debes publicar su código fuente bajo la misma licencia.
