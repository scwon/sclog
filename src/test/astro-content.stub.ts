/**
 * Vitest용 `astro:content` 대체 모듈.
 * Astro 가상 모듈은 Vite 단독 환경에서 해석되지 않으므로 별칭으로 연결하고,
 * 각 테스트에서 `vi.mock('astro:content', ...)`로 실제 동작을 정의한다.
 */
export function getCollection(): never {
  throw new Error('astro:content is not available in Vitest; mock it in the test');
}
