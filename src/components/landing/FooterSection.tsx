import { Facebook, Instagram, Youtube, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * High-End Premium Footer Section for Landing Page
 * - 압도적인 비주얼 임팩트
 * - 뉴스레터 구독 섹션 추가
 * - 정교한 호버 인터랙션 및 타이포그래피
 */
export default function FooterSection() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-white dark:bg-black text-foreground overflow-hidden border-t border-black/5 dark:border-white/10 mt-auto">
      {/* 배경 장식 (은은한 그라데이션) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[50%] -left-[20%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-12">
        
        {/* 상단: 초대형 브랜드 메시지 & 뉴스레터 */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 mb-24">
          {/* 브랜드 슬로건 (Big Typography) */}
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-6">
              Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Culture</span>,<br />
              Expand <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-primary">World</span>.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground/80 font-medium max-w-lg mb-8">
              {t('footer.brand.slogan_sub')}
            </p>
            
            <Link to="/signup" className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/20">
              {t('landing.cta_start', 'Start Your Journey')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 뉴스레터 구독 (Minimalist Form) */}
          <div className="lg:w-[400px] flex flex-col justify-end">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">{t('footer.newsletter.title', 'Subscribe to our newsletter')}</h3>
            <div className="relative group">
              <input 
                type="email" 
                placeholder={t('footer.newsletter.placeholder', 'Enter your email address')}
                className="w-full bg-transparent border-b-2 border-border py-4 text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors">
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-4">
              {t('footer.newsletter.desc', 'Join 10,000+ others and never miss out on new tips, tutorials, and more.')}
            </p>
          </div>
        </div>

        {/* 중단: 링크 그리드 (Clean & Professional) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 border-t border-border/40 pt-16 mb-16">
          <FooterColumn title={t('footer.columns.product.title')}>
            <FooterLink>{t('footer.columns.product.features')}</FooterLink>
            <FooterLink>{t('footer.columns.product.pricing')}</FooterLink>
            <FooterLink>{t('footer.columns.product.enterprise')}</FooterLink>
            <FooterLink>{t('footer.columns.product.security', 'Security')}</FooterLink>
          </FooterColumn>
          
          <FooterColumn title={t('footer.columns.resources.title')}>
            <FooterLink>{t('footer.columns.resources.documentation')}</FooterLink>
            <FooterLink>{t('footer.columns.resources.community')}</FooterLink>
            <FooterLink>{t('footer.columns.resources.webinars', 'Webinars')}</FooterLink>
            <FooterLink>{t('footer.columns.resources.help_center')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('footer.columns.company.title')}>
             <FooterLink>{t('footer.columns.company.about')}</FooterLink>
             <FooterLink>{t('footer.columns.company.careers')}</FooterLink>
             <FooterLink>{t('footer.columns.company.blog')}</FooterLink>
             <FooterLink>{t('footer.columns.company.contact')}</FooterLink>
          </FooterColumn>

          {/* 오피스 정보 (Visual) */}
          <div className="flex flex-col gap-6">
            <h3 className="font-bold text-foreground">{t('footer.columns.company.office', 'Office')}</h3>
            <address className="not-italic text-sm text-muted-foreground leading-relaxed">
              <span className="block font-medium text-foreground mb-1">Seoul HQ</span>
              Teheran-ro 123, Gangnam-gu<br />
              Seoul, South Korea<br />
              <a href="mailto:hello@ara.com" className="block mt-4 hover:text-primary transition-colors">hello@ara.com</a>
            </address>
          </div>
        </div>

        {/* 하단: 바닥글 (Minimal) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter">ARA</span>
            <span className="text-xs text-muted-foreground ml-2">
              {t('footer.bottom.rights', { year: currentYear })}
            </span>
          </div>

          <div className="flex items-center gap-6">
             <SocialIcon href="https://twitter.com" icon={<XIcon />} label={t('footer.social.x')} />
             <SocialIcon href="https://instagram.com" icon={<Instagram className="w-5 h-5" />} label={t('footer.social.instagram')} />
             <SocialIcon href="https://youtube.com" icon={<Youtube className="w-5 h-5" />} label={t('footer.social.youtube')} />
             <SocialIcon href="https://facebook.com" icon={<Facebook className="w-5 h-5" />} label={t('footer.social.facebook')} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-bold text-foreground">{title}</h3>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

function SocialIcon({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
   return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
      aria-label={label}
    >
      {icon}
    </a>
   )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
