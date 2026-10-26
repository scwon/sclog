/**
 * 빌드된 사이트(`dist/`)를 `astro preview`로 띄우고 ego-browser로 화면 확인 스크립트를 돌린다.
 * 테스트(Vitest)가 볼 수 없는 화면 이동·접근성을 맡는다. CI에는 없고 로컬에서 `pnpm qa`로 쓴다.
 *
 *   node scripts/qa/run.mjs            a11y.mjs와 nav.mjs 모두
 *   node scripts/qa/run.mjs nav        하나만
 */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const dist = join(root, 'dist');
const port = 4399;
const base = `http://127.0.0.1:${port}`;
const scripts = process.argv.slice(2).length ? process.argv.slice(2) : ['a11y', 'nav'];

/** dist의 모든 HTML 페이지 URL(퍼센트 인코딩). ego-browser `-e`에는 ASCII만 넘긴다. */
function pageUrls() {
  const urls = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.html')) {
        const url = `/${relative(dist, path).split(sep).join('/')}`
          .replace(/index\.html$/, '')
          .replace(/\.html$/, '');
        urls.push(encodeURI(url));
      }
    }
  };
  walk(dist);
  return urls.toSorted();
}

async function waitForServer(server) {
  let exited = false;
  server.on('exit', () => (exited = true));
  for (let i = 0; i < 50 && !exited; i++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      // 아직 뜨는 중
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(
    `${base}에 preview 서버가 뜨지 않았다(위 오류 참고, 포트 ${port}를 이미 쓰는 프로세스가 있는지 lsof -i :${port})`,
  );
}

function run(command, args) {
  return new Promise((done) => {
    spawn(command, args, { cwd: root, stdio: 'inherit' }).on('exit', (code) => done(code ?? 1));
  });
}

const qa = {
  base,
  pages: pageUrls(),
  axe: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
};
const preview = spawn('pnpm', ['astro', 'preview', '--port', String(port), '--host', '127.0.0.1'], {
  cwd: root,
  stdio: ['ignore', 'ignore', 'inherit'],
});
let failed = 0;
try {
  await waitForServer(preview);
  for (const name of scripts) {
    const entry = pathToFileURL(join(here, `${name}.mjs`)).href;
    console.log(`\n▶ qa:${name}`);
    const code = await run('ego-browser', [
      'nodejs',
      '-e',
      `globalThis.QA = ${JSON.stringify(qa)}; await import('${entry}');`,
    ]);
    if (code !== 0) failed++;
  }
} catch (error) {
  console.error(error.message);
  failed++;
} finally {
  preview.kill();
}
console.log(failed ? `\n✗ qa 실패 ${failed}개` : '\n✓ qa 통과');
process.exit(failed ? 1 : 0);
