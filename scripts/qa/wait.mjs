/**
 * 화면 확인 스크립트의 조건 대기. ego-browser 자동화 탭은 2fps 안팎으로 그려져 고정 대기(`waitForTimeout`)는
 * 가끔 늦거나 쓸데없이 길다. 그래서 모든 단계는 그 단계가 실제로 기다리는 조건(요소·포커스·속성·URL·
 * `astro:page-load`)을 기다린다. 고정 대기는 lint(`.oxlintrc.json`의 `scripts/qa/**` 규칙)가 막는다.
 */

/** 기본 시간 제한(ms). 조건이 참이 되는 즉시 끝나므로 넉넉히 둔다. */
const TIMEOUT = 10_000;

/**
 * 페이지 하나에 묶인 대기 도우미를 만든다.
 *
 * @param {{ evaluate: Function, waitForFunction: Function, goto: Function, reload: Function }} page ego-browser Page
 * @returns 대기 도우미 `{ until, navigate, goto, reload, ready }`
 */
export function waits(page) {
  /**
   * 페이지 안의 조건이 참이 될 때까지 기다린다. 시간 안에 참이 되면 `true`, 아니면 무엇을 기다리다 멈췄는지
   * 적고 `false`다(뒤따르는 확인이 실패로 남긴다).
   *
   * @param {string} label 기다리는 조건(시간 초과 메시지에 쓴다)
   * @param {Function} condition 페이지 안에서 도는 조건 함수
   * @param {unknown} [arg] 조건 함수에 넘길 값
   * @param {number} [timeout] 시간 제한(ms)
   */
  const until = (label, condition, arg, timeout = TIMEOUT) =>
    page.waitForFunction(condition, arg, { timeout }).then(
      () => true,
      (error) => {
        console.log(`  ⌛ ${timeout / 1000}초 안에 안 됨: ${label} (${error?.message ?? error})`);
        return false;
      },
    );

  /** 새로 불러온 문서가 다 읽혔고 창 틀 아일랜드가 하이드레이션을 마쳤을 때까지(`ssr` 속성이 걷힐 때까지) 기다린다. */
  const ready = (label) =>
    until(
      `${label}: 불러오기와 아일랜드 하이드레이션`,
      () =>
        window.qaStale !== true &&
        document.readyState === 'complete' &&
        document.querySelector('astro-island') !== null &&
        document.querySelector('astro-island[ssr]') === null,
    );

  /** 지금 문서에 표시를 남겨, 새 문서가 뜨기 전의 옛 문서를 다 읽힌 것으로 보지 않게 한다. */
  const markStale = () =>
    page.evaluate(() => {
      window.qaStale = true;
      return true;
    });

  return {
    until,
    ready,
    /** 주소로 가서 새 문서가 준비될 때까지 기다린다. */
    async goto(url) {
      await markStale();
      await page.goto(url);
      return ready(`${decodeURI(url)} 열기`);
    },
    /** 새로고침하고 새 문서가 준비될 때까지 기다린다. */
    async reload() {
      await markStale();
      await page.reload();
      return ready('새로고침');
    },
    /**
     * 화면 이동(`ClientRouter`)을 일으키는 동작을 하고 다음 `astro:page-load`까지 기다린다. 이 문서에서 받은
     * `astro:page-load` 수를 세어 두고 동작 뒤 그 수가 늘기를 본다. 레이아웃 스크립트의 리스너(펼침·읽기 위치)가
     * 먼저 달려 있으므로 수가 늘면 그 일도 끝난 뒤다. 이어서 화면 전환 애니메이션이 끝나기(`html`의
     * `data-astro-transition`이 걷히기)를 기다린다. 끝나기 전에 다음 이동을 하면 라우터가 앞 전환을 건너뛰고, 건너뛴
     * 전환의 거부(`AbortError: Transition was skipped`)가 콘솔 오류로 남는다.
     */
    async navigate(label, action) {
      const before = await page.evaluate(() => {
        if (typeof window.qaLoads !== 'number') {
          window.qaLoads = 0;
          document.addEventListener('astro:page-load', () => {
            window.qaLoads += 1;
          });
        }
        return window.qaLoads;
      });
      await action();
      const loaded = await until(
        `${label}: 화면 이동(astro:page-load)`,
        (count) => typeof window.qaLoads === 'number' && window.qaLoads > count,
        before,
      );
      return (
        loaded &&
        until(
          `${label}: 화면 전환 끝`,
          () => !document.documentElement.hasAttribute('data-astro-transition'),
        )
      );
    },
  };
}
