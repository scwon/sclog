/**
 * 화면 이동 시나리오(`scripts/qa/nav/*.mjs`)의 공용 도우미. 시나리오는 하나씩 따로 ego-browser 프로세스에서 돌고,
 * 모두 같은 알려진 상태에서 시작한다: 새 작업 공간의 새 탭, 1440px, 비운 `localStorage`·`sessionStorage`, 홈(`/`)을
 * 새로 불러와 창 틀 아일랜드가 하이드레이션을 마친 상태. 앞 시나리오가 남긴 테마·탭·패널 화면·읽기 기록에 기대지 않는다.
 *
 * 대기는 `wait.mjs`의 조건 대기를 쓴다. 여기의 `goto`·`reload`는 그 위에 창 틀 표시(`window.qaShell`)를 다시 다는
 * 일을 더한다. 새 문서를 불러오면 창 틀 아일랜드가 새 요소가 되므로, `shellKept()`는 마지막으로 불러온 뒤의 화면
 * 이동(`ClientRouter`)에서 아일랜드가 같은 요소로 남았는지 본다.
 *
 * `run.mjs`가 `globalThis.QA = { base }`를 넣고 ego-browser에서 시나리오를 import한다.
 */
/* global QA, taskSpace */
import { waits } from './wait.mjs';

/** 시나리오가 시작하는 화면 폭(px). */
const WIDTH = 1440;

/**
 * 시나리오 하나를 알려진 상태에서 시작한다.
 *
 * @param {string} name 시나리오 이름(작업 공간 이름과 실패 메시지에 쓴다)
 * @returns 페이지, 확인·대기 도우미, 끝낼 때 부르는 `done()`
 */
