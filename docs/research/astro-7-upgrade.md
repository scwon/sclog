# Astro 5.16 → 7 업그레이드 영향 조사

- 작성일: 2026-10-23
- 질문: "Astro 5.16 → 7 에서 이 저장소(sclog)에 영향을 주는 변경" — 무엇이 깨지고, 무엇을 바꿔야 하며, 무엇이 선택인가.
- 조사 범위: Astro 공식 문서(v6/v7 업그레이드 가이드, 현재 v7 기준), GitHub `withastro/astro` CHANGELOG·릴리스 노트, npm 레지스트리 메타데이터, Vite·Tailwind·Vercel 공식 문서. 추측은 "미확인/불확실"에 분리했다.
- 조사 시점의 최신 버전: astro 7.4.2, @astrojs/mdx 8.1.1, @astrojs/react 7.1.1, @astrojs/sitemap 3.7.4, @astrojs/check 0.9.12, @tailwindcss/vite 4.3.3, vitest 5.0.5, @storybook/builder-vite 10.6.3.

## 결론 요약

1. **반드시 바꿔야 하는 것은 콘텐츠 컬렉션(Content Collections) 하나다.** v6에서 legacy 컬렉션 호환이 플래그까지 포함해 완전히 제거됐다. `src/content/config.ts` → `src/content.config.ts` 이동, `type: 'content'` → `loader: glob()`, `post.render()` → `render(post)`, `post.id`의 의미 변화(확장자 없는 slug)에 맞춰 `[slug].astro`·`utils/blog.ts`를 고쳐야 한다.
2. **Node.js 최소 버전이 22.23.4** (astro 7.4.2 `engines.node`). 현재 셸의 22.22.3은 미달이고 volta 핀 24.11.1은 충족한다. Vercel은 기본 24.x라 설정 변경 없이 통과한다.
3. **Vite 8로 올라가므로 `@tailwindcss/vite`를 4.2.2 이상으로 올려야 한다** (4.1.18의 peer는 `^5.2.0 || ^6 || ^7`). Vitest·Storybook은 자체 Vite를 쓰므로 당장 깨지진 않지만 Vite 8 지원 버전(vitest 5, storybook 10.6)으로 맞추는 것이 안전하다.
4. **v7의 Rust 컴파일러·`compressHTML: 'jsx'` 기본값·Sätteri 기본 Markdown 처리기**는 설정 변경 없이 적용된다. 이 저장소는 remark/rehype 플러그인을 쓰지 않아 Sätteri는 무관하고, 나머지 둘은 빌드·화면 확인만 필요하다.
5. `z`를 `astro:content`에서 가져오는 것은 v6부터 deprecated(아직 동작). `astro/zod`로 바꾸고 Zod 4 문법을 따르면 된다. `<ClientRouter />`·`astro:page-load`는 그대로 유효하므로 ADR 계획에 영향 없다.

## 변경 영향표

