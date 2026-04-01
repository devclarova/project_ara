import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

if (GA_MEASUREMENT_ID) {
  ReactGA.initialize([{
    trackingId: GA_MEASUREMENT_ID,
    gaOptions: {
      send_page_view: false
    }
  }]);
}

export function useUserTracker() {
  const location = useLocation();
  const { session } = useAuth();

  useEffect(() => {
    // 1. GA4 Pageview Tracking
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
    }

    // 2. In-House AdBlock Fallback Tracking (Save to localStorage temporarily)
    const params = new URLSearchParams(location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const referrer = document.referrer;

    // Only set if they exist in the current URL, otherwise keep the ones from localStorage
    if (utmSource || utmMedium || utmCampaign) {
      localStorage.setItem('ara_utm_source', utmSource || '');
      localStorage.setItem('ara_utm_medium', utmMedium || '');
      localStorage.setItem('ara_utm_campaign', utmCampaign || '');
    }
    
    if (referrer && !referrer.includes(window.location.hostname)) {
      localStorage.setItem('ara_referrer', referrer);
    }
  }, [location]);

  // 3. Sync to Supabase when user is logged in
  useEffect(() => {
    if (session?.user) {
      const syncTraffic = async () => {
        const source = localStorage.getItem('ara_utm_source');
        const medium = localStorage.getItem('ara_utm_medium');
        const campaign = localStorage.getItem('ara_utm_campaign');
        const referrer = localStorage.getItem('ara_referrer');

        // Log every day for authenticated users to track DAU
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // Check if already logged TODAY for this user
          const { count } = await supabase
            .from('traffic_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .gte('created_at', today);

          if (count === 0) {
            await supabase.from('traffic_logs').insert({
              user_id: session.user.id,
              utm_source: source || 'direct',
              utm_medium: medium || 'none',
              utm_campaign: campaign || 'none',
              referrer: referrer || 'none',
              landing_page: location.pathname
            });
          }
        } catch (e) {
          console.error('Failed to sync traffic log', e);
        }
      };

      syncTraffic();
    }
  }, [session?.user]);
}
