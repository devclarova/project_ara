/**
 * 사용자 프로필 이미지 렌더링 엔진(User Profile Image Rendering Engine):
 * - 목적(Why): 서비스 전반에서 사용자 식별을 위한 시각적 요소를 일관되게 제공하고 브랜드 정체성을 유지함
 * - 방법(How): 이미지 로드 실패 시 결정론적 알고리즘 기반의 SVG 폴백(DiceBear)을 적용하여 시각적 결함을 방지하고 레이아웃 안정성을 확보함
 */
import React from 'react';
interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

const Avatar = ({ src, alt = 'user avatar', size = 40, className = '' }: AvatarProps) => {
  const fallback = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4';
  return (
    <img
      src={src || fallback}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      onError={e => {
        // Error Recovery: Replaces invalid image sources with a deterministic SVG fallback to maintain visual integrity.
        (e.target as HTMLImageElement).src = fallback;
      }}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
