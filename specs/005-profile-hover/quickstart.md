# Quickstart: 프로필 사진 Hover 애니메이션

**Feature**: 005-profile-hover
**Date**: 2025-12-07

## 구현 개요

ProfileSection.astro 컴포넌트를 수정하여 프로필 사진 hover 시 회전 애니메이션과 이미지 전환 효과를 추가한다.

## 파일 수정 목록

| 파일 | 작업 |
|------|------|
| `src/components/ProfileSection.astro` | hover 애니메이션 + 이미지 전환 구현 |
| `src/data/profile.ts` | alternateAvatar 필드 추가 (선택) |

## 구현 단계

### 1. HTML 구조 수정

```astro
<div class="profile-avatar">
  <img
    class="avatar-default"
    src={profile.avatar}
    alt={`${profile.name} 프로필 사진`}
  />
  <img
    class="avatar-alternate"
    src="/images/scwon_dot.png"
    alt=""
    aria-hidden="true"
  />
</div>
```

### 2. CSS 스타일 추가

```css
.profile-avatar {
  position: relative;
  cursor: pointer;
}

.avatar-default,
.avatar-alternate {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.avatar-alternate {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
}

/* Hover 효과 */
.profile-avatar:hover .avatar-default,
.profile-avatar.active .avatar-default {
  opacity: 0;
  transform: rotate(360deg);
}

.profile-avatar:hover .avatar-alternate,
.profile-avatar.active .avatar-alternate {
  opacity: 1;
  transform: rotate(360deg);
}

/* 접근성: 동작 감소 설정 존중 */
@media (prefers-reduced-motion: reduce) {
  .avatar-default,
  .avatar-alternate {
    transition: opacity 0.1s ease;
  }

  .profile-avatar:hover .avatar-default,
  .profile-avatar.active .avatar-default,
  .profile-avatar:hover .avatar-alternate,
  .profile-avatar.active .avatar-alternate {
    transform: none;
  }
}
```

### 3. JavaScript 터치 대응

```astro
<script>
  function initProfileHover() {
    const avatar = document.querySelector('.profile-avatar');
    if (!avatar) return;

    // 터치 기기 대응
    avatar.addEventListener('touchstart', (e) => {
      e.preventDefault();
      avatar.classList.toggle('active');
    });

    // 다른 곳 탭 시 상태 해제
    document.addEventListener('touchstart', (e) => {
      if (!avatar.contains(e.target as Node)) {
        avatar.classList.remove('active');
      }
    });
  }

  // Astro View Transitions 대응
  document.addEventListener('astro:page-load', initProfileHover);
</script>
```

### 4. 이미지 프리로드 (선택)

BaseLayout.astro의 `<head>`에 추가:

```html
<link rel="preload" href="/images/scwon_dot.png" as="image" />
```

## 테스트 체크리스트

- [ ] 데스크톱: hover 시 360도 회전 + 이미지 전환
- [ ] 데스크톱: hover 해제 시 역방향 회전 + 원래 이미지
- [ ] 모바일: 탭 시 애니메이션 동작
- [ ] 모바일: 다른 곳 탭 시 원래 상태 복귀
- [ ] prefers-reduced-motion: 회전 없이 이미지만 전환
- [ ] JS 비활성화: CSS hover만으로 동작

## 예상 소요 시간

총 1-2시간:
- HTML/CSS 수정: 30분
- JavaScript 터치 대응: 30분
- 테스트 및 미세 조정: 30-60분
