# Blog prototype — Opus

홈과 실제 글 전문을 연결한 검토용 재디자인 시안. 기존 Astro 앱과 분리되어 있으며 최종 디자인·배포본이 아니다. 비교용 이전 시안은 `../blog-reading/`에 그대로 둔다.

- `index.html`: 전체 화면 IDE의 `posts.log` 탭. 에디터 1번 줄 블로그 이름, 글 로그 레일, 장 흐름도
- `article.html`: 같은 IDE에서 연 글 파일. frontmatter, 문단 줄 번호, 탐색기 아래 개요, 미니맵, 상태줄
- `cards.html` · `finder.html` · `article-classic.html`: 비교용 이전안(카드 목록, 터미널 파일 관리자, 아이보리 글 상세)
- `styles.css`: 글꼴·기본 토큰·본문 타이포그래피, 이전안 스타일
- `ide.css`: IDE 틀(제목 표시줄·활동 막대·탐색기·탭·경로·출력 패널·상태줄), 어두운/밝은 테마 토큰
- `app.js`: 페이지 모듈(읽기 상태, 흐름 접기, 미니맵)과 IDE 틀(탐색기, 테마, 탭, 출력 로그, 클라이언트 라우터)
- `build.py`: 원본 MDX를 바꾸지 않고 읽어 모든 페이지를 완성된 HTML로 만들고(SSR 결과물에 해당), 이미지 복사와 글꼴 서브셋을 수행한다.
- `fonts/`: 페이지에 쓰인 글자만 남긴 woff2. 외부 요청 없이 동작한다.

## 화면 이동

각 주소는 완성된 HTML이라 바로 열어도 전체 화면이 나온다. 링크를 누르면 `app.js`가 다음 페이지를 받아 에디터 본문·경로·개요·상태줄만 바꾸고, 제목 표시줄·탐색기·출력 패널은 그대로 둔다. 주소와 뒤로가기는 history API로 유지한다. 파일을 열 때마다 상태줄에 한 줄 요약이 잠깐 나타나고 에디터 내용은 위에서부터 펼쳐진다. 실제 파일 정보(frontmatter 키, 장·절 수, 이미지 크기, 용량, 읽는 시간)의 전체 기록은 상태줄 `출력`으로 연다. Astro로 옮길 때는 `<ClientRouter />`와 IDE 틀의 `transition:persist`가 같은 역할을 한다.

재생성(저장소 루트에서):

```sh
uv run --with markdown --with fonttools --with brotli python specs/010-blog-renewal/prototype/blog-opus/build.py
```

원본 글꼴은 처음 실행할 때 `~/.cache/sclog-prototype-fonts`로 내려받는다.

미리보기(저장소 루트에서):

```sh
python3 -m http.server 4381 --bind 127.0.0.1 --directory specs/010-blog-renewal/prototype
```

주소: http://127.0.0.1:4381/blog-opus/

## 글꼴과 라이선스

| 용도 | 글꼴 | 라이선스 · 출처 |
| --- | --- | --- |
| 블로그 이름, 날짜·숫자 | Bricolage Grotesque | SIL OFL 1.1 · google/fonts (`fonts/Bricolage-OFL.txt`) |
| 제목, 메뉴, 메타 정보 | Pretendard Variable 1.3.9 | SIL OFL 1.1 · github.com/orioncactus/pretendard |
| 본문 | 마루 부리 Regular·Bold | SIL OFL 1.1 · hangeul.naver.com (네이버) |
| 파일 이름·줄 번호·날짜·상태줄 | JetBrains Mono | SIL OFL 1.1 · google/fonts (`fonts/JetBrainsMono-OFL.txt`) |

미리보기 전용 글 주소는 `article.html`이다. 실제 서비스에 적용할 때는 기존 글 URL을 유지한다.
