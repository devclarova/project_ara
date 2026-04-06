/**
 * 통합 로그인 인터페이스(Integrated Sign-In Interface):
 * - 목적(Why): 이메일 및 소셜 연동을 포함한 모든 계정 접근 체계를 일원화된 뷰(View) 형태로 제공함
 * - 방법(How): AuthBackground 레이아웃 프로바이더 및 SignInCard 컴포넌트를 호출하여 로그인 화면을 렌더링함
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import CheckboxSquare from '@/components/common/CheckboxSquare';
import { Helmet } from 'react-helmet-async';
import SignInCard from '@/components/auth/SignInCard';

import AuthBackground from '@/components/auth/AuthBackground';

function SignInPage() {
  return (
    <AuthBackground>
      <div className="flex items-center justify-center px-4">
        <Helmet>
          <title>로그인 | ARA</title>
        </Helmet>
        <SignInCard />
      </div>
    </AuthBackground>
  );
}

export default SignInPage;
