/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /**
     * 글 화면의 장 주소 대상: 개요에 오른 장·절 제목의 id → 제목 글자. 글 페이지(`blog/[slug].astro`)가
     * 본문을 그리기 전에 채우고, 본문 제목 컴포넌트(`headings/Heading.astro`)가 복사 버튼을 넣을지 정할 때 읽는다.
     */
    chapterLinks?: Map<string, string>;
  }
}
