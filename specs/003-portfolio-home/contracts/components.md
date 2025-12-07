# Component Contracts: 포트폴리오 홈페이지

**Feature**: 003-portfolio-home
**Date**: 2025-12-07

## ProfileSection.astro

프로필 정보를 표시하는 섹션 컴포넌트

### Props

```typescript
interface Props {
  /** 프로필 데이터 */
  profile: Profile;
}
```

### Rendered Structure

```html
<section class="profile-section">
  <div class="profile-avatar">
    <img src={avatar} alt={name} />
  </div>
  <h1 class="profile-name">{name}</h1>
  <p class="profile-tagline">{tagline}</p>
  <p class="profile-bio">{bio}</p>
</section>
```

### Accessibility

- `<img>` 태그에 alt 텍스트 (이름)
- 시맨틱 `<section>` 사용

---

## SocialLinks.astro

소셜 링크 아이콘 목록

### Props

```typescript
interface Props {
  /** 소셜 링크 배열 */
  links: SocialLink[];
  /** 이메일 주소 (mailto 링크용) */
  email: string;
}
```

### Rendered Structure

```html
<nav class="social-links" aria-label="소셜 미디어 링크">
  {links.map(link => (
    <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
      <svg><!-- platform icon --></svg>
    </a>
  ))}
  <a href={`mailto:${email}`} aria-label="이메일 보내기">
    <svg><!-- email icon --></svg>
  </a>
</nav>
```

### Accessibility

- `aria-label` on `<nav>`
- 각 링크에 `aria-label`
- `target="_blank"`에 `rel="noopener noreferrer"`

---

## CareerSection.astro

경력 타임라인 섹션

### Props

```typescript
interface Props {
  /** 경력 배열 (최신순) */
  careers: Career[];
}
```

### Rendered Structure

```html
<section class="career-section">
  <h2>경력</h2>
  <ul class="career-timeline">
    {careers.map(career => (
      <li class="career-item">
        <span class="career-period">{startDate} - {endDate || '현재'}</span>
        <h3 class="career-company">{company}</h3>
        <p class="career-role">{role}</p>
        {description && <p class="career-description">{description}</p>}
      </li>
    ))}
  </ul>
</section>
```

### Accessibility

- 시맨틱 `<ul>/<li>` 사용
- 제목 계층 구조 준수

---

## RecentPosts.astro

최근 글 목록 섹션 (기존 index.astro 로직 추출)

### Props

```typescript
interface Props {
  /** 최근 글 배열 (최대 5개) */
  posts: BlogPost[];
  /** 전체 글 수 (모든 글 보기 링크 표시 여부) */
  totalCount: number;
}
```

### Rendered Structure

```html
<section class="recent-posts">
  <h2>최근 글</h2>
  {posts.length === 0 ? (
    <p class="no-posts">아직 작성된 글이 없습니다.</p>
  ) : (
    <div class="posts-grid">
      {posts.map(post => <BlogCard post={post} />)}
    </div>
  )}
  {totalCount > 5 && (
    <div class="view-all">
      <a href="/blog">모든 글 보기 →</a>
    </div>
  )}
</section>
```

### Accessibility

- 시맨틱 `<section>` 사용
- 제목 계층 구조 준수
