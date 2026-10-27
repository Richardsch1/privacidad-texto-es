export const MAX_BYTES = 1024 * 1024;
const rules = [
  ['CORREO', /(?<![a-z0-9._%+-])([a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24})(?![a-z0-9.-])/gidu],
  ['DNI', /\bDNI[ :#-]{0,8}(\d{8})(?!\d)/gidu],
  ['RUC', /\bRUC[ :#-]{0,8}(\d{11})(?!\d)/gidu],
  ['TELEFONO', /(?<![\d+])((?:\+?51[ .-]*)?9(?:[ .-]*\d){8})(?!\d)/gidu],
  ['TELEFONO', /\b(?:tel[eé]fono|celular|whatsapp)[ :#-]{0,8}((?:\+?\d|\(\d{2,3}\))(?:[ .()-]*\d){6,14})(?!\d)/gidu],
  ['CREDENCIAL', /((?:sk-ant-|gh[pousr]_|github_pat_)[a-z0-9_-]{20,})/gidu],
];

function validate(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('El texto debe ser una cadena de hasta un MiB.');
}

export function scanText(text) {
  validate(text);
  const matches = [];
  for (const [type, expression] of rules) {
    for (const match of text.matchAll(new RegExp(expression))) {
      const [start, end] = match.indices[1];
      matches.push({ start, end, types: [type] });
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged = [];
  for (const match of matches) {
    const previous = merged.at(-1);
    if (previous && match.start < previous.end) {
      previous.end = Math.max(previous.end, match.end);
      previous.types = [...new Set([...previous.types, ...match.types])].sort();
    } else merged.push({ ...match, types: [...match.types] });
  }
  // Deliberately return offsets and categories, never the matched values.
  return { findings: merged, count: merged.length, warning: 'La detección es parcial. Revisa manualmente nombres, direcciones, salud y otros datos antes de compartir.' };
}

export function redactText(text) {
  const report = scanText(text);
  let cursor = 0;
  const parts = [];
  for (const finding of report.findings) {
    parts.push(text.slice(cursor, finding.start), `[${finding.types.join('+')}]`);
    cursor = finding.end;
  }
  parts.push(text.slice(cursor));
  return { ...report, text: parts.join('') };
}
