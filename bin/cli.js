#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { scanText, redactText, MAX_BYTES } from '../src/index.js';

const help = `Privacidad de texto en español
node bin/cli.js scan|redact --file archivo.txt
node bin/cli.js scan|redact --stdin

scan devuelve categorías y posiciones, sin copiar valores detectados.
redact escribe una copia con sustituciones en stdout; no modifica el original.
Límite: un MiB. No garantiza anonimización y no realiza conexiones de red.
`;
try {
  const [command, source, file, ...extra] = process.argv.slice(2);
  if (!command || command === '--help') process.stdout.write(help);
  else {
    if (!['scan', 'redact'].includes(command) || extra.length || !['--file', '--stdin'].includes(source) || (source === '--file' ? !file : file !== undefined)) throw new Error('Uso inválido. Consulta --help.');
    const stream = source === '--stdin' ? process.stdin : createReadStream(file);
    const chunks = [];
    let size = 0;
    for await (const chunk of stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_BYTES) { stream.destroy(); throw new Error('El archivo supera un MiB.'); }
      chunks.push(bytes);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    if (command === 'scan') console.info(JSON.stringify(scanText(text), null, 2));
    else {
      const result = redactText(text);
      process.stdout.write(result.text);
      console.error(result.warning);
    }
  }
} catch { console.error('No se pudo procesar el texto. Revisa el uso, el archivo y el límite de tamaño.'); process.exitCode = 1; }
