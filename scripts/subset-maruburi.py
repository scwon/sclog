# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools==4.60.1", "brotli==1.1.0"]
# ///
"""마루 부리 Regular·Bold를 웹용 woff2로 서브셋해 public/fonts/에 둔다.

남기는 글자: KS X 1001 한글 2,350자, 한글 호환 자모, 기본 라틴, 문장부호.
그 밖의 글자는 font-family 폴백(시스템 명조)으로 떨어진다(스펙 "2층: CSS").
빌드에 포함하지 않는다. 글꼴을 바꿀 때만 저장소 루트에서 실행한다.

    uv run scripts/subset-maruburi.py

원본 TTF는 네이버 한글한글아름답게 배포본을 처음 실행할 때 ~/.cache/sclog-fonts에 내려받는다.
"""

import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"
CACHE = Path.home() / ".cache" / "sclog-fonts"
SOURCE = "https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-{weight}.ttf"
WEIGHTS = {"Regular": "maruburi-regular.woff2", "Bold": "maruburi-bold.woff2"}


def ks_x_1001_hangul() -> str:
    """EUC-KR 0xB0A1–0xC8FE 구역: 25행 × 94자 = 2,350자."""
    chars = (bytes([row, col]).decode("euc_kr") for row in range(0xB0, 0xC9) for col in range(0xA1, 0xFF))
    return "".join(chars)


def code_points(*ranges: tuple[int, int]) -> str:
    return "".join(chr(c) for start, end in ranges for c in range(start, end + 1))


TEXT = ks_x_1001_hangul() + code_points(
    (0x0020, 0x007E),  # 기본 라틴
    (0x00A0, 0x00BF),  # 라틴-1 문장부호·기호(© · « » 등)
    (0x00D7, 0x00D7),  # ×
    (0x00F7, 0x00F7),  # ÷
    (0x2010, 0x2027),  # 일반 문장부호(‐ – — ‘ ’ “ ” … ·)
    (0x2030, 0x203B),  # ‰ ′ ″ ‹ › ※
    (0x3001, 0x3003),  # 、 。 〃
    (0x3008, 0x3011),  # 〈 〉 《 》 「 」 『 』 【 】
    (0x3014, 0x3015),  # 〔 〕
    (0x3131, 0x3163),  # 한글 호환 자모
)


def fetch(weight: str) -> Path:
    target = CACHE / f"MaruBuri-{weight}.ttf"
    if not target.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(SOURCE.format(weight=weight)) as response:
            target.write_bytes(response.read())
    return target


def build(weight: str, out: str) -> None:
    font = TTFont(fetch(weight))
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=TEXT)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(OUT / out)
    print(f"{out}: {(OUT / out).stat().st_size:,} B, {len(font.getBestCmap()):,} 글자")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    hangul = ks_x_1001_hangul()
    assert len(hangul) == 2350, len(hangul)
    for weight, out in WEIGHTS.items():
        build(weight, out)
