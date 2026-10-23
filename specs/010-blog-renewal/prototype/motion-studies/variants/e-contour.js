// E · Contour Island — 흐르는 높이장을 marching squares로 등고선/색면으로 그린 지도.
// 제목 주변은 깊게 파인 종이색 분지라서 등고선이 해안선처럼 제목을 감싸며 흐른다.
(() => {
  const { P, smooth, rectDist } = MS;
  const FILLS = [
    [-0.25, P.coralPale],
    [0.3, P.coral],
    [0.95, P.ink],
  ];

  MS.register({
    key: 'E',
    name: 'Contour Island',
    layout: 'contour',
    note: '등고선 지도의 색면과 선이 함께 흐르고, 제목은 그 지형 한가운데의 비워진 분지가 된다.',
    create() {
      let w = 0;
      let h = 0;
      let cs = 13;
      let cols = 0;
      let rows = 0;
      let k = 1;
      let v = null;
      let mask = null;
      let ticks = [];
      const cx = new Float32Array(4);
      const cy = new Float32Array(4);
      const cv = new Float32Array(4);
      const px = new Float32Array(4);
      const py = new Float32Array(4);

      function loadCell(r, c) {
        const i = r * cols + c;
        const x = c * cs;
        const y = r * cs;
        cx[0] = x; cy[0] = y; cv[0] = v[i];
        cx[1] = x + cs; cy[1] = y; cv[1] = v[i + 1];
        cx[2] = x + cs; cy[2] = y + cs; cv[2] = v[i + cols + 1];
        cx[3] = x; cy[3] = y + cs; cv[3] = v[i + cols];
      }

      // 값 >= L 인 영역을 한 경로로 모아 한 번에 칠한다(셀 사이 이음새 없음).
      function fillLevel(ctx, L) {
        ctx.beginPath();
        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            loadCell(r, c);
            const n = (cv[0] >= L) + (cv[1] >= L) + (cv[2] >= L) + (cv[3] >= L);
            if (n === 0) continue;
            if (n === 4) {
              ctx.rect(cx[0], cy[0], cs, cs);
              continue;
            }
            let first = true;
            for (let q = 0; q < 4; q++) {
              const b = (q + 1) & 3;
              const inA = cv[q] >= L;
              if (inA) {
                first ? ctx.moveTo(cx[q], cy[q]) : ctx.lineTo(cx[q], cy[q]);
                first = false;
              }
              if (inA !== cv[b] >= L) {
                const f = (L - cv[q]) / (cv[b] - cv[q]);
                const ex = cx[q] + (cx[b] - cx[q]) * f;
                const ey = cy[q] + (cy[b] - cy[q]) * f;
                first ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
                first = false;
              }
            }
            ctx.closePath();
          }
        }
        ctx.fill();
      }

      function lineLevel(ctx, L) {
        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            loadCell(r, c);
            let m = 0;
            for (let q = 0; q < 4; q++) {
              const b = (q + 1) & 3;
              if (cv[q] >= L !== cv[b] >= L) {
                const f = (L - cv[q]) / (cv[b] - cv[q]);
                px[m] = cx[q] + (cx[b] - cx[q]) * f;
                py[m] = cy[q] + (cy[b] - cy[q]) * f;
                m++;
              }
            }
            if (m >= 2) {
              ctx.moveTo(px[0], py[0]);
              ctx.lineTo(px[1], py[1]);
            }
            if (m === 4) {
              ctx.moveTo(px[2], py[2]);
              ctx.lineTo(px[3], py[3]);
            }
          }
        }
      }

      return {
        resize(W, H, C) {
          w = W;
          h = H;
          cs = W < 700 ? 10 : 13;
          k = 1440 / Math.max(W, H, 600);
          cols = Math.ceil(W / cs) + 1;
          rows = Math.ceil(H / cs) + 1;
          v = new Float32Array(cols * rows);
          mask = new Float32Array(cols * rows);
          const reach = Math.min(W, H) * 0.22;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              mask[r * cols + c] = smooth(14, reach, rectDist(c * cs, r * cs, C));
            }
          }
          ticks = [];
          const tg = W < 700 ? 78 : 104;
          for (let y = tg / 2; y < H; y += tg) {
            for (let x = tg / 2; x < W; x += tg) {
              if (rectDist(x, y, C) > reach * 0.8) ticks.push(x, y);
            }
          }
        },
        draw(ctx, t) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const i = r * cols + c;
              const x = c * cs * k;
              const y = r * cs * k;
              const n =
                0.55 * Math.sin(x * 0.0052 + t * 0.23 + 1.6 * Math.sin(y * 0.0041 - t * 0.17)) +
                0.45 * Math.sin(y * 0.0066 - t * 0.19 + 1.9 * Math.sin(x * 0.0045 + t * 0.13)) +
                0.3 * Math.sin((x - y) * 0.0029 + t * 0.11);
              v[i] = n * mask[i] - 1.6 * (1 - mask[i]);
            }
          }

          ctx.fillStyle = P.paper;
          ctx.fillRect(0, 0, w, h);
          for (const [L, color] of FILLS) {
            ctx.fillStyle = color;
            fillLevel(ctx, L);
          }

          ctx.lineWidth = 1;
          ctx.strokeStyle = P.mute;
          ctx.beginPath();
          for (let L = -1.35; L < 1.4; L += 0.18) lineLevel(ctx, L);
          ctx.stroke();

          // 지도 좌표 십자 표식(고정) — 흐르는 지형의 기준점
          ctx.fillStyle = P.ink;
          for (let q = 0; q < ticks.length; q += 2) {
            ctx.fillRect(ticks[q] - 4, ticks[q + 1] - 0.5, 8, 1);
            ctx.fillRect(ticks[q] - 0.5, ticks[q + 1] - 4, 1, 8);
          }
        },
      };
    },
  });
})();
