/**
 * 빌드된 사이트(`dist/`)를 Astro `preview()` API로 띄우고 ego-browser로 화면 확인 스크립트를 돌린다.
 * 테스트(Vitest)가 볼 수 없는 화면 이동·접근성을 맡는다. CI에는 없고 로컬에서 `pnpm qa`로 쓴다.
 *
 *   node scripts/qa/run.mjs            a11y.mjs와 nav.mjs 모두
 *   node scripts/qa/run.mjs nav        하나만
 *   QA_PORT=4313 pnpm qa               포트 바꾸기(기본 4399). 작업 트리 여럿에서 함께 돌릴 때 쓴다
 */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preview } from 'astro';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const dist = join(root, 'dist');
const port = Number(process.env.QA_PORT ?? 4399);
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

/** 스크립트가 멈추면(직렬화 안 되는 값을 evaluate로 돌려받는 등) 제한 시간 뒤 끝낸다. 남은 프로세스는 다음 실행의 작업 공간을 막는다. */
function run(command, args, timeoutMs = 10 * 60 * 1000) {
  return new Promise((done) => {
    // ego-browser nodejs는 stdin으로도 스크립트를 받으므로 stdin을 넘기면 입력을 기다리며 멈출 수 있다.
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });
    // oxlint-disable-next-line no-restricted-globals -- 대기가 아니라 멈춘 자식 프로세스를 끝내는 제한 시간이다.
    const timer = setTimeout(() => {
      console.error(`${timeoutMs / 1000}초가 지나 멈춘 것으로 보고 끝낸다`);
      child.kill();
    }, timeoutMs);
    child.on('exit', (code) => {
      clearTimeout(timer);
      done(code ?? 1);
    });
  });
}

const qa = {
  base,
  pages: pageUrls(),
  axe: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
};
// CLI(`astro preview`)를 자식 프로세스로 띄우면 끈 뒤에도 서버가 남아 다음 실행의 포트를 막으므로 같은 프로세스에서 띄운다.
const server = await preview({ root, logLevel: 'error', server: { port, host: '127.0.0.1' } });
let failed = 0;
try {
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
  await server.stop();
}
console.log(failed ? `\n✗ qa 실패 ${failed}개` : '\n✓ qa 통과');
process.exit(failed ? 1 : 0);
