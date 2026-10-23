// A · Warp & Weft — 코랄 날실과 잉크 씨실이 실제 평직(over/under)으로 엮인 직물.
// 두 실의 굵기는 같은 파동장에서 서로 반대로 변해서, 교차점마다 무게가 넘어가며 무늬가 흐른다.
(() => {
  const { P, mod } = MS;

  const field = (x, y, t) =>
    0.6 * Math.sin(x * 0.0062 + y * 0.0041 - t * 0.85) +
    0.4 * Math.sin(-x * 0.0034 + y * 0.0072 + t * 0.55 + 1.2 * Math.sin(t * 0.21));

  MS.register({
    key: 'A',
    name: 'Warp & Weft',
    layout: 'weave',
    note: '날실·씨실이 위아래로 엮이고, 굵기 파동이 직조 무늬 자체를 변형한다.',
    create() {
      let w = 0;
      let h = 0;
      let p = 56;
      const gap = 3;

      // 굵기가 길이 방향으로 변하는 실 하나를 Path2D로.
      function strip(vertical, pos, t) {
        const path = new Path2D();
        const len = vertical ? h : w;
        const half = [];
        for (let s = -12; s <= len + 12; s += 12) {
          const f = vertical ? field(pos, s, t) : field(s, pos, t);
          half.push(s, (p * (vertical ? 0.5 + 0.34 * f : 0.5 - 0.34 * f)) / 2);
        }
        for (let k = 0; k < half.length; k += 2) {
          if (vertical) path.lineTo(pos - half[k + 1], half[k]);
          else path.lineTo(half[k], pos - half[k + 1]);
        }
        for (let k = half.length - 2; k >= 0; k -= 2) {
          if (vertical) path.lineTo(pos + half[k + 1], half[k]);
          else path.lineTo(half[k], pos + half[k + 1]);
        }
        path.closePath();
        return path;
      }

      return {
        resize(W, H) {
          w = W;
          h = H;
          p = Math.max(38, Math.min(64, Math.min(W, H) / 9));
        },
        draw(ctx, t) {
          ctx.fillStyle = P.paper;
          ctx.fillRect(0, 0, w, h);

          const ox = t * 16;
          const oy = -t * 11;
          const i0 = Math.floor(-ox / p) - 1;
          const i1 = Math.ceil((w - ox) / p);
          const j0 = Math.floor(-oy / p) - 1;
          const j1 = Math.ceil((h - oy) / p);

          ctx.lineWidth = gap * 2;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = P.paper;

          // 1) 씨실 바탕
          const wefts = [];
          for (let j = j0; j <= j1; j++) {
            const y = j * p + oy + p / 2;
            const wf = { j, y, path: strip(false, y, t), color: mod(j, 4) === 1 ? P.mute : P.ink };
            ctx.fillStyle = wf.color;
            ctx.fill(wf.path);
            wefts.push(wf);
          }

          // 2) 날실을 올리고, 씨실이 위로 오는 교차점만 다시 덮는다
          for (let i = i0; i <= i1; i++) {
            const x = i * p + ox + p / 2;
            const path = strip(true, x, t);
            ctx.stroke(path);
            ctx.fillStyle = mod(i, 5) === 2 ? P.coralDeep : P.coral;
            ctx.fill(path);

            for (const wf of wefts) {
              if (mod(i + wf.j, 2)) continue;
              ctx.save();
              ctx.beginPath();
              ctx.rect(x - p / 2, wf.y - p / 2, p, p);
              ctx.clip();
              ctx.stroke(wf.path);
              ctx.fillStyle = wf.color;
              ctx.fill(wf.path);
              ctx.restore();
            }
          }
        },
      };
    },
  });
})();
