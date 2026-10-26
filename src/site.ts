import type { Profile } from '@/design-system';

/** 사이트 전체에서 같은 값으로 쓰는 블로그 정보. */
export const SITE = {
  /** 블로그 이름. `’`는 강조색으로 그린다. */
  brand: 'scwon’s blog',
  author: '원성철',
  githubUrl: 'https://github.com/scwon',
  /** 이 블로그의 소스 저장소. */
  sourceUrl: 'https://github.com/scwon/sclog',
} as const;

/** 패널의 프로필 화면에 보이는 소개. 이름·GitHub 주소는 `SITE` 값을 가리킨다. */
export const PROFILE: Profile = {
  name: SITE.author,
  role: 'Frontend Developer',
  bio: '2017년 특성화고 학생이던 때 WhaTapLabs에 입사해 프론트엔드 개발자가 됐습니다. 랜딩 페이지로 시작해 서비스 화면과 차트를 만들어 왔습니다. 이 블로그에는 일하며 배우고 느낀 것을 적습니다.',
  photo: '/images/profile/photo.jpg',
  photoBack: '/images/profile/dot.png',
  career: ['WhaTapLabs · 2017.10~'],
  links: [
    { label: 'GitHub', url: SITE.githubUrl },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/%EC%84%B1%EC%B2%A0-%EC%9B%90-b9837821b/',
    },
    { label: 'scwon1999@gmail.com', url: 'mailto:scwon1999@gmail.com' },
  ],
};
