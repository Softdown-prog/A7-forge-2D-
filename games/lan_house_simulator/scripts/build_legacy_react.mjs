import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';

export async function buildLegacyReact(root) {
 const fixture = resolve(root, 'legacy-react');
 const lock = JSON.parse(readFileSync(resolve(fixture, 'package-lock.json'), 'utf8'));
 const installed = Object.entries(lock.packages).filter(([path]) => path).every(([path, expected]) => {
  const manifest = resolve(fixture, path, 'package.json');
  return existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).version === expected.version;
 });
 if (!installed) {
  const args = ['ci', '--ignore-scripts', '--no-audit', '--no-fund'];
  const npmCli = process.env.npm_execpath;
  if (npmCli) {
   execFileSync(process.execPath, [npmCli, ...args], {cwd:fixture, stdio:'inherit'});
  } else {
   const windows = process.platform === 'win32';
   execFileSync(windows ? 'npm.cmd' : 'npm', args, {cwd:fixture, stdio:'inherit', shell:windows});
  }
 }

 // The JSX lives in src/ for the legacy tests. Resolve its React imports only
 // from the fixture so an old root node_modules cannot change the bundle.
 await build({
  entryPoints: [resolve(root, 'src/react/entry.jsx')],
  outfile: resolve(root, 'dist/js/react-entry.js'),
  alias: {
   react: resolve(fixture, 'node_modules/react'),
   'react-dom': resolve(fixture, 'node_modules/react-dom'),
  },
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  external: ['./main.js'],
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
  logLevel: 'warning',
 });
}
