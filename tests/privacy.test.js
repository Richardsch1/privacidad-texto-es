import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanText, redactText, MAX_BYTES } from '../src/index.js';

test('detecta correo sin devolver su valor en el informe', () => {
  const input = 'Ejemplo persona@example.invalid';
  const report = scanText(input);
  assert.equal(report.count, 1);
  assert.deepEqual(report.findings[0].types, ['CORREO']);
  assert.ok(!JSON.stringify(report).includes('persona@example.invalid'));
});
test('identificadores requieren contexto DNI o RUC', () => {
  assert.equal(scanText('00000000').count, 0);
  assert.equal(scanText('DNI: 00000000 y RUC: 20000000000').count, 2);
});
test('oculta celular peruano con y sin prefijo internacional', () => {
  for (const phone of ['900000000', '+51 900 000 000', '51 900-000-000']) assert.equal(redactText(phone).text, '[TELEFONO]');
});
test('detecta teléfono fijo con etiqueta y evita duplicar coincidencias', () => {
  assert.equal(redactText('Teléfono: (01) 0000000').text, 'Teléfono: [TELEFONO]');
  assert.equal(redactText('Teléfono: 01 0000000').count, 1);
  const result = redactText('Celular: +51 900 000 000');
  assert.equal(result.count, 1);
  assert.equal(result.text, 'Celular: [TELEFONO]');
});
test('oculta credenciales de muestra sin revelar el valor en metadata', () => {
  const key = 'sk-ant-' + 'x'.repeat(45);
  const result = redactText(`Ejemplo ${key}`);
  assert.equal(result.text, 'Ejemplo [CREDENCIAL]');
  assert.ok(!JSON.stringify(scanText(key)).includes(key));
});
test('conserva texto y saltos de línea que no coinciden', () => {
  assert.equal(redactText('Agua\nComunidad').text, 'Agua\nComunidad');
  assert.equal(redactText('').text, '');
});
test('las posiciones usan índices UTF-16 y conservan emoji', () => {
  const result = redactText('💧 DNI 00000000');
  assert.equal(result.text, '💧 DNI [DNI]');
  assert.equal(result.findings[0].start, 7);
});
test('no detecta nombres o domicilios: no se promete anonimización', () => {
  assert.equal(scanText('Nombre de ejemplo y calle ficticia').count, 0);
  assert.match(scanText('texto').warning, /detección es parcial/);
});
test('no deja reutilización de estado entre llamadas', () => {
  assert.deepEqual(scanText('DNI 00000000'), scanText('DNI 00000000'));
});
test('rechaza tipos y tamaño, contando bytes UTF-8', () => {
  for (const value of [null, {}, 1]) assert.throws(() => scanText(value));
  assert.throws(() => scanText('a'.repeat(MAX_BYTES + 1)));
  assert.throws(() => scanText('á'.repeat(MAX_BYTES)));
});
test('no interpreta como celular una parte de una secuencia numérica mayor', () => {
  assert.equal(scanText('19999999999').count, 0);
});
const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url));
test('CLI scan no imprime el contenido original', () => {
  const result = spawnSync(process.execPath, [cli, 'scan', '--stdin'], { input: 'DNI 00000000', encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).count, 1);
  assert.ok(!result.stdout.includes('00000000'));
});
test('CLI redacta stdin y advierte por stderr', () => {
  const result = spawnSync(process.execPath, [cli, 'redact', '--stdin'], { input: 'persona@example.invalid', encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '[CORREO]');
  assert.match(result.stderr, /manualmente/);
});
test('CLI falla con uso inválido sin copiar argumentos privados', () => {
  const result = spawnSync(process.execPath, [cli, 'scan', '--description', 'FICTICIO PRIVADO'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(!result.stderr.includes('FICTICIO PRIVADO'));
});
