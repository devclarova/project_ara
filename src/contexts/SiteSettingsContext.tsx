import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  global_notice: {
    enabled: boolean;
    text: string;
    color: 'blue' | 'red' | 'amber' | 'emerald';
  };
  maintenance_mode: {
    enabled: boolean;
    message: string;
    end_time: string | null;
  };
  site_metadata: {
    title: string;
    description: string;
    logo_url: string | null;
  };
  security_config: {
    ip_restriction: boolean;
    ip_whitelist: string[];
    multi_login_limit: boolean;
    brute_force_protection: boolean;
    tfa_required: boolean;
  };
  integrations: {
    supabase_url: string;
    ga4_id: string;
  };
  banner_messages: {
    sns_top: string;
    search_placeholder: string;
  };
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        const formatted: any = {};
        data.forEach(item => {
          formatted[item.key] = item.value;
        });
        setSettings(formatted as SiteSettings);
      }
    } catch (err) {
      console.error('[SiteSettingsContext] Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to all site_settings changes
    const channel = supabase
      .channel('public_site_settings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_settings' 
      }, () => {
        // Simple strategy: re-fetch everything on any change
        fetchSettings();
      })
      .subscribe();

    // Focus Sync
    const handleFocus = () => fetchSettings();
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
