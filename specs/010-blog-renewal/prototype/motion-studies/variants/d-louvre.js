// D · Louvre Light — 아치 창에 달린 회전 루버(앞면 코랄, 뒷면 종이, 옆면 짙은 코랄).
// 같은 루버를 바닥 평면으로 사영(affine)해 다시 그려서, 창 밖 빛 그림자가 함께 움직인다.
(() => {
  const { P } = MS;
  const FLOOR_LIGHT = '#8F6C64';
  const WELL = '#171717';

  MS.register({
    key: 'D',
    name: 'Louvre Light',
    layout: 'louvre',
    note: '아치 창의 회전 루버와 바닥에 비친 빛 그림자가 같은 각도로 연동되는 건축적 실루엣.',
    create() {
      let w = 0;
      let h = 0;
      let g = null;

      // shadow=true 이면 바닥 좌표계에서 루버가 빛을 가리는 부분만 잉크로 칠한다.
      function slats(ctx, t, shadow) {
        const { T, B, x0, archW, rows, cols } = g;
        const rh = (B - T) / rows;
        const tw = archW / cols;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const phi = t * 0.8 - i * 0.32 - j * 0.9 + 0.6 * Math.sin(t * 0.31 + i * 0.18);
            const c = Math.cos(phi);
            const s = Math.sin(phi);
            const cy = T + (i + 0.5) * rh;
            const hh = rh * 0.96 * Math.abs(c);
            const x = x0 + j * tw + 1;
            const ww = tw - 2;
            if (shadow) {
              ctx.fillStyle = P.ink;
              ctx.fillRect(x - 1, cy - hh / 2, ww + 2, hh);
              continue;
            }
            ctx.fillStyle = c > 0 ? P.coral : P.paper;
            ctx.fillRect(x, cy - hh / 2, ww, hh);
            const e = rh * 0.22 * Math.abs(s);
            ctx.fillStyle = P.coralDeep;
            ctx.fillRect(x, s > 0 ? cy + hh / 2 : cy - hh / 2 - e, ww, e);
          }
        }
      }

      return {
        resize(W, H) {
          w = W;
          h = H;
          const T = h * 0.03;
          const archH = h * 0.64;
          const B = T + archH;
          const archW = Math.min(archH * 0.7, w * 0.62);
          const sh = Math.max(0, Math.min(archW * 0.75, w - archW - 8));
          const x0 = (w - archW - sh) / 2;
          const r = archW / 2;
          const arch = new Path2D();
          arch.moveTo(x0, B);
          arch.lineTo(x0, T + r);
          arch.arc(x0 + r, T + r, r, Math.PI, 0);
          arch.lineTo(x0 + archW, B);
          arch.closePath();
          g = {
            T, B, x0, archW, arch,
            rows: Math.max(10, Math.round(archH / 30)),
            cols: 3,
            kx: sh / archH,
            sy: (h - B - h * 0.04) / archH,
            yf: B + h * 0.015,
          };
        },
        draw(ctx, t) {
          const { B, x0, archW, arch, kx, sy, yf } = g;
          ctx.fillStyle = P.ink;
          ctx.fillRect(0, 0, w, h);

          // 바닥: 창 좌표 (x, y) → (x + (B-y)·kx, yf + (B-y)·sy)
          ctx.save();
          ctx.transform(1, 0, -kx, -sy, kx * B, yf + sy * B);
          ctx.clip(arch);
          ctx.fillStyle = FLOOR_LIGHT;
          ctx.fill(arch);
          slats(ctx, t, true);
          ctx.restore();

          // 창틀 아래 문턱
          ctx.fillStyle = P.paper;
          ctx.fillRect(x0 - 8, B, archW + 16, Math.max(3, h * 0.006));

          ctx.save();
          ctx.clip(arch);
          ctx.fillStyle = WELL;
          ctx.fill(arch);
          slats(ctx, t, false);
          ctx.restore();

          ctx.lineWidth = 3;
          ctx.strokeStyle = P.coral;
          ctx.stroke(arch);
        },
      };
    },
  });
})();
