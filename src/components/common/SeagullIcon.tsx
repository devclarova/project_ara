import React from 'react';
import { motion } from 'framer-motion';

interface SeagullIconProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
}

/**
 * 브랜드 아이덴티티 기반 프리미엄 갈매기 아이콘(Premium Brand Identity Seagull Icon):
 * - 목적(Why): 서비스의 고유한 브랜드 가치와 활기찬 소통 시스템을 시각적으로 상징하는 통합 그래픽 에셋을 제공함
 * - 방법(How): 고해상도 벡터 경로(SVG Path)와 Framer Motion의 애니메이션 컨트롤을 결합하여 성능 저하 없는 유려한 비행 모션을 구현함
 */
const SeagullIcon: React.FC<SeagullIconProps> = ({ 
  size = 24, 
  className = "",
  isAnimated = true
}) => {
  // Graphic Normalization: Defines high-fidelity vector silhouettes to ensure crisp rendering across high-DPI environments.
  // 가시성 확보 및 작은 스케일에서의 외곽선 무결성을 위해 최적화된 경로(Path) 사용
  const premiumPath = "M23 10c-3 0-5.5 2.5-7.5 5-2-4-4-7.5-8.5-7.5-3.5 0-6.5 2.5-8 5.5l-.5 2c2-3 5-5 8.5-5 4 0 6.5 3.5 7.5 8 1-4.5 3.5-8 7.5-8l-.5 2c-.1.3-.5.5-.5.5z";

  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
      initial={isAnimated ? { y: 0, scaleY: 1 } : false}
      animate={isAnimated ? {
        y: [0, -1.2, 0], // Smooth, high-end soaring
        scaleY: [1, 0.96, 1], // Subtle breathing-like flap
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : { y: 0, scaleY: 1 }}
      style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible' }}
    >
      {/* Render Integrity: Employs a static SVG path to guarantee zero-latency rendering and consistent visual weight. */}
      <path d={premiumPath} />
      
      {/* Discreet accent circle for the head's presence */}
      <circle cx="16.5" cy="11" r="0.6" opacity="0.3" />
    </motion.svg>
  );
};

export default SeagullIcon;
