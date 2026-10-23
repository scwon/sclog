// 시안 모듈 공용 레지스트리와 작은 수학 헬퍼.
// 각 시안은 MS.register({ key, name, layout, note, create }) 로 등록하고,
// create()는 { resize(w, h, clear), draw(ctx, t) } 를 돌려준다.
// t 는 "재생 중이었던 시간(초)"만 누적한 값이라 일시정지/재개 시 튀지 않는다.
window.MS = {
  P: {
    paper: '#FAF8F5',
    coral: '#E9AC9F',
    coralDeep: '#D48B7B',
    coralPale: '#F4D7CF',
    ink: '#242424',
    mute: '#66615D',
  },
  variants: {},
  register(v) {
    this.variants[v.key] = v;
  },
  smooth(e0, e1, x) {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  },
  // 점에서 사각형(제목 영역)까지의 거리. 안쪽이면 0.
  rectDist(x, y, r) {
    if (!r) return 1e4;
    const dx = Math.max(r.x - x, 0, x - r.x - r.w);
    const dy = Math.max(r.y - y, 0, y - r.y - r.h);
    return Math.hypot(dx, dy);
  },
  mod(n, m) {
    return ((n % m) + m) % m;
  },
};
