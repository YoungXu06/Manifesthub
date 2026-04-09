import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition-colors mb-8">
          <FiArrowLeft className="w-4 h-4" /> {t('legal.back')}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <FiFileText className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('legal.terms.title')}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{t('legal.lastUpdated')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-8">
          {[
            { title: t('legal.terms.s1Title'), body: <p>{t('legal.terms.s1')}</p> },
            { title: t('legal.terms.s2Title'), body: <p>{t('legal.terms.s2')}</p> },
            { title: t('legal.terms.s3Title'), body: <><p>{t('legal.terms.s3Intro')}</p><ul className="list-disc pl-5 space-y-1 mt-2">{(t('legal.terms.s3Items', { returnObjects: true }) || []).map((item, i) => <li key={i}>{item}</li>)}</ul></> },
            { title: t('legal.terms.s4Title'), body: <><p>{t('legal.terms.s4Intro')}</p><ul className="list-disc pl-5 space-y-1 mt-2">{(t('legal.terms.s4Items', { returnObjects: true }) || []).map((item, i) => <li key={i}>{item}</li>)}</ul></> },
            { title: t('legal.terms.s5Title'), body: <><p>{t('legal.terms.s5a')}</p><p className="mt-2">{t('legal.terms.s5b')}</p></> },
            { title: t('legal.terms.s6Title'), body: <p>{t('legal.terms.s6')}</p> },
            { title: t('legal.terms.s7Title'), body: <p>{t('legal.terms.s7')}</p> },
            { title: t('legal.terms.s8Title'), body: <p>{t('legal.terms.s8')}</p> },
            { title: t('legal.terms.s9Title'), body: <p>{t('legal.terms.s9')} <a href="mailto:sunluvrainbow@gmail.com" className="text-indigo-500 hover:underline">sunluvrainbow@gmail.com</a>.</p> },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
