// C · Type Case — 활자 케이스처럼 칸마다 s·c·w·o·n 한 글자.
// 줄마다 다른 속도로 미끄러지고, 대각선 파동이 글자 크기(칸 밖으로 잘림)와
// 아래에서 차오르는 코랄 / 위에서 내려오는 잉크 채움을 동시에 움직인다.
(() => {
  const { P, smooth, mod } = MS;
  const GLYPHS = ['s', 'c', 'w', 'o', 'n'];

  MS.register({
    key: 'C',
    name: 'Type Case',
    layout: 'glyph',
    note: '활자 칸 격자의 줄 이동·글자 크기·칸 채움이 하나의 파동으로 묶여 타이포 조직을 만든다.',
    create() {
      let w = 0;
      let h = 0;
      let cell = 96;
      let font = '';

      return {
        resize(W, H) {
          w = W;
          h = H;
          cell = W < 700 ? W / 5.5 : Math.max(84, W / 13);
          font = `900 ${Math.round(cell * 0.92)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
        },
        draw(ctx, t) {
          ctx.fillStyle = P.paper;
          ctx.fillRect(0, 0, w, h);
          ctx.font = font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          const base = cell * 0.25; // 소문자 x-height 중앙 보정

          const rows = Math.ceil(h / cell);
          for (let r = 0; r < rows; r++) {
            const speed = (r % 2 ? 1 : -1) * (14 + (r % 3) * 9);
            const off = t * speed;
            const y = r * cell;
            const cy = y + cell / 2;

            for (let i = Math.floor(-off / cell) - 1; i * cell + off < w; i++) {
              const x = i * cell + off;
              const cx = x + cell / 2;
              const wave = Math.sin(cx * 0.0042 - cy * 0.0061 - t * 0.9 + Math.sin(t * 0.3 + r) * 0.6);
              const coral = smooth(0.05, 0.75, wave);
              const ink = smooth(-0.55, -0.95, wave);
              const scale = 0.55 + 0.8 * (0.5 + 0.5 * wave);
              const g = GLYPHS[mod(i + r * 2, 5)];

              ctx.save();
              ctx.beginPath();
              ctx.rect(x + 1, y + 1, cell - 2, cell - 2);
              ctx.clip();

              if (coral > 0) {
                ctx.fillStyle = P.coral;
                ctx.fillRect(x, y + cell * (1 - coral), cell, cell * coral);
              }
              ctx.fillStyle = P.ink;
              ctx.translate(cx, cy);
              ctx.scale(scale, scale);
              ctx.fillText(g, 0, base);
              ctx.restore();

              if (ink > 0) {
                // 위에서 내려오는 잉크 채움 안에서는 같은 글자를 종이색으로 반전
                ctx.save();
                ctx.beginPath();
                ctx.rect(x + 1, y + 1, cell - 2, (cell - 2) * ink);
                ctx.clip();
                ctx.fillStyle = P.ink;
                ctx.fillRect(x, y, cell, cell);
                ctx.fillStyle = P.paper;
                ctx.translate(cx, cy);
                ctx.scale(scale, scale);
                ctx.fillText(g, 0, base);
                ctx.restore();
              }
            }
          }
        },
      };
    },
  });
})();
