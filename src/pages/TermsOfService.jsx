import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

const TermsOfService = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition-colors mb-8">
        <FiArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
          <FiFileText className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-gray-400 mt-0.5">Last updated: April 2026</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8">
        <Section title="1. Acceptance of Terms">
          <p>By accessing or using ManifestHub, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>ManifestHub is a personal goal visualization and manifestation tool that allows users to create vision boards, set goals, track daily check-ins, and maintain a gratitude journal. The service is provided "as is" for personal, non-commercial use.</p>
        </Section>

        <Section title="3. Account Responsibilities">
          <p>You are responsible for:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activity that occurs under your account</li>
            <li>Ensuring your account information remains accurate and up to date</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to use ManifestHub to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Upload content that is illegal, harmful, or violates the rights of others</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Use automated means (bots, scrapers) to interact with the service</li>
            <li>Interfere with the performance or integrity of the service</li>
          </ul>
        </Section>

        <Section title="5. Your Content">
          <p>You retain full ownership of all content you create in ManifestHub — including vision board items, goals, journal entries, and uploaded images. By using the service, you grant us a limited license to store and display that content solely to provide the service to you.</p>
          <p>We will never use your personal content for advertising, training AI models, or sharing with third parties without your explicit consent.</p>
        </Section>

        <Section title="6. Availability">
          <p>We strive to maintain high availability but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the service at any time with reasonable notice.</p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>To the fullest extent permitted by law, ManifestHub shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
        </Section>

        <Section title="8. Changes to Terms">
          <p>We may update these terms from time to time. Continued use of the service after changes are posted constitutes your acceptance of the updated terms.</p>
        </Section>

        <Section title="9. Contact">
          <p>Questions about these terms? Contact us at <a href="mailto:sunluvrainbow@gmail.com" className="text-indigo-500 hover:underline">sunluvrainbow@gmail.com</a>.</p>
        </Section>
      </div>
    </div>
  </div>
);

export default TermsOfService;
