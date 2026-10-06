import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { findViolations } from './no-pc.ts';

// Se ejecuta con tsx (npm run check:no-pc), que permite importar el .ts.
const paths = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter((p) => !/\.(png|jpe?g|gif|ico|woff2?|lock)$/i.test(p) && p !== 'package-lock.json');
const files = paths.map((path) => ({ path, content: readFileSync(path, 'utf8') }));
const v = findViolations(files);
if (v.length) {
  console.error('Referencias que podrían exponer el PC:');
  for (const x of v) console.error(`  ${x.path}:${x.line}  ${x.match}`);
  process.exit(1);
}
console.log(`OK: ${files.length} archivos sin referencias al PC.`);
