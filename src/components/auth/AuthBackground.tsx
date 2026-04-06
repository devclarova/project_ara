/**
 * 인증 경험 몰입형 배경 엔진(Immersive Auth Background Engine):
 * - 목적(Why): 로그인/회원가입 단계에서 서비스의 프리미엄 브랜드 이미지를 전달하고 사용자 몰입감을 증대함
 * - 방법(How): Framer Motion을 활용한 다중 레이어 앰비언트 그라디언트와 GPU 가속 파티클 시스템을 결합하여 동적인 공간감을 창출함
 */
import React from 'react';
import { motion } from 'framer-motion';

interface AuthBackgroundProps {
  children: React.ReactNode;
}

const AuthBackground: React.FC<AuthBackgroundProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] dark:bg-[#020204] relative overflow-hidden transition-colors duration-1000">
      
      {/* 공간적 미학 구성(Atmospheric Layering) — 다중 그라디언트 레이어와 모션 에셋을 결합하여 몰입감 있는 인증 환경 조성 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        
        {/* 앰비언트 베이스 레이어 — 전체적인 색감의 톤을 결정하는 정적 방사형 그라디언트 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.12),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_70%)]" />

        {/* 다이내믹 래디언트 커튼(Top-Left) — GPU 가속 애니메이션을 활용한 부드러운 색상 전이 효과 적용 */}
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

        {/* 다이내믹 래디언트 웨이브(Bottom-Right) — 화면 하단의 시각적 무게감을 조절하는 유기적 모션 레이어 */}
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

        {/* 파티클 미스트 엔진(Particle Mist Engine) — 런타임 성능을 고려하여 최적화된 수의 미세 입자를 랜덤하게 배치 및 애니메이션화 */}
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