export async function scenario(name) {
  // 작업 공간 이름에 포트를 넣어 작업 트리 여럿이 함께 돌려도(`QA_PORT`) 서로의 탭을 잡지 않게 한다.
  const task = await taskSpace(`sclog qa nav ${name} ${new URL(QA.base).port}`);
  const page = task.page('p1');
  const wait = waits(page);
  const { until } = wait;
  const failures = [];

  /** 확인 항목 하나를 남긴다. 실패는 모아 두었다가 `done()`이 던진다. */
  function check(label, ok, detail = '') {
    console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
    if (!ok) failures.push(label);
  }

  /** 지금 문서의 창 틀 아일랜드를 적어 둔다. `shellKept()`가 이것과 맞대어 본다. */
  const markShell = () =>
    page.evaluate(() => {
      window.qaShell = document.getElementById('panel')?.closest('astro-island');
      return true;
    });
  /** 주소로 가서 새 문서가 준비되면 창 틀을 다시 적어 둔다. */
  const goto = async (url) => {
    const ok = await wait.goto(url);
    await markShell();
    return ok;
  };
  /** 새로고침하고 새 문서가 준비되면 창 틀을 다시 적어 둔다. */
  const reload = async () => {
    const ok = await wait.reload();
    await markShell();
    return ok;
  };
  /** 화면 폭을 바꾼다(높이 900px). */
  const setWidth = (width) =>
    page.cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
  /** 이 출처의 두 저장소를 비운다. 이 탭의 페이지 안에서 지우므로 다른 사이트·프로필에는 닿지 않는다. */
  const clearStorage = () =>
    page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    });

  const editor = () =>
    page.evaluate(() => {
      const root = document.getElementById('editor');
      return {
        url: root?.dataset.fileUrl,
        kind: root?.dataset.fileKind,
        title: root?.dataset.fileTitle,
      };
    });
  const shellKept = () =>
    page.evaluate(
      () =>
        window.qaShell?.isConnected === true &&
        window.qaShell === document.getElementById('panel')?.closest('astro-island'),
    );
  const tabs = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("nav[aria-label='열린 파일'] a")].map((a) => a.textContent),
    );
  const panelView = () =>
    page.evaluate(() => document.getElementById('panel')?.getAttribute('aria-label'));
  const panelShown = () =>
    page.evaluate(() => {
      const panel = document.getElementById('panel');
      return panel ? getComputedStyle(panel).display !== 'none' : false;
    });
  const statusLine = () => page.evaluate(() => document.querySelector('footer')?.textContent ?? '');
  /** 에디터 루트에 포커스를 준다. 포커스가 갔으면 `true`. */
  const focusEditor = () =>
    page.evaluate(() => {
      document.getElementById('editor')?.focus();
      return document.activeElement?.id === 'editor';
    });
  /** 홈의 첫 글 링크(`.flow-link`)가 가리키는 글 URL. 홈에서 부른다. */
  const homePostUrl = () =>
    page.evaluate(() => document.querySelector('.flow-link')?.getAttribute('href') ?? null);
  /** 활동 막대에서 그 패널 화면 버튼을 누른다. */
  const pickPanel = (label, clickLabel = `${label} 고르기`) =>
    page.click(`loc=css:nav[aria-label='활동 막대'] button[aria-label='${label}']`, {
      label: clickLabel,
    });

  /** 패널이 그 화면(`aria-label`)이 될 때까지 기다린다. */
  const panelIs = (label) =>
    until(
      `패널이 ${label}`,
      (view) => document.getElementById('panel')?.getAttribute('aria-label') === view,
      label,
    );
  /** 열린 파일 탭이 그 수가 될 때까지 기다린다. */
  const tabCount = (count) =>
    until(
      `열린 파일 탭 ${count}개`,
      (n) => document.querySelectorAll("nav[aria-label='열린 파일'] a").length === n,
      count,
    );
  /** 검색 입력창에 포커스가 올 때까지 기다린다. */
  const searchFocused = () =>
    until(
      '검색 입력창에 포커스',
      () => document.activeElement?.matches('#panel input[type=search]') === true,
    );
  /** 패널이 보이거나(`true`) 숨을(`false`) 때까지 기다린다. */
  const panelShownIs = (shown) =>
    until(
      `패널이 ${shown ? '보임' : '숨음'}`,
      (want) => {
        const panel = document.getElementById('panel');
        return (panel ? getComputedStyle(panel).display !== 'none' : false) === want;
      },
      shown,
    );

  /**
   * 콘솔 오류를 확인 항목으로 남기고, 저장소를 비우고, 작업 공간을 닫는다. 실패한 확인이 있으면 던진다.
   * 시나리오 끝에서 한 번 부른다.
   */
  async function done() {
    const events = await page.events();
    const errors = events
      .filter(
        (e) =>
          e.method === 'Runtime.exceptionThrown' ||
          (e.method === 'Runtime.consoleAPICalled' && e.params?.type === 'error') ||
          (e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error'),
      )
      .map((e) => {
        const exception = e.params?.exceptionDetails;
        // `Uncaught (in promise)`처럼 text만으로는 무엇인지 모르므로 예외 설명을 붙인다.
        const detail = exception
          ? `${exception.text} ${exception.exception?.description ?? ''}`.trim()
          : (e.params?.entry?.text ?? JSON.stringify(e.params));
        return detail.slice(0, 240);
      });
    check('콘솔 오류 없음', errors.length === 0, errors.join(' | '));
    await clearStorage();
    await task.finish({ keep: [] });
    if (failures.length) throw new Error(`이동 시나리오(${name}) 실패: ${failures.join(', ')}`);
  }

  // 알려진 상태: 새 탭, 1440px, 비운 저장소, 새로 불러온 홈.
  await page.cdp('Runtime.enable');
  await page.cdp('Log.enable');
  await setWidth(WIDTH);
  await wait.goto(`${QA.base}/`);
  await clearStorage();
  await reload();
  await panelIs('프로필');
  // 저장소를 비우기 전의 기록은 이 시나리오의 콘솔 오류로 세지 않는다.
  await page.events();

  return {
    page,
    task,
    check,
    until,
    navigate: wait.navigate,
    goto,
    reload,
    setWidth,
    editor,
    shellKept,
    tabs,
    panelView,
    panelShown,
    statusLine,
    focusEditor,
    homePostUrl,
    pickPanel,
    panelIs,
    tabCount,
    searchFocused,
    panelShownIs,
    done,
  };
}
