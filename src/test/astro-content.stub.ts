/**
 * Vitest용 `astro:content` 별칭 대상.
 * Astro 가상 모듈은 Vite 단독 환경에서 해석되지 않으므로 이 빈 모듈로 연결하고,
 * 실제 동작은 각 테스트가 `vi.mock('astro:content', ...)`로 정의한다.
 */
// 빈 모듈로 인식시키려면 export가 하나는 있어야 한다.
// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
