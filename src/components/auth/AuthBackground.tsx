import React from 'react';
import { motion } from 'framer-motion';

interface AuthBackgroundProps {
  children: React.ReactNode;
}

const AuthBackground: React.FC<AuthBackgroundProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] dark:bg-[#020204] relative overflow-hidden transition-colors duration-1000">
      
      {/* 🌌 Aurora v5.5: Optimized for Performance (GPU-Accelerated) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Layer 1: Global Ambient Glow - Static (No animation for performance) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.12),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_70%)]" />

        {/* Layer 2: Top-Left Radiant Curtain - GPU Optimized */}
        <motion.div 
          animate={{
            x: ['-20%', '10%', '-5%'],
            y: ['-10%', '5%', '-15%'],
            opacity: [0.55, 0.85, 0.65],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ willChange: 'transform, opacity' }}
          className="absolute -top-[10%] -left-[15%] w-[100%] h-[70%] bg-gradient-to-br from-cyan-400/50 via-blue-500/30 to-transparent dark:from-cyan-500/40 dark:via-blue-600/20 dark:to-transparent blur-[100px] origin-top-left"
        />

        {/* Layer 3: Bottom-Right Deep Wave - GPU Optimized */}
        <motion.div 
          animate={{
            x: ['20%', '-5%', '15%'],
            y: ['10%', '-10%', '5%'],
            opacity: [0.45, 0.75, 0.55],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ willChange: 'transform, opacity' }}
          className="absolute -bottom-[15%] -right-[15%] w-[110%] h-[75%] bg-gradient-to-tl from-emerald-400/45 via-teal-500/35 to-transparent dark:from-emerald-500/35 dark:via-teal-600/20 dark:to-transparent blur-[100px] origin-bottom-right"
        />

        {/* Layer 4: Center-Crossing Shimmer - GPU Optimized */}
        <motion.div 
          animate={{
            x: ['-40%', '40%'],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: "linear",
          }}
          style={{ willChange: 'transform, opacity' }}
          className="absolute top-[20%] left-[10%] w-[120%] h-[50%] bg-gradient-to-r from-transparent via-purple-500/35 to-transparent dark:via-indigo-600/20 blur-[100px] opacity-60 dark:opacity-90"
        />

        {/* Layer 5: Top-Right Dynamic Accent - GPU Optimized */}
        <motion.div 
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [0.8, 1.25, 0.9],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ willChange: 'transform, opacity' }}
          className="absolute -top-[10%] -right-[10%] w-[70%] h-[60%] bg-gradient-to-bl from-pink-400/40 via-amber-300/20 to-transparent dark:from-pink-600/15 dark:via-amber-600/5 dark:to-transparent blur-[90px]"
        />

        {/* ✨ Optimized Particle Mist: Reduced count for performance (40 -> 15) */}
        <div className="absolute inset-0 opacity-60">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[2px] h-[2px] bg-white rounded-full"
              style={{ 
                willChange: 'transform, opacity',
                boxShadow: '0 0 8px rgba(255,255,255,0.6)'
              }}
              initial={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.3,
              }}
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                y: [`${Math.random() * 100}%`, `${(Math.random() * 100) - 5}%`]
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* 🧼 High-Clarity Diffuser */}
      <div className="absolute inset-0 bg-white/5 dark:bg-black/25 backdrop-blur-[0.5px] pointer-events-none" />

      {/* Content Container */}
      <div className="w-full min-h-screen flex items-center justify-center relative z-10 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full flex justify-center"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthBackground;
