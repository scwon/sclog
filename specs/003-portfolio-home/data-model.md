# Data Model: 포트폴리오 홈페이지

**Feature**: 003-portfolio-home
**Date**: 2025-12-07

## Entities

### Profile

블로그 주인의 기본 정보

```typescript
interface Profile {
  /** 이름 */
  name: string;
  /** 한 줄 소개 (역할/직함) */
  tagline: string;
  /** 자기소개 문구 (2-3문장) */
  bio: string;
  /** 프로필 이미지 경로 (/images/profile.jpg) */
  avatar: string;
  /** 이메일 주소 */
  email: string;
}
```

### SocialLink

외부 플랫폼 연결 정보

```typescript
interface SocialLink {
  /** 플랫폼 식별자 */
  platform: 'github' | 'linkedin' | 'instagram';
  /** 프로필 URL */
  url: string;
  /** 접근성을 위한 레이블 */
  label: string;
}
```

### Career

경력/이력 정보

```typescript
interface Career {
  /** 회사/조직명 */
  company: string;
  /** 직책/역할 */
  role: string;
  /** 시작 날짜 (YYYY-MM 형식) */
  startDate: string;
  /** 종료 날짜 (YYYY-MM 형식, 현재 재직 중이면 null) */
  endDate: string | null;
  /** 간단한 설명 (선택) */
  description?: string;
}
```

### BlogPost (기존)

기존 MDX 콘텐츠 시스템 활용 - 변경 없음

```typescript
// src/content/config.ts에 정의된 스키마 사용
interface BlogPostData {
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  draft?: boolean;
}
```

## Data File Structure

`src/data/profile.ts`:

```typescript
import type { Profile, SocialLink, Career } from './types';

export const profile: Profile = {
  name: '홍길동',
  tagline: 'Frontend Developer',
  bio: '프론트엔드 개발자로서의 경험과 인사이트를 공유합니다.',
  avatar: '/images/profile.jpg',
  email: 'hello@example.com',
};

export const socialLinks: SocialLink[] = [
  { platform: 'github', url: 'https://github.com/username', label: 'GitHub' },
  { platform: 'linkedin', url: 'https://linkedin.com/in/username', label: 'LinkedIn' },
  { platform: 'instagram', url: 'https://instagram.com/username', label: 'Instagram' },
];

export const careers: Career[] = [
  {
    company: 'Company A',
    role: 'Frontend Developer',
    startDate: '2022-01',
    endDate: null,
    description: '웹 애플리케이션 개발',
  },
  {
    company: 'Company B',
    role: 'Junior Developer',
    startDate: '2020-03',
    endDate: '2021-12',
  },
];
```

## Relationships

```text
Profile (1) ──── (N) SocialLink
    │
    └──── (N) Career

BlogPost (기존, 변경 없음)
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| Profile | name | 필수, 비어있지 않음 |
| Profile | email | 필수, 이메일 형식 |
| Profile | avatar | 필수, /images/ 경로 |
| SocialLink | url | 필수, https:// 시작 |
| SocialLink | platform | 열거형 값만 허용 |
| Career | startDate | 필수, YYYY-MM 형식 |
| Career | endDate | null 허용 (현재 재직 중) |