| 변경 | 버전 | 이 저장소 영향 | 해야 할 일 | 출처 |
| --- | --- | --- | --- | --- |
| Node 최소 22.12.0 → 7.4.0에서 22.22.0 → 7.4.2에서 22.23.4 | v6.0 / v7.4.x | 예 | 로컬 Node를 volta 핀(24.11.1)으로 실제 적용. `package.json` `engines.node` 명시 권장 | [v6 가이드 Node 22](https://docs.astro.build/en/guides/upgrade-to/v6/#nodejs-22), astro CHANGELOG 7.4.0/7.4.2, npm `astro@7.4.2` `engines.node: ">=22.23.4"` |
| Vite 6 → 7(v6) → 8(v7) | v6.0, v7.0 | 예 | `@tailwindcss/vite` ≥ 4.2.2로 상향. 그 외 Vite 전용 설정 없음 | [v7 Vite 8](https://docs.astro.build/en/guides/upgrade-to/v7/#vite-8), [Tailwind CHANGELOG 4.2.2](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md) "Add support for Vite 8 in `@tailwindcss/vite` (#19790)" |
| legacy 콘텐츠 컬렉션 제거(`legacy.collections` 플래그 및 플래그 없는 자동 호환 모두 삭제) | v6.0 | 예 | 아래 "astro" 절의 5단계 마이그레이션 | [v6 Removed: legacy content collections](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections) |
| `src/content/config.ts` → `src/content.config.ts` | v6.0 (v5부터 권장) | 예 | 파일 이동 | 위 링크 "What should I do" 체크리스트; 오류 [LegacyContentConfigError](https://docs.astro.build/en/reference/errors/legacy-content-config-error/) |
| `type: 'content'` 제거, `loader` 필수 | v6.0 | 예 | `loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' })` | 위 링크; [glob() loader](https://docs.astro.build/en/reference/content-loader-reference/#glob-loader) |
| `entry.render()` 제거 → `render(entry)` | v6.0 | 예 | `import { render } from 'astro:content'` | [render()](https://docs.astro.build/en/reference/modules/astro-content/#render) |
| `entry.slug` 제거, `entry.id`가 slug(확장자 없는 kebab-case)로 바뀜 | v6.0 | 예 | `post.id.replace(/\.mdx?$/, '')` 제거, 파일명은 `entry.filePath` 사용 | v6 가이드 "Replace `entry.slug` with `entry.id`… use `filePath`"; [Defining custom IDs](https://docs.astro.build/en/guides/content-collections/#defining-custom-ids) |
| `entry.body`는 glob 로더에서 원문 body 제공(`retainBody` 기본 true) | v5.0+ (문서는 v7 기준) | 예(개선) | `node:fs` 직접 읽기 제거, `post.body` 사용 | [Querying build-time collections](https://docs.astro.build/en/guides/content-collections/#querying-build-time-collections) "will also return a `body`"; [retainBody](https://docs.astro.build/en/reference/content-loader-reference/#glob-loader) |
| `z` from `astro:content` / `astro:schema` deprecated → `astro/zod` | v6.0 (deprecated, 미제거) | 예(권장) | `import { z } from 'astro/zod'` | [v6 Deprecated: astro:schema](https://docs.astro.build/en/guides/upgrade-to/v6/#deprecated-astroschema-and-z-from-astrocontent) |
| Zod 4 | v6.0 | 예(검토) | 현재 스키마(`min/max/default/optional/array/boolean/date`)는 Zod 4에서 동일 API. `{ message }` → `{ error }`, `.email()` 등은 미사용 | [v6 Zod 4](https://docs.astro.build/en/guides/upgrade-to/v6/#zod-4) |
| `<ViewTransitions />` 제거, `astro:transitions` 내부 상수/헬퍼 제거 | v6.0 제거 / v7.0 제거 | 아니오(ClientRouter 도입 시에도 영향 없음) | `ClientRouter`는 `astro:transitions`에서 import. 이벤트는 문자열 이름 사용(이미 그렇게 함) | [v7 Removed: astro:transitions internals](https://docs.astro.build/en/guides/upgrade-to/v7/#removed-exposed-astrotransitions-internals), [ClientRouter](https://docs.astro.build/en/reference/modules/astro-transitions/#clientrouter-) |
| `astro:page-load` 등 라이프사이클 이벤트 | v7 현행 | ClientRouter 도입 시 | 변경 없음. 현재 5개 컴포넌트의 리스너 그대로 유효 | [Lifecycle events](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events) |
| `<script>`/`<style>` 선언 순서대로 출력(이전엔 역순) | v6.0 기본값 변경 | 검토 | 한 컴포넌트에 `<style>`/`<script>` 여러 개면 우선순위 확인 | [v6 Changed Defaults](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-script-and-style-tags-are-rendered-in-the-order-they-are-defined) |
| Markdown heading ID: 특수문자로 끝나는 제목의 끝 하이픈 유지 | v6.0 | 검토 | `# 왜 개발자?` 같은 제목의 id가 `왜-개발자-`로 바뀔 수 있음. TOC는 `headings`에서 생성하므로 자동 일치; 수동 앵커 링크만 확인 | [v6 heading ID](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-markdown-heading-id-generation) |
| `getStaticPaths()` params는 string만 | v6.0 | 아니오 | slug는 string | [v6 getStaticPaths](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-getstaticpaths-cannot-return-params-of-type-number) |
| Vitest에서 Astro 컴포넌트는 jsdom/happy-dom 환경에서 렌더 불가 | v6.0 | 아니오(현재 React만 테스트) | 향후 `.astro`를 Vitest로 테스트하려면 `environment: 'node'` | v6 가이드 "Container API in Vitest" |
| `getViteConfig()` 사용 시 Vitest ≥3.2 또는 ≥4.1 필요 | v6.0 | 아니오 | `vitest.config.ts`는 `vitest/config` 직접 사용 | [v6 Vite 7.0](https://docs.astro.build/en/guides/upgrade-to/v6/#vite-70) |
| Rust 컴파일러 기본·유일 (닫히지 않은 태그는 오류, 잘못된 중첩 자동 교정 없음) | v7.0 | 검토 | `astro build`로 확인. CSS 색상/`url()` 직렬화 차이는 무시 가능 | [v7 Rust compiler](https://docs.astro.build/en/guides/upgrade-to/v7/#rust-compiler) |
| `compressHTML` 기본 `true` → `'jsx'` (인라인 요소 사이 공백 제거) | v7.0 | 검토 | 화면 확인 후 필요한 곳에 `{" "}` 또는 `compressHTML: true` | [v7 compressHTML](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx) |
| 기본 Markdown 처리기 Sätteri, `@astrojs/markdown-remark` 미설치 | v7.0 | 아니오 | remark/rehype 플러그인 없음 → 조치 불필요 | [v7 Sätteri](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-s%C3%A4tteri) |
| `src/fetch.ts` 예약 파일명(advanced routing 기본화) | v7.0 | 아니오 | 해당 파일 없음 | [v7 Reserved file name](https://docs.astro.build/en/guides/upgrade-to/v7/#reserved-file-name-srcfetchts) |
| `@astrojs/db` 제거, CommonJS config 제거, `Astro.glob()` 제거, `%25` 라우트 제거 | v6.0/v7.0 | 아니오 | 미사용 | v6/v7 가이드 Removed 절 |
| 확장자 있는 엔드포인트는 trailing slash 불가 | v6.0 | 아니오 | 커스텀 엔드포인트 없음(sitemap은 통합이 생성) | [v6 endpoints](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-endpoints-with-a-file-extension-cannot-be-accessed-with-a-trailing-slash) |
| `site`/`trailingSlash`/`build.format` 기본값 | v6/v7 | 변경 없음 | v6·v7 가이드와 6.0.0 릴리스 노트에 해당 항목 없음 | 위 가이드 전체 |
| TypeScript 설정 | v6.0 | 아니오 | #15668의 tsconfig 변경은 #15788로 되돌려짐. 현재 `astro/tsconfigs/base`는 `${configDir}` 사용(TS 5.5+ 문법) | [6.0.0 릴리스 노트](https://github.com/withastro/astro/releases/tag/astro%406.0.0), [tsconfigs/base.json](https://github.com/withastro/astro/blob/main/packages/astro/tsconfigs/base.json) |

## 패키지별 상세

### astro (5.16.4 → 7.4.2)

**콘텐츠 컬렉션 마이그레이션(필수).** v6 가이드의 체크리스트를 이 저장소에 대입하면 다음 다섯 가지다.

1. `src/content/config.ts`를 `src/content.config.ts`로 옮긴다. 남겨 두면 `LegacyContentConfigError`로 빌드가 실패한다.
2. `type: 'content'`를 지우고 `loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' })`를 추가한다(`import { glob } from 'astro/loaders'`). `type` 옵션은 더 이상 존재하지 않는다.
3. `src/pages/blog/[slug].astro`: `params: { slug: post.id }`로 단순화한다. glob 로더의 `id`는 파일명을 `github-slugger`로 변환한 slug라 확장자가 없다(`pro-developer-2023-days`). 파일명이 필요하면 `post.filePath`.
4. `await post.render()` → `const { Content, headings } = await render(post)` (`render`를 `astro:content`에서 import).
5. `node:fs`로 원문을 읽던 코드를 `post.body`로 대체한다. 문서상 `getCollection()`은 "raw, uncompiled body"를 `body`로 돌려주며, `retainBody`(기본 `true`)가 켜져 있으면 MDX도 저장된다. 5.x에서 비어 있던 원인은 legacy 에뮬레이션 때문으로 추정되나 1차 출처로 확인하지 못했다(미확인 절 참조).

`src/utils/blog.ts`의 `getCollection('blog', filter)`·`CollectionEntry<'blog'>`는 API가 그대로다. 단, 반환 순서는 비결정적이므로 날짜 정렬을 직접 해야 한다(이미 하고 있다면 변경 없음).

임시 우회로 `legacy.collectionsBackwardsCompat: true`가 v6.0에 추가됐고(v7 문서에도 남아 있음) `src/content/config.ts`·`type`·`entry.slug`·`entry.render()`를 보존하지만, "temporary migration helper"로 명시돼 있어 포스트가 하나인 이 저장소는 바로 마이그레이션하는 편이 낫다. 출처: [Legacy flags](https://docs.astro.build/en/reference/legacy-flags/).

**Zod.** `z`는 `astro/zod`에서 가져오도록 바꾼다(v6 deprecated, v7 Removed 목록에는 없음). Zod 4로 올라갔으므로 `{ message }` 에러 옵션은 `{ error }`, `.default()`는 transform 이후 출력 타입과 일치해야 한다. 현재 스키마는 영향 없는 메서드만 쓴다.

**v7 변경 중 확인만 필요한 것.** Rust 컴파일러(닫히지 않은 태그 오류), `compressHTML: 'jsx'`(인라인 요소 사이 공백), `<script>/<style>` 순서(v6). 모두 `pnpm build` 후 화면 확인으로 끝난다. Sätteri·advanced routing·`@astrojs/db`·캐시 플래그는 무관하다.

**`Astro.url`/`Astro.site`/`Astro.generator`/`Astro.params`, `is:inline`, `getStaticPaths`.** 제거·변경 없음. v6의 "route pathname normalization"은 percent-encoded 세그먼트에만 해당한다.

**`env.d.ts`.** `/// <reference path="../.astro/types.d.ts" />` 한 줄은 v5 이후 선택 사항이다. `astro/tsconfigs/base`가 `include: [".astro/types.d.ts", "**/*"]`를 이미 포함하므로 파일을 지워도 되고 두어도 된다(v6/v7에서 관련 변경 없음). 출처: [TypeScript Setup](https://docs.astro.build/en/guides/typescript/#setup).

**`@astrojs/upgrade`.** v6·v7 가이드 모두 첫 단계로 `pnpm dlx @astrojs/upgrade`를 안내한다. README에 따르면 astro와 공식 `@astrojs/*` 통합을 함께 올리며, 첫 번째 위치 인자가 버전 태그(기본 `latest`), `--dry-run`·`--help` 플래그가 있다. 서드파티(tailwind, vitest 등)는 다루지 않는다. 출처: [packages/upgrade README](https://github.com/withastro/astro/blob/main/packages/upgrade/README.md), `src/actions/context.ts`.

### @astrojs/mdx (4.3.12 → 8.1.1)

- 8.1.1 peer: `astro ^7.2.10`, `@astrojs/markdown-satteri ^0.4.0`, `@astrojs/markdown-remark ^7.3.0`(optional). `engines.node >=22.23.4`. 따라서 **astro는 7.2.10 이상**이어야 한다(최신 7.4.2 사용 시 충족). 출처: npm `@astrojs/mdx@8.1.1`.
- 주요 변경: 5.0.0 Node 22.12/Vite 7, 6.0.0 `markdown.processor` 옵션·Sätteri 도입, 7.0.0 Vite 8, 8.0.0 MDX 처리를 Markdown 처리기로 이관. 이 저장소는 `mdx()`를 옵션 없이 쓰므로 설정 변경 없음. 출처: [mdx CHANGELOG](https://github.com/withastro/astro/blob/main/packages/integrations/mdx/CHANGELOG.md).
- v7에서 `.mdx`도 Sätteri로 렌더된다. remark/rehype/recma 플러그인을 쓰지 않으므로 조치 없음.

### @astrojs/react (4.4.2 → 7.1.1)

- peer: `react`/`react-dom` `^17.0.2 || ^18 || ^19`, `@types/react(-dom)` 동일 범위, `oxc-transform-react`(optional). React 19.2.4 충족. `engines.node >=22.23.4`. 출처: npm `@astrojs/react@7.1.1`.
- 5.0.0 Node 22.12/Vite 7·plugin-react 5, 6.0.0 Vite 8·`container-renderer` 엔트리 추가, 7.0.0 `@vitejs/plugin-react` v6(Oxc)·`babel` 옵션 제거·opt-in `compiler` 옵션. 이 저장소는 `react()`를 옵션 없이 쓰고 Container API를 쓰지 않으므로 변경 없음. 출처: [react CHANGELOG](https://github.com/withastro/astro/blob/main/packages/integrations/react/CHANGELOG.md).
- 통합은 자체 `@vitejs/plugin-react ^6.1.2`를 의존성으로 들고 있다. 루트의 `@vitejs/plugin-react 5.1.3`(vitest·storybook용)은 별개 복사본으로 공존한다.

### @astrojs/sitemap (3.6.0 → 3.7.4)

- 메이저 변경 없음. 3.7.1에서 Astro 6 beta 대응·zod 4 자체 의존, 3.7.4에서 `trailingSlash: 'never'`/`build.format: 'file'` 시 홈 URL 수정. npm 메타데이터에 `peerDependencies`·`engines`가 없다. 출처: [sitemap CHANGELOG](https://github.com/withastro/astro/blob/main/packages/integrations/sitemap/CHANGELOG.md), npm `@astrojs/sitemap@3.7.4`.
- `site: 'https://sclog.dev'` 설정은 그대로 유효하다.

### @astrojs/check (0.9.4 → 0.9.12)

- 최신 0.9.12, peer `typescript ^5.0.0 || ^6.0.0`, 의존 `@astrojs/language-server ^2.17.3`. CHANGELOG에 Astro 6/7 전용 요구 버전이 명시돼 있지 않다. `build` 스크립트의 `astro check`는 그대로 쓸 수 있으나 같이 최신으로 올리는 것을 권장. 출처: npm `@astrojs/check@0.9.12`, [astro-check CHANGELOG](https://github.com/withastro/language-tools/blob/main/packages/astro-check/CHANGELOG.md).
- TypeScript 5.6.3은 peer 범위 안이다. Astro 7 패키지 자체는 typescript peer를 선언하지 않는다(devDependency `^6.0.3`만 존재).

### Tailwind / Vite / Vitest / Storybook

- `@tailwindcss/vite 4.1.18` peer `vite ^5.2.0 || ^6 || ^7` → Vite 8 미지원. **4.2.2(2026-03-18)부터 Vite 8 지원**, 최신 4.3.3 peer `^5.2.0 || ^6 || ^7 || ^8`. `tailwindcss`와 `@tailwindcss/vite`를 함께 4.3.3으로 올린다. 출처: npm `@tailwindcss/vite@4.1.18`/`@4.3.3`, Tailwind CHANGELOG 4.2.2.
- Vite 8: esbuild/Rollup → Rolldown/Oxc, CSS 축소는 Lightning CSS, 기본 브라우저 타깃 상향(Chrome 111/Firefox 114/Safari 16.4). 앱 코드 변경은 없고 플러그인 작성자 영향. 출처: [Vite migration guide](https://vite.dev/guide/migration).
- `vitest 4.0.18`은 `vite ^6 || ^7`을 자체 의존성으로 갖고, `@storybook/builder-vite 10.2.3` peer는 `vite ^5 || ^6 || ^7`. 둘 다 astro의 Vite 8과 별도 인스턴스라 즉시 깨지진 않지만, 하나의 Vite로 통일하려면 vitest 5.0.5(`^6.4 || ^7 || ^8`)·storybook 10.6.3(builder-vite peer `^5 || ^6 || ^7 || ^8`)·`@vitejs/plugin-react` 6으로 올려야 한다. 출처: npm 각 패키지 메타데이터.

### Node / Vercel

- 최소 Node: astro 7.4.2 `>=22.23.4`(7.4.0에서 22.22.0, 7.4.2에서 보안 패치로 22.23.4). 현재 셸의 22.22.3은 **미달**, volta 핀 24.11.1은 충족. Astro 정책상 Maintenance LTS 최소 버전은 minor/patch에서 올라갈 수 있다. 출처: astro CHANGELOG 7.4.0/7.4.2, [Node.js support policy](https://docs.astro.build/en/upgrade-astro/#nodejs-support-and-upgrade-policies).
- Vercel: 정적 사이트는 "You don't need any extra configuration" — 어댑터·`vercel.json` 불필요, Astro 자동 감지. 빌드 Node는 기본 24.x(22.x 선택 가능), `package.json` `engines.node`로 덮어쓸 수 있다. 출처: [Deploy to Vercel](https://docs.astro.build/en/guides/deploy/vercel/), [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## 미확인/불확실

- **5.x에서 `post.body`가 비어 있던 원인**: legacy 에뮬레이션 동작으로 추정되나 v5/v6 가이드에 `body` 관련 서술이 없어 1차 출처로 확인하지 못했다. 마이그레이션 후 `post.body`가 채워지는지 빌드로 검증해야 한다.
  - **검증 결과(2026-10-23)**: glob 로더 이전 후 `post.body`로 계산한 읽기 시간이 `node:fs` 원문 기준과 같은 7분으로 빌드됐다(5.16·7.4 모두). `body`는 채워진다.
- **`@astrojs/check`와 Astro 7의 공식 호환 표**: CHANGELOG·npm에 Astro 버전 조건이 없다. 최신(0.9.12)으로 올리고 `astro check` 통과로 확인.
- **pnpm peer 해석**: `@tailwindcss/vite`·vitest·storybook이 서로 다른 Vite 복사본을 참조할 때 pnpm 10이 경고만 내는지, 실패하는지는 실제 설치 전엔 알 수 없다(이번 조사에서 설치 금지).
- **MDX 본문의 `<p align="center"><img/></p>` 같은 HTML**: Rust 컴파일러의 엄격함은 `.astro` 템플릿 대상이고 MDX는 Sätteri가 처리한다. Sätteri의 MDX 내 raw HTML 처리 차이는 문서에서 찾지 못했다. 빌드 결과 비교 필요.
- **6.0.0 CHANGELOG 원문**: `packages/astro/CHANGELOG.md`(main)에는 7.x 항목만 남아 있어 6.0.0은 GitHub 릴리스 페이지로 확인했다.
- **TypeScript 최소 버전**: Astro 7이 명시한 최소치는 없다. `astro/tsconfigs/base`의 `${configDir}`는 TS 5.5+ 문법이므로 5.6.3은 충분하다고 판단되나, 공식 문서의 명시는 없다.

## 권장 순서

1. Node를 volta 핀(24.11.1)으로 맞추고 `node -v`가 ≥22.23.4인지 확인. `package.json`에 `engines.node: ">=22.23.4"` 추가(선택).
2. 콘텐츠 컬렉션을 **먼저 Astro 5.16 상태에서** 새 API로 옮긴다(`content.config.ts`, `glob()`, `render()`, `post.id`, `post.body`, `astro/zod`). 5.x에서도 모두 지원되므로 프레임워크 업그레이드와 분리해 검증할 수 있다.
3. `pnpm dlx @astrojs/upgrade --dry-run`으로 대상 확인 후 실제 실행 → astro 7.4.x, mdx 8.1.x, react 7.1.x, sitemap 3.7.x, check 0.9.12.
4. `tailwindcss`·`@tailwindcss/vite`를 4.3.3으로 상향.
5. `pnpm astro check && pnpm build`. Rust 컴파일러 오류(닫히지 않은 태그)·`compressHTML: 'jsx'` 공백·heading id 끝 하이픈·`<style>/<script>` 순서를 확인.
6. (선택) vitest 5.0.x, storybook 10.6.x, `@vitejs/plugin-react` 6으로 올려 Vite 8 단일화. `pnpm test`·`pnpm storybook`으로 확인.
7. 이후 ADR의 `<ClientRouter />` 도입 — 기존 `astro:page-load` 리스너는 변경 없이 동작한다.
