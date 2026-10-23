// B · Engraved Lens — 동판화 같은 가로 해칭선. 선 굵기만으로 간섭 물결을 새기고,
// 천천히 도는 렌즈(두 원의 교집합) 안에서는 반 칸 어긋난 코랄 선으로 굵기가 반전된다.
(() => {
  const { P, smooth, rectDist } = MS;
  const STEP = 6;

  MS.register({
    key: 'B',
    name: 'Engraved Lens',
    layout: 'engrave',
    note: '가로 해칭선의 굵기(밀도)만으로 그림을 만들고, 회전하는 렌즈가 그 밀도를 코랄로 반전시킨다.',
    create() {
      let w = 0;
      let h = 0;
      let gap = 9;
      let clear = null;
      let xs;
      let top;
      let bot;

      // y0 부터 gap 간격의 선을 x0..x1 구간에 굵기 함수대로 채운다 (한 번의 fill).
      function lines(ctx, x0, x1, y0, y1, thick) {
        const a = Math.max(0, x0);
        const b = Math.min(w, x1);
        if (b <= a) return;
        ctx.beginPath();
        for (let y = y0; y <= y1; y += gap) {
          let n = 0;
          for (let x = a; ; x += STEP) {
            const xx = Math.min(x, b);
            const half = thick(xx, y) / 2;
            xs[n] = xx;
            top[n] = y - half;
            bot[n] = y + half;
            n++;
            if (xx >= b) break;
          }
          ctx.moveTo(xs[0], top[0]);
          for (let k = 1; k < n; k++) ctx.lineTo(xs[k], top[k]);
          for (let k = n - 1; k >= 0; k--) ctx.lineTo(xs[k], bot[k]);
          ctx.closePath();
        }
        ctx.fill();
      }

      return {
        resize(W, H, C) {
          w = W;
          h = H;
          clear = C;
          gap = W < 700 ? 7 : 9;
          const n = Math.ceil(W / STEP) + 4;
          xs = new Float32Array(n);
          top = new Float32Array(n);
          bot = new Float32Array(n);
        },
        draw(ctx, t) {
          const mobile = w < 700;
          const r = mobile ? w * 0.4 : Math.min(w, h) * 0.34;
          const cx = w * (mobile ? 0.55 : 0.68) + Math.sin(t * 0.19) * r * 0.12;
          const cy = h * (mobile ? 0.3 : 0.42) + Math.cos(t * 0.23) * r * 0.1;
          const ang = t * 0.16;
          const d = r * (0.36 + 0.1 * Math.sin(t * 0.47));
          const dx = Math.cos(ang) * d;
          const dy = Math.sin(ang) * d;

          // 간섭 무늬의 두 근원점
          const s1x = cx + Math.cos(t * 0.31) * r * 0.7;
          const s1y = cy + Math.sin(t * 0.37) * r * 0.5;
          const s2x = cx - Math.cos(t * 0.27 + 1) * r * 0.6;
          const s2y = cy + Math.sin(t * 0.29 + 2) * r * 0.8;
          const k = (Math.PI * 2) / (gap * 6.5);
          const ring = (x, y) =>
            0.5 * Math.cos(Math.hypot(x - s1x, y - s1y) * k - t * 1.5) +
            0.5 * Math.cos(Math.hypot(x - s2x, y - s2y) * k - t * 1.1);
          const fade = (x, y) => smooth(6, 80, rectDist(x, y, clear));

          ctx.fillStyle = P.paper;
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = P.ink;
          lines(ctx, 0, w, gap / 2, h + gap, (x, y) => {
            const near = smooth(r * 3, r * 0.9, Math.hypot(x - cx, y - cy));
            return gap * (0.13 + 0.5 * near * (0.5 + 0.5 * ring(x, y))) * fade(x, y);
          });

          // 렌즈: 두 원 clip의 교집합
          const R = r + d;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.beginPath();
          ctx.arc(cx - dx, cy - dy, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = P.paper;
          ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
          ctx.fillStyle = P.coral;
          const ly = Math.max(gap, Math.ceil((cy - R) / gap) * gap);
          lines(ctx, cx - R, cx + R, ly, cy + R, (x, y) =>
            gap * (0.3 + 0.62 * (0.5 - 0.5 * ring(x, y))) * fade(x, y)
          );
          ctx.restore();
        },
      };
    },
  });
})();
