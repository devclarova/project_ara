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
