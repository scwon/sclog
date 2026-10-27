/**
 * 방문자 브라우저 저장소(`localStorage`·`sessionStorage`) 접근을 한곳에 모은다(ADR 0004). 저장 바인딩(탭·마지막 패널
 * 화면·읽기 기록)은 저장소를 직접 만지지 않고 이 모듈을 거친다.
 *
 * 쿠키를 막은 Chrome은 `localStorage`를 읽기만 해도(`typeof localStorage` 포함) SecurityError를 던지고, 사생활 보호
 * 창은 쓰기에서 던질 수 있다. 서버에는 저장소가 없다. 이럴 때는 안내 없이 이 모듈의 메모리에 두어, 같은 페이지
 * 안에서는 쓴 값을 다시 읽을 수 있게 한다.
 */

/** 저장소 종류. `local`은 다음 방문까지(설정·읽기 기록), `session`은 세션 동안(창 배치) 남긴다. */
export type StorageArea = 'local' | 'session';

/** 저장소 하나. 값은 JSON으로 넣고 꺼내며, 어떤 호출도 던지지 않는다. */
export interface VisitorStorage {
  /** 키의 값(JSON을 푼 것). 없거나 JSON이 아니면 `null`. */
  read: (key: string) => unknown;
  /** 키에 값을 JSON으로 쓴다. */
  write: (key: string, value: unknown) => void;
  /** 키를 지운다. */
  remove: (key: string) => void;
}

/** 저장소를 쓸 수 없을 때 값을 두는 곳(JSON 글자). 종류마다 따로 둔다. */
const memory: Record<StorageArea, Map<string, string>> = {
  local: new Map(),
  session: new Map(),
};

/** 브라우저 저장소. 없거나 접근이 막혔으면 `null`. */
function browserStorage(area: StorageArea): Storage | null {
  try {
    return (area === 'local' ? globalThis.localStorage : globalThis.sessionStorage) ?? null;
  } catch {
    return null;
  }
}

function getItem(area: StorageArea, key: string): string | null {
  try {
    const storage = browserStorage(area);
    if (storage) return storage.getItem(key);
  } catch {
    // 아래 메모리에서 읽는다.
  }
  return memory[area].get(key) ?? null;
}

/** 그 종류의 저장소. */
export function visitorStorage(area: StorageArea): VisitorStorage {
  return {
    read(key) {
      const text = getItem(area, key);
      if (text === null) return null;
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return null;
      }
    },
    write(key, value) {
      const text = JSON.stringify(value);
      memory[area].set(key, text);
      try {
        browserStorage(area)?.setItem(key, text);
      } catch {
        // 메모리에만 둔다.
      }
    },
    remove(key) {
      memory[area].delete(key);
      try {
        browserStorage(area)?.removeItem(key);
      } catch {
        // 메모리만 지운다.
      }
    },
  };
}
