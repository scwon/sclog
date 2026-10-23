# 02: 네 글꼴을 셀프호스팅한다

**What to build:** 블로그 이름·숫자는 Bricolage Grotesque, 제목·UI는 Pretendard Variable, 본문은 마루 부리, 코드·줄 번호·경로는 JetBrains Mono로 보이며, 글꼴 파일은 전부 사이트가 직접 제공한다. 외부 글꼴 요청이 하나도 없다. Storybook 토큰 문서에 글꼴 견본(Typeset)이 추가된다.

**Blocked by:** 01 (토큰·CSS 기반)

**Status:** ready-for-agent

참고: 스펙 "2층: CSS" 글꼴 항목, `docs/research/design-system-tokens.md` 부록(패키지 버전·크기), 시안 `styles.css`의 `@font-face`·폴백 스택, 시안 `README.md` 라이선스 표. 서브셋 생성은 시안 `build.py`의 fonttools 사용법을 참고한다.

- [ ] `pretendard`, `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/jetbrains-mono`가 의존성으로 추가되고 디자인 시스템 2층 글꼴 파일이 Pretendard 동적 서브셋 CSS와 fontsource 가변 woff2(라틴)를 import한다. `pretendard` npm 패키지는 2023-11이 마지막 배포라는 사실을 package.json 주석이 아닌 이 티켓의 Comments에 남긴다
- [ ] 마루 부리 Regular·Bold를 KS X 1001 한글 2,350자 + 기본 라틴·문장부호로 서브셋한 woff2가 `public/fonts/`에 OFL 라이선스 전문과 함께 있고, 재생성 명령이 `scripts/` 아래 스크립트로 남아 있다(빌드에는 포함하지 않음). 파일당 크기를 Comments에 기록한다
- [ ] 글꼴 토큰 `--font-display`·`--font-sans`·`--font-serif`·`--font-mono`가 `@theme inline`으로 노출돼 `font-display` 등 유틸리티가 생기고, 폴백 스택은 시안을 따른다
- [ ] 기존 페이지의 제목·본문·코드가 새 글꼴로 렌더링된다(글 본문은 마루 부리, `word-break: keep-all`)
- [ ] `Tokens.mdx`에 네 글꼴의 `Typeset` 견본(한글 문장과 `scwon’s blog`)이 추가된다
- [ ] 빌드 결과물 테스트에 "HTML·CSS에 `fonts.googleapis.com`·`fonts.gstatic.com`·`cdn.jsdelivr.net` 글꼴 참조 없음, `@font-face` `url()`은 모두 같은 출처 경로" 검사가 추가된다
- [ ] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과
