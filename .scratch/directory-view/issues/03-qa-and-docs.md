# 03: QA와 문서

**What to build:** `pnpm qa`가 새 화면 구조에서 통과한다. 접근성 페이지 확인 목록에 `ai-written/` 디렉터리 뷰와 새 로그 주소를 넣고, 이동 시나리오가 루트 → `posts/` → 글로 시작한다. 용어집·DESIGN.md·ADR을 새 구조에 맞춘다.

**Blocked by:** 02

**Status:** open

스펙의 "Testing Decisions(QA)"를 따른다.

- [ ] `a11y.mjs`: AI 화면 목록(`/ai-written/`, `/ai-written/ai-written.log/`)
- [ ] 시나리오 시작 경로: `scenario.mjs`·`tabs-and-theme`·`unfold`·`resume`가 루트 → `posts/` → 글
- [ ] `ai-written.mjs`: 루트 `ai-written/` 줄 → 디렉터리 뷰 → `ai-written.log` → AI 글 → 글 끝 `ai-written.log`
- [ ] `GLOSSARY.md`: 디렉터리 뷰·파일 줄·루트, 흐름 로그·링크 줄 갱신, AI 글 칸 삭제
- [ ] `DESIGN.md` 사이트 방향, ADR 0006, ADR 0005 끝에 참조 한 줄
- [ ] `pnpm qa` 통과

## Comments
