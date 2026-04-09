import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiMessageSquare, FiZap, FiCheck, FiLoader } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');

  const subjects = t('contact.subjects', { returnObjects: true }) || [];

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    await new Promise(r => setTimeout(r, 1200));
    setStatus('sent');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition-colors mb-8">
          <FiArrowLeft className="w-4 h-4" /> {t('legal.back')}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <FiMessageSquare className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('contact.title')}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{t('contact.subtitle')}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('contact.getInTouch')}</h2>
              <div className="space-y-3">
                {[
                  { icon: <FiMail className="w-4 h-4" />, label: t('contact.emailLabel'), value: 'sunluvrainbow@gmail.com', href: 'mailto:sunluvrainbow@gmail.com' },
                  { icon: <FiZap className="w-4 h-4" />, label: t('contact.responseTime'), value: t('contact.responseTimeValue') },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-0.5 text-indigo-400 flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      {item.href
                        ? <a href={item.href} className="text-sm text-indigo-500 hover:underline">{item.value}</a>
                        : <p className="text-sm text-gray-700 dark:text-gray-300">{item.value}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 p-5">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">{t('contact.privacyAndLegal')}</p>
              <div className="space-y-1.5">
                <Link to="/privacy" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">{t('contact.privacyLink')}</Link>
                <Link to="/terms" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">{t('contact.termsLink')}</Link>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              {status === 'sent' ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <FiCheck className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('contact.successTitle')}</h3>
                  <p className="text-sm text-gray-400">{t('contact.successDesc')}</p>
                  <button
                    onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-6 text-sm text-indigo-500 hover:underline"
                  >
                    {t('contact.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('contact.name')}</label>
                      <input name="name" value={form.name} onChange={handleChange} required placeholder={t('contact.namePlaceholder')} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('contact.email')}</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder={t('contact.emailPlaceholder')} className="input w-full text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('contact.subject')}</label>
                    <select name="subject" value={form.subject} onChange={handleChange} required className="input w-full text-sm bg-transparent">
                      <option value="" disabled>{t('contact.subjectPlaceholder')}</option>
                      {Array.isArray(subjects) && subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('contact.message')}</label>
                    <textarea name="message" value={form.message} onChange={handleChange} required rows={5} placeholder={t('contact.messagePlaceholder')} className="input w-full text-sm resize-none" />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                      status === 'sending'
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {status === 'sending'
                      ? <><FiLoader className="animate-spin w-4 h-4" /> {t('contact.sending')}</>
                      : t('contact.send')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
