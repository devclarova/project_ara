/**
 * 동적 문서 메타데이터 및 분석 엔진 관리자(Dynamic Document Metadata & Analytics Manager):
 * - 목적(Why): SEO 최적화를 위한 동적 메타태그 관리 및 외부 분석 도구(GA4)의 런타임 주입을 자동화함
 * - 방법(How): React Helmet을 통한 헤드 섹션 제어 및 사이트 설정 기반의 GA4 스크립트 라이프세이프 주입/제거 로직을 수행함
 */
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export const DocumentMetadataManager: React.FC = () => {
    const { settings } = useSiteSettings();

    useEffect(() => {
        if (settings?.integrations?.ga4_id) {
            const ga4Id = settings.integrations.ga4_id;
            
            // External Engine Injection: Dynamically injects Google Analytics 4 scripts into the document head at runtime.
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
                // Memory Leak Mitigation: Prunes injected script nodes upon component unmount to prevent resource fragmentation.
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
