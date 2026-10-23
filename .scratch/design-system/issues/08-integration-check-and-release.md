# 08: 네 화면을 두 테마로 확인하고 main에 합친다

**What to build:** scwon.me가 시안 그대로의 전체 화면 IDE로 바뀐다. 통합 브랜치 `design-system`의 홈·글·태그·404를 두 테마에서 ego-browser로 확인해 Orca 탭으로 보여 주고, 문서(DESIGN.md·CLAUDE.md)를 현재 상태에 맞춘 뒤 main에 합쳐 배포한다.

**Blocked by:** 06 (홈 흐름 로그), 07 (글 파일 화면)

**Status:** ready-for-agent

참고: 스펙 "진행 방식"·"문서 갱신", 사용자 완료 기준(글 URL·원본 보존, ego-browser 확인, Orca 탭).

- [ ] `pnpm build` 결과를 `astro preview`로 띄워 ego-browser로 홈·글(`/blog/pro-developer-2023-days/`)·태그·404를 어두운/밝은 테마, 1440·1024·390px 폭에서 스크린샷으로 남기고 Orca 탭(`orca tab create --url file://…`)으로 연다. 발견한 차이는 이 티켓의 Comments에 적고 고친다
- [ ] 홈 → 글 → 다른 장 → 뒤로가기 → 탭 닫기 → 테마 전환 흐름에서 창 틀이 유지되고, 콘솔 오류가 없으며, JS를 끈 상태에서도 글이 읽힌다
- [ ] 기존 글 URL·태그 URL·RSS·사이트맵 경로가 배포 전과 같다(빌드 결과물 테스트 + 수동 확인)
- [ ] DESIGN.md "미정 항목" 중 다크 팔레트·글꼴·반경·모션을 확정 절로 옮기고, 토큰 파일을 출처로 가리킨다. 시안 수치 표는 고치지 않는다
- [ ] CLAUDE.md Tech Stack에 nanostores와 디자인 시스템 폴더 포인터를 추가한다. 토큰 값은 적지 않는다
- [ ] `design-system` 브랜치에서 `/code-review`를 돌리고 지적을 반영한 뒤, Conventional Commits로 정리해 main에 합친다. Vercel 배포 뒤 scwon.me를 ego-browser로 한 번 더 연다
- [ ] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과
