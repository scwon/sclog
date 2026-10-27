# 04: AI 글의 태그

**What to build:** AI 글의 태그는 `/ai-written/tags/`(태그 목록)와 `/ai-written/tags/<태그>/`(태그별 글)에만 모인다. `/blog/tags/`의 태그와 수에는 직접 쓴 글만 들어간다. 글 꼬리의 태그 링크와 경로 표시줄의 `tags` 조각이 그 글의 폴더를 따른다.

**Blocked by:** 01 (폴더가 있는 글 모델과 AI 글 화면)

**Status:** done

스펙의 "주소와 경로"·"글 화면"을 따른다.

- [x] 태그 집계와 태그별 글 조회가 폴더 인자를 받아 그 폴더만 센다
- [x] `/ai-written/tags/`와 `/ai-written/tags/<태그>/`가 기존 태그 화면과 같은 모양으로 열리고, 탭 경로·상태줄 요약이 맞다
- [x] AI 글 꼬리 태그가 `/ai-written/tags/<태그>/`로, 직접 쓴 글은 `/blog/tags/<태그>/`로 간다
- [x] 경로 표시줄의 `tags` 조각이 그 폴더의 태그 목록으로 간다
- [x] blog 테스트: 폴더별 태그 집계와 조회
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `ticket/04-ai-tags`)

**결정**

- 태그 집계·조회의 폴더 인자와 blog 테스트는 01에서 이미 들어와 있었다. 이 티켓은 화면·링크·경로 표시줄만 더했다.
- AI 태그 화면의 파일 경로는 `ai-written/tags/`·`ai-written/tags/<태그>`다. 탭에는 이 경로가 그대로 보여 직접 쓴 글의 `tags/<태그>` 탭과 갈리고, 경로 표시줄은 `ai-written › tags › <태그>`가 된다. 직접 쓴 글의 `tags/…` 경로는 그대로 둔다.
- 경로 표시줄의 `tags` 조각은 바로 앞 조각이 폴더면 그 폴더의 태그 목록, 앞 조각이 없으면 `posts`의 태그 목록으로 간다(`ide.ts` `sectionHref`).
- 주소와 파일 경로는 `ide.ts`의 `tagUrl(folder, tag)`·`tagPath(folder, tag?)` 한곳에서 만든다. 두 폴더의 태그 화면은 `src/components/tags/TagIndex.astro`·`TagPosts.astro`를 같이 쓰고, 페이지 파일은 폴더·제목·설명만 넘긴다.
- AI 태그 목록의 탭 제목은 `AI 글 태그`, 직접 쓴 글은 `태그` 그대로다.
- 빌드 확인: `/ai-written/tags/`에 `AI`·`블로그` 두 태그, `/blog/tags/`에는 AI 글만 단 태그가 없다. AI 글 꼬리 태그가 `/ai-written/tags/<태그>/`로 간다.
