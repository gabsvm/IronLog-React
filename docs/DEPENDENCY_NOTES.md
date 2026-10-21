# Notas de dependencias (2026-10-21)

## `firebase` se queda en 11.10.0 (último 11.x)

Se probó `firebase@12.19.0`: no elimina el aviso de `npm audit`
(`@grpc/grpc-js <1.13.6` vía `@firebase/firestore`). Hasta el último
`@firebase/firestore` publicado (4.18.x, el que trae `firebase@13`) sigue
fijando `@grpc/grpc-js ~1.9.0`. No hay actualización que lo corrija; subir de
major solo por el aviso no compra seguridad.

Además `firebase@12` rompe el toolchain de tests con peers estrictos:
`@firebase/rules-unit-testing@4.0.1` exige `firebase@^11`, y su siguiente
publicación (6.0.0) exige `firebase@^13`. No existe versión intermedia
compatible con la v12.

## Por qué el aviso no es explotable aquí

- El bundle web servido (`dist/assets/vendor-firebase-db-*.js`) no contiene
  `getAuthContext` (la función vulnerable, del servidor TLS de grpc-js en Node).
- El entry de navegador de Firestore (`dist/index.esm2017.js`) no importa
  `@grpc/grpc-js` (solo aparecen comentarios con la palabra "grpc").
- En este runtime el transporte es WebChannel; `grpc-js` solo se carga en
  Node (tests de integración contra emuladores).

Re-auditar con `npm audit --omit=dev` cuando upstream cambie el pin de grpc.
No usar `overrides` para forzarlo: mutaría el contrato de un paquete de
terceros para todos los consumidores Node del árbol.
