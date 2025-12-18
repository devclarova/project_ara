import React from 'react';

export type ConsentKey = 'terms' | 'privacy' | 'marketing';

export const getContent = (
  t: (key: string) => string
): Record<ConsentKey, { title: string; sections: Array<{ id: string; h: string; body: React.ReactNode }> }> => ({
  terms: {
    title: t('policy.terms.title'),
    sections: [
      {
        id: 'purpose',
        h: t('policy.terms.purpose.h'),
        body: <p>{t('policy.terms.purpose.body')}</p>,
      },
      {
        id: 'definition',
        h: t('policy.terms.definition.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.definition.member')}</li>
            <li>{t('policy.terms.definition.content')}</li>
            <li>{t('policy.terms.definition.paid_service')}</li>
          </ul>
        ),
      },
      {
        id: 'contract',
        h: t('policy.terms.contract.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.contract.agreement')}</li>
            <li>{t('policy.terms.contract.verification')}</li>
            <li>{t('policy.terms.contract.age_limit')}</li>
          </ul>
        ),
      },
      {
        id: 'community',
        h: t('policy.terms.community.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.community.guidelines')}</li>
            <li>{t('policy.terms.community.prohibited_content')}</li>
            <li>{t('policy.terms.community.prohibited_actions')}</li>
            <li>{t('policy.terms.community.violations')}</li>
          </ul>
        ),
      },
      {
        id: 'member_duty',
        h: t('policy.terms.member_duty.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.member_duty.password')}</li>
            <li>{t('policy.terms.member_duty.identity')}</li>
            <li>{t('policy.terms.member_duty.ai_output')}</li>
          </ul>
        ),
      },
      {
        id: 'license',
        h: t('policy.terms.license.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.license.copyright')}</li>
            <li>{t('policy.terms.license.grant')}</li>
            <li>{t('policy.terms.license.responsibility')}</li>
          </ul>
        ),
      },
      {
        id: 'ai',
        h: t('policy.terms.ai.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.ai.usage')}</li>
            <li>{t('policy.terms.ai.disclaimer')}</li>
          </ul>
        ),
      },
      {
        id: 'payment',
        h: t('policy.terms.payment.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.payment.pricing')}</li>
            <li>{t('policy.terms.payment.policy')}</li>
          </ul>
        ),
      },
      {
        id: 'service_change',
        h: t('policy.terms.service_change.h'),
        body: <p>{t('policy.terms.service_change.body')}</p>,
      },
      {
        id: 'termination',
        h: t('policy.terms.termination.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.termination.withdrawal')}</li>
            <li>{t('policy.terms.termination.restriction')}</li>
          </ul>
        ),
      },
      {
        id: 'ip_report',
        h: t('policy.terms.ip_report.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.ip_report.takedown')}</li>
            <li>{t('policy.terms.ip_report.counter')}</li>
          </ul>
        ),
      },
      {
        id: 'disclaimer',
        h: t('policy.terms.disclaimer.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.disclaimer.force_majeure')}</li>
            <li>{t('policy.terms.disclaimer.disputes')}</li>
          </ul>
        ),
      },
      {
        id: 'law',
        h: t('policy.terms.law.h'),
        body: <p>{t('policy.terms.law.body')}</p>,
      },
      {
        id: 'notice',
        h: t('policy.terms.notice.h'),
        body: <p>{t('policy.terms.notice.body')}</p>,
      },
    ],
  },

  privacy: {
    title: t('policy.privacy.title'),
    sections: [
      {
        id: 'collect',
        h: t('policy.privacy.collect.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>{t('policy.privacy.collect.required_title')}</strong>: {t('policy.privacy.collect.required_items')}
            </li>
            <li>
              <strong>{t('policy.privacy.collect.optional_title')}</strong>: {t('policy.privacy.collect.optional_items')}
            </li>
            <li>
              <strong>{t('policy.privacy.collect.auto_title')}</strong>: {t('policy.privacy.collect.auto_items')}
            </li>
            <li>
              <strong>{t('policy.privacy.collect.social_title')}</strong>: {t('policy.privacy.collect.social_items')}
            </li>
          </ul>
        ),
      },
      {
        id: 'purpose',
        h: t('policy.privacy.purpose.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.privacy.purpose.account')}</li>
            <li>{t('policy.privacy.purpose.sns_features')}</li>
            <li>{t('policy.privacy.purpose.support')}</li>
            <li>{t('policy.privacy.purpose.analytics')}</li>
            <li>{t('policy.privacy.purpose.security')}</li>
            <li>{t('policy.privacy.purpose.payment')}</li>
          </ul>
        ),
      },
      {
        id: 'share',
        h: t('policy.privacy.share.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.privacy.share.principle')}</li>
            <li>{t('policy.privacy.share.outsourcing')}</li>
            <li>{t('policy.privacy.share.legal')}</li>
          </ul>
        ),
      },
      {
        id: 'xborder',
        h: t('policy.privacy.xborder.h'),
        body: <p>{t('policy.privacy.xborder.body')}</p>,
      },
      {
        id: 'store',
        h: t('policy.privacy.store.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.privacy.store.withdrawal')}</li>
            <li>{t('policy.privacy.store.legal_retention')}</li>
            <li>{t('policy.privacy.store.backup')}</li>
          </ul>
        ),
      },
      {
        id: 'security',
        h: t('policy.privacy.security.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.privacy.security.encryption')}</li>
            <li>{t('policy.privacy.security.access_control')}</li>
            <li>{t('policy.privacy.security.logs')}</li>
            <li>{t('policy.privacy.security.backup_recovery')}</li>
          </ul>
        ),
      },
      {
        id: 'rights',
        h: t('policy.privacy.rights.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.privacy.rights.data_rights')}</li>
            <li>{t('policy.privacy.rights.settings')}</li>
            <li>{t('policy.privacy.rights.cookies')}</li>
          </ul>
        ),
      },
      {
        id: 'children',
        h: t('policy.privacy.children.h'),
        body: <p>{t('policy.privacy.children.body')}</p>,
      },
      {
        id: 'notice',
        h: t('policy.privacy.notice.h'),
        body: <p>{t('policy.privacy.notice.body')}</p>,
      },
      {
        id: 'contact',
        h: t('policy.privacy.contact.h'),
        body: (
          <ul className="list-disc pl-5">
            <li>{t('policy.privacy.contact.name')}</li>
            <li>{t('policy.privacy.contact.email')}</li>
            <li>{t('policy.privacy.contact.hours')}</li>
          </ul>
        ),
      },
    ],
  },

  marketing: {
    title: t('policy.marketing.title'),
    sections: [
      {
        id: 'purpose',
        h: t('policy.marketing.purpose.h'),
        body: <p>{t('policy.marketing.purpose.body')}</p>,
      },
      {
        id: 'contents',
        h: t('policy.marketing.contents.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.marketing.contents.features')}</li>
            <li>{t('policy.marketing.contents.events')}</li>
            <li>{t('policy.marketing.contents.discounts')}</li>
            <li>{t('policy.marketing.contents.reports')}</li>
          </ul>
        ),
      },
      {
        id: 'channels',
        h: t('policy.marketing.channels.h'),
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.marketing.channels.individual')}</li>
            <li>{t('policy.marketing.channels.settings')}</li>
            <li>{t('policy.marketing.channels.apply')}</li>
          </ul>
        ),
      },
      {
        id: 'partners',
        h: t('policy.marketing.partners.h'),
        body: <p>{t('policy.marketing.partners.body')}</p>,
      },
      {
        id: 'note',
        h: t('policy.marketing.note.h'),
        body: <p>{t('policy.marketing.note.body')}</p>,
      },
    ],
  },
});

// 기존 호환성을 위한 CONTENT 유지
export const CONTENT = getContent((key: string) => key);
