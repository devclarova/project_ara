import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CheckboxSquare from '@/components/common/CheckboxSquare';
import { Helmet } from 'react-helmet-async';
import SignInCard from '@/components/auth/SignInCard';

function SignInPage() {
  return (
    <div className="flex items-center justify-center bg-white pt-12 px-4 dark:bg-background">
      <Helmet>
        <title>로그인 | ARA</title>
      </Helmet>
      <SignInCard />
    </div>
  );
}

export default SignInPage;
