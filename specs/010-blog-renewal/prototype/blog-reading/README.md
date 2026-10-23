# Blog reading prototype

블로그 홈과 실제 글 전문을 연결한 검토용 시안. 기존 Astro 앱과 분리되어 있으며 최종 디자인·배포본이 아니다.

- `index.html`: 실제 글 한 편으로 구성한 가로형 목록
- `article.html`: 원본 글 전문, 이미지, 목차, 읽기 진행 표시
- `styles.css`: 코랄·아이보리 팔레트와 데스크톱/모바일 읽기 스타일
- `build.py`: 원본 MDX의 내용은 유지하고 제목 단계를 조정해 HTML 생성. 이미지도 원본에서 복사한다.

재생성:

```sh
uv run --with markdown python specs/010-blog-renewal/prototype/blog-reading/build.py
```

저장소 루트에서 미리보기:

```sh
python3 -m http.server 4381 --bind 127.0.0.1 --directory specs/010-blog-renewal/prototype
```

주소: http://127.0.0.1:4381/blog-reading/

미리보기 전용 글 주소는 `article.html`이다. 실제 서비스에 적용할 때는 기존 글 URL을 유지한다. 글꼴은 외부 요청 없는 시스템 글꼴을 사용하며, 최종 서체 선정은 별도다.
