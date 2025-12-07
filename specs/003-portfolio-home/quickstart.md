# Quickstart: 포트폴리오 홈페이지

**Feature**: 003-portfolio-home
**Date**: 2025-12-07

## 개요

SCLOG 홈페이지를 포트폴리오 페이지로 확장합니다. 프로필, 소셜 링크, 경력, 최근 글 섹션을 포함합니다.

## 사전 준비

1. 프로필 이미지 준비
   - 파일: `public/images/profile.jpg`
   - 권장 크기: 200x200px 이상 (정사각형)

2. 개인 정보 준비
   - 이름, 한 줄 소개, 자기소개 문구
   - 소셜 링크 URL (GitHub, LinkedIn, Instagram)
   - 이메일 주소
   - 경력 정보

## 설정 방법

### 1. 프로필 데이터 수정

`src/data/profile.ts` 파일에서 개인 정보를 수정합니다:

```typescript
export const profile: Profile = {
  name: '홍길동',           // 본인 이름
  tagline: 'Frontend Developer',  // 한 줄 소개
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
    endDate: null,  // 현재 재직 중
    description: '웹 애플리케이션 개발',
  },
];
```

### 2. 프로필 이미지 추가

```bash
# 이미지 파일을 public/images/ 디렉토리에 복사
cp /path/to/your/photo.jpg public/images/profile.jpg
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:4321` 접속하여 확인합니다.

## 커스터마이징

### 소셜 링크 추가/제거

`socialLinks` 배열에서 항목을 추가하거나 제거합니다. 사용하지 않는 플랫폼은 배열에서 제거하면 아이콘이 표시되지 않습니다.

### 경력 순서

`careers` 배열은 표시 순서대로 정렬합니다. 최신 경력을 배열 앞에 배치하세요.

### 테마 확인

라이트/다크 모드 전환 시 모든 섹션이 올바르게 표시되는지 확인합니다.

## 검증 체크리스트

- [ ] 프로필 이미지가 올바르게 표시됨
- [ ] 이름, 한 줄 소개가 표시됨
- [ ] 소셜 링크 클릭 시 새 탭에서 열림
- [ ] 이메일 클릭 시 메일 클라이언트 열림
- [ ] 경력 정보가 시간순으로 표시됨
- [ ] 최근 글이 표시됨 (글이 있는 경우)
- [ ] 모바일에서 레이아웃이 깨지지 않음
- [ ] 라이트/다크 테마 모두 정상 동작

## 문제 해결

### 이미지가 표시되지 않음

- `public/images/profile.jpg` 경로 확인
- 파일 확장자 확인 (jpg, png, webp 지원)

### 타입 에러 발생

```bash
pnpm astro check
```

실행하여 타입 에러 확인 및 수정
