# Pasos manuales de Firebase (dueño)

El agente NO ejecuta ninguno de estos pasos: requieren credenciales del dueño
y tocan servicios en producción. Orden recomendado: 1 → 2 → 3 → 4.

## 1. Probar las reglas en el emulador

```sh
npm run test:rules
```

Levanta el emulador de Firestore (puerto 8085, ver `firebase.json`) y corre
`tests/rules/firestore.rules.test.ts` (11 casos). Requiere JDK 21+ para
firebase-tools (`JAVA_HOME=C:\jdk-21` en esta máquina). Todo queda verificado
antes de tocar producción.

## 2. Verificar o fijar el admin (ANTES de desplegar)

Las reglas aceptan como admin el custom claim `admin == true` o, en
transición, `gabsvm@gmail.com` con email verificado. Sin una de las dos, el
panel de administración pierde escritura en `global_templates` y
`global_exercises` al desplegar.

Opción A — verificar el correo: iniciar sesión con `gabsvm@gmail.com`,
verificar el email (enlace de Firebase Auth) y listo.

Opción B — fijar el claim (definitivo) con el Admin SDK desde tu máquina:

```js
// node (con GOOGLE_APPLICATION_CREDENTIALS de una cuenta de servicio)
const admin = require('firebase-admin');
admin.initializeApp();
admin.auth().getUserByEmail('gabsvm@gmail.com')
  .then(u => admin.auth().setCustomUserClaims(u.uid, { admin: true }))
  .then(() => console.log('claim admin fijado'));
```

Después de fijar el claim, cerrá sesión y volvé a entrar en la app para que el
token nuevo lo incluya. El agente NO agrega `firebase-admin` al repo ni
ejecuta esto.

## 3. Desplegar las reglas

Antes de desplegar, abrí en la consola de Firestore tu documento `users/{uid}`
y compará sus claves reales con la lista permitida de `firestore.rules`
(`userAllowedKeys`: email, lastSeen, uid, lastUpdated, program, activeMeso,
activeSession, config, exercises, rpFeedback, nutritionLogs, cardioSessions,
bodyLogs, customFoods, personalTemplates, nutritionGoal, macroGoals, userProfile,
sectionSyncMeta). Desde Q3 las actualizaciones toleran campos heredados, pero
si ves una clave vieja que la app ya no usa, conviene saber que existe antes de
endurecer nada más.

```sh
npx firebase-tools deploy --only firestore:rules --project <tu-project-id>
```

Nada en este repo despliega solo: hay que correrlo a mano. Verificá después:

- La app sincroniza (subir un cambio y bajarlo en otro dispositivo).
- El panel admin escribe plantillas/ejercicios globales.
- El gestor PRO en la app sigue bloqueado por diseño (la suscripción solo la
  escribe el backend externo; la app muestra su propio aviso).

Si algo falla, las reglas anteriores están en el historial de git
(`firestore.rules` antes del commit N4) y en el historial de la consola de
Firebase.

## 4. Probar el borrado de cuenta con una cuenta de prueba

NO uses tu cuenta real:

1. Registrá `borrado-test+<fecha>@gmail.com` (o similar) en la app.
2. Generá datos: completá una sesión, agregá una comida, un pesaje.
3. Perfil "Tú" → Cuenta → Eliminar cuenta → contraseña + ELIMINAR.
4. Verificá en la consola de Firestore que `users/{uid}` y `data/history`
   desaparecieron y que el usuario ya no existe en Authentication.
5. Verificá que la app quedó con sesión cerrada y sin re-subir nada
   (sin conexión no debe quedar cola pendiente de ese usuario).

## 5. App Check (opcional, SIN Enforce todavía)

La app inicializa App Check solo si definís `VITE_FIREBASE_APPCHECK_SITE_KEY`
(ver `.env.example`); sin esa variable el comportamiento es idéntico al actual
y no se carga código extra.

1. En la consola de Firebase → App Check → Apps → tu app web → registrar con
   proveedor reCAPTCHA v3 (creá la clave en la consola de reCAPTCHA si no
   existe) y copiá el site key a `VITE_FIREBASE_APPCHECK_SITE_KEY`.
2. Agregá los dominios: el de producción y `localhost` (necesario para el
   WebView de Capacitor con `androidScheme: https`, que sirve la app desde
   `https://localhost`).
3. Desplegá la app con la variable y mirá durante unos días las métricas de
   solicitudes verificadas en la consola de App Check.
4. RECIÉN DESPUÉS, y solo si las métricas muestran tráfico verificado de tus
   usuarios reales, activá "Enforce" para Firestore (y Auth si lo usás).

ADVERTENCIA: activar Enforce sin haber verificado puede dejar al propio dueño
sin acceso (las solicitudes sin token válido se rechazan).

Para desarrollo local: `VITE_FIREBASE_APPCHECK_DEBUG=1` (solo surte efecto con
`npm run dev`, nunca en builds de producción) usa el token de depuración; el
token impreso en consola debe registrarse en App Check → Apps → tu app →
"Manage debug tokens" si querés probar con Enforce en local.
