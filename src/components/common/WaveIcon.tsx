import React from 'react';

interface WaveIconProps {
  size?: number;
  className?: string;
}

export default function WaveIcon({ size = 16, className = '' }: WaveIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M1 8C2.5 8 2.5 5 4.5 5C6.5 5 6.5 11 8.5 11C10.5 11 10.5 5 12.5 5C13.5 5 14 6.5 15 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
