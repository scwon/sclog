/**
 * 프로필 데이터 타입 정의
 * @module data/types
 */

/** 블로그 주인의 기본 정보 */
export interface Profile {
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

/** 외부 플랫폼 연결 정보 */
export interface SocialLink {
  /** 플랫폼 식별자 */
  platform: 'github' | 'linkedin' | 'instagram';
  /** 프로필 URL */
  url: string;
  /** 접근성을 위한 레이블 */
  label: string;
}

/** 경력/이력 정보 */
export interface Career {
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
