# BORRADOR: revisar antes de publicar

# Política de Privacidad — GainsLab (IronLog-React)

Última actualización: [FECHA_A_COMPLETAR]
Contacto de privacidad: [CONTACTO_A_COMPLETAR]

## 1. Qué datos guardamos

GainsLab guarda tus datos de entrenamiento y nutrición para que puedas usar la
app en varios dispositivos. Con cuenta iniciada (solo email y contraseña), se
sincronizan con Firebase (Google) bajo el documento `users/{tu-id}`:

- Identidad: email, uid, último acceso (lastSeen).
- Entrenamiento: programa activo, mesociclo activo, sesión activa, biblioteca
  de ejercicios, plantillas personales, historial de sesiones (`logs`),
  feedback de recuperación (rpFeedback).
- Nutrición y cuerpo: registros de nutrición, sesiones de cardio, registros de
  peso corporal, alimentos personalizados, objetivo nutricional, metas de macros
  y perfil de usuario (peso, altura, etc.).
- App: configuración (config), estado de sincronización por sección
  (sectionSyncMeta).
- Suscripción (`users/{tu-id}/data/subscription`): la escribe un backend
  externo; el cliente solo la lee para saber si sos Pro.

Sin cuenta (modo local/invitado), los datos quedan solo en tu dispositivo.

## 2. Para qué los usamos

- Mostrarte tu plan, historial, estadísticas y tendencias.
- Sincronizar entre tus dispositivos y recuperar tu información si cambiás de
  equipo.
- Determinar tu acceso Pro a partir de la suscripción.

No vendemos tus datos ni los usamos para publicidad.

## 3. Retención

Tus datos se conservan mientras tu cuenta exista. Al eliminar tu cuenta desde
la app (perfil "Tú" → Cuenta → Eliminar cuenta) se borran tu documento
`users/{tu-id}`, tus documentos de datos (`data/*`, incluido el historial) y tu
usuario de autenticación. La suscripción asociada a la cuenta se pierde. Podés
optar por borrar también los datos de ese dispositivo con la casilla
correspondiente.

## 4. Tus derechos

Podés acceder, corregir, exportar (perfil "Tú" → Datos → Exportar) o eliminar
tus datos en cualquier momento desde la app, o escribiendo a
[CONTACTO_A_COMPLETAR].

## 5. Seguridad

La transmisión y el almacenamiento usan la infraestructura de Firebase con
reglas de acceso que limitan cada documento a su dueño. Ningún sistema es
100% seguro; ante un incidente te avisaremos por el medio de contacto
disponible.
