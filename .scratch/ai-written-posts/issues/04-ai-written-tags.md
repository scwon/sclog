# 04: AI 글의 태그

**What to build:** AI 글의 태그는 `/ai-written/tags/`(태그 목록)와 `/ai-written/tags/<태그>/`(태그별 글)에만 모인다. `/blog/tags/`의 태그와 수에는 직접 쓴 글만 들어간다. 글 꼬리의 태그 링크와 경로 표시줄의 `tags` 조각이 그 글의 폴더를 따른다.

**Blocked by:** 01 (폴더가 있는 글 모델과 AI 글 화면)

**Status:** ready-for-agent

스펙의 "주소와 경로"·"글 화면"을 따른다.

- [ ] 태그 집계와 태그별 글 조회가 폴더 인자를 받아 그 폴더만 센다
- [ ] `/ai-written/tags/`와 `/ai-written/tags/<태그>/`가 기존 태그 화면과 같은 모양으로 열리고, 탭 경로·상태줄 요약이 맞다
- [ ] AI 글 꼬리 태그가 `/ai-written/tags/<태그>/`로, 직접 쓴 글은 `/blog/tags/<태그>/`로 간다
- [ ] 경로 표시줄의 `tags` 조각이 그 폴더의 태그 목록으로 간다
- [ ] blog 테스트: 폴더별 태그 집계와 조회
- [ ] `pnpm verify` 통과
