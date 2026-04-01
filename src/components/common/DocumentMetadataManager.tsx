import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export const DocumentMetadataManager: React.FC = () => {
    const { settings } = useSiteSettings();

    useEffect(() => {
        if (settings?.integrations?.ga4_id) {
            const ga4Id = settings.integrations.ga4_id;
            
            // Script injection
            const script1 = document.createElement('script');
            script1.async = true;
            script1.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
            
            const script2 = document.createElement('script');
            script2.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}');
            `;
            
            document.head.appendChild(script1);
            document.head.appendChild(script2);
            
            return () => {
                document.head.removeChild(script1);
                document.head.removeChild(script2);
            };
        }
    }, [settings?.integrations?.ga4_id]);

    if (!settings?.site_metadata) return null;

    const { title, description } = settings.site_metadata;

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
        </Helmet>
    );
};
