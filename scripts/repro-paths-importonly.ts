import { resolve } from 'node:path';
const moduleFile = resolve(process.cwd(), 'packages', 'server', 'src', 'config', 'paths.ts');
const moduleUrl = (await import('node:url')).pathToFileURL(moduleFile).href;
const script = `const moduleUrl=process.argv[1]; const paths=await import(moduleUrl); console.log('SCRAPER_DIR',paths.SCRAPER_DIR);`;
const env = { ...process.env, BAO_SCRAPER_DIR: '' };
const proc = Bun.spawn(['bun', '-e', script, moduleUrl], { cwd: process.cwd(), env, stdout: 'pipe', stderr: 'pipe' });
const [code, out, err] = await Promise.all([
  proc.exited,
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text()
]);
console.log('exit', code, 'out', out.trim(), 'err', err.trim());
