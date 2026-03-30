import React from 'react';
import { motion } from 'framer-motion';

interface SeagullIconProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
}

/**
 * Premium Soaring Seagull Icon for Project ARA
 * Built for maximum aesthetic impact and 100% runtime stability.
 * Uses a single, high-fidelity minimalist silhouette.
 */
const SeagullIcon: React.FC<SeagullIconProps> = ({ 
  size = 24, 
  className = "",
  isAnimated = true
}) => {
  // A professional-grade, bold soaring seagull silhouette.
  // This path is optimized for high visibility and clean edges at small scales.
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
      {/* 
        High-fidelity static path: 
        Ensures NO 'undefined' errors and NO thickness artifacts.
      */}
      <path d={premiumPath} />
      
      {/* Discreet accent circle for the head's presence */}
      <circle cx="16.5" cy="11" r="0.6" opacity="0.3" />
    </motion.svg>
  );
};

export default SeagullIcon;
