# Borrado de cuenta: resto `data/subscription`

## Estado

`deleteCloudAccount` borra todo lo que un cliente puede borrar (colecciones V2,
`data/history`, `users/{uid}`) y elimina el usuario de Auth. Devuelve
`{ subscriptionRetained }`.

El documento `users/{uid}/data/subscription` **no** lo puede borrar el cliente:
`firestore.rules` fija `allow create, update, delete: if false`. Tras el borrado,
el registro queda huérfano (sin Auth que lo lea). La app lo detecta antes de
eliminar el usuario y lo informa en el diálogo en lugar de afirmar un borrado
total.

## Backend pendiente (una sola pieza)

Para un borrado completo hace falta UNA de estas dos opciones:

1. **Cloud Function `onAuthUserDelete`** (recomendada): trigger `functions.auth.user().onDelete`
   que borre con Admin SDK `users/{uid}` y `users/{uid}/data/subscription`.
   Entonces el cliente puede dejar de leer el flag (queda como defensa).
2. **Callable `requestAccountErasure`** con verificación de Auth que haga el mismo
   borrado servidor y devuelva el resultado.

En ambos casos, cambiar `firestore.rules` NO es necesario: la Function usa Admin SDK
y las reglas cliente siguen denegando escrituras (correcto).

## Datos afectados

El registro de suscripción contiene estado/tier/caducidad del backend de pagos,
sin entrenamientos ni emails. Aun así es un dato del usuario: no desplegar la
función deja un resto real tras "eliminar cuenta".
