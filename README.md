# Privacidad Texto ES

Biblioteca y herramienta local para localizar y ocultar algunos patrones sensibles antes de compartir un texto en español. Primera versión 0.1.0; no se afirma adopción o eficacia validada con personas reales.

## Usar

Requiere Node 22 o 24, sin dependencias, claves o conexión de red.

```sh
git clone https://github.com/Richardsch1/privacidad-texto-es.git
cd privacidad-texto-es
npm ci --ignore-scripts
node bin/cli.js scan --file examples/ficticio.txt
node bin/cli.js redact --file examples/ficticio.txt
```

`scan` devuelve categorías y posiciones sin copiar los valores coincidentes. `redact` escribe una copia a stdout y una advertencia a stderr; nunca modifica el original. Acepta `--stdin` para tuberías. Límite: un MiB de texto UTF-8. Las posiciones se expresan en índices UTF-16 de JavaScript.

```js
import { scanText, redactText } from './src/index.js';
console.log(scanText('EJEMPLO FICTICIO. DNI 00000000'));
console.log(redactText('Correo persona@example.invalid').text);
// Correo [CORREO]
```

## Cobertura y límites

Detecta algunos correos ASCII, DNI y RUC con etiqueta, celulares peruanos, teléfonos numéricos con contexto y determinados prefijos de credenciales. Fusiona coincidencias superpuestas. Son reglas heurísticas, no una validación de identidad o de credenciales.

No reconoce todos los formatos telefónicos, documentos de otros países, nombres, domicilios, datos de salud o todos los secretos. Puede producir falsos positivos y falsos negativos. **No garantiza anonimización.** La salida puede conservar información personal no detectada: revísala antes de compartir. No es un filtro HTML ni una certificación legal.

No guarda archivos ni hace peticiones de red. Los archivos originales, el historial del terminal y las copias de salida quedan bajo control de quien la use. No introduzcas secretos válidos en argumentos, pruebas o issues. Una clave expuesta debe revocarse en su proveedor, aunque se oculte después.

## Pruebas y contribución

```sh
npm run check
npm test
```

Pruebas con datos ficticios de redacción, superposiciones, Unicode, límites y CLI. CI en Node 22 y 24. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) y [SECURITY.md](SECURITY.md).

Código bajo [MIT](LICENSE). Repositorio público; `private: true` evita publicación accidental del paquete en npm. No hay métricas de uso verificadas ni afiliación institucional. Publicarlo no garantiza elegibilidad para Claude for OSS.
