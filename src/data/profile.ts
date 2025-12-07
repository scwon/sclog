/**
 * 프로필 및 경력 데이터
 * @module data/profile
 */

import type { Profile, SocialLink, Career } from "./types";

/** 블로그 주인의 프로필 정보 */
export const profile: Profile = {
  name: "원성철",
  tagline: "Frontend Developer",
  bio: "프론트엔드 개발자 원성철입니다.",
  avatar: "/images/scwon_pt.jpg",
  email: "scwon1999@gmail.com",
};

/** 소셜 미디어 링크 목록 */
export const socialLinks: SocialLink[] = [
  { platform: "github", url: "https://github.com/scwon", label: "GitHub" },
  {
    platform: "linkedin",
    url: "https://www.linkedin.com/in/%EC%84%B1%EC%B2%A0-%EC%9B%90-b9837821b/",
    label: "LinkedIn",
  },
];

/** 경력 정보 (최신순) */
export const careers: Career[] = [
  {
    company: "WhaTapLabs",
    role: "Frontend Developer",
    startDate: "2017.10",
    endDate: null,
    description: "웹 애플리케이션 개발",
  },
];
