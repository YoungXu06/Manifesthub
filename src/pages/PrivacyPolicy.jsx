import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition-colors mb-8">
        <FiArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <FiShield className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-gray-400 mt-0.5">Last updated: April 2026</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8">
        <Section title="1. Information We Collect">
          <p>We collect information you provide directly to us when you create an account, including your name, email address, and any content you add to your vision board, goals, and gratitude journal.</p>
          <p>We also collect usage data such as the features you use and how often you check in, to help us improve the product experience.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Provide, maintain, and improve ManifestHub</li>
            <li>Personalize your experience and affirmations</li>
            <li>Send you product updates if you opt in</li>
            <li>Respond to your support requests</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="3. Data Storage">
          <p>Your data is securely stored using Google Firebase (Firestore), hosted in the United States. Firebase employs industry-standard encryption at rest and in transit.</p>
          <p>Vision board images are stored as compressed base64 data within your Firestore documents and are never shared with other users.</p>
        </Section>

        <Section title="4. Authentication">
          <p>We use Firebase Authentication to manage sign-in. You may sign in with email/password or Google OAuth. We never store your raw passwords — all credentials are managed by Firebase's secure authentication system.</p>
        </Section>

        <Section title="5. Cookies & Local Storage">
          <p>We use browser localStorage to remember your theme preference, language, and session state. We do not use tracking cookies or third-party advertising networks.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You may request deletion of your account and all associated data at any time by contacting us. We will process the request within 30 days.</p>
        </Section>

        <Section title="7. Changes to This Policy">
          <p>We may update this policy from time to time. We will notify you of significant changes via email or an in-app notice.</p>
        </Section>

        <Section title="8. Contact">
          <p>Questions about this policy? Reach out at <a href="mailto:sunluvrainbow@gmail.com" className="text-indigo-500 hover:underline">sunluvrainbow@gmail.com</a>.</p>
        </Section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
