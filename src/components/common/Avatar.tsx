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
        // 이미지 깨질 경우 fallback 적용
        (e.target as HTMLImageElement).src = fallback;
      }}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
