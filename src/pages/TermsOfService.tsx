import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 sm:p-12 space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
            <p className="text-slate-500">Last updated: May 12, 2026</p>
          </div>

          <div className="prose prose-slate prose-indigo max-w-none space-y-8 text-slate-600">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">1. Agreement to Terms</h2>
              <p className="mt-4">
                By accessing or using GradePro (available at gradepro-v2.vercel.app and related domains), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this application are protected by applicable copyright and trademark law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">2. Description of Service</h2>
              <p className="mt-4">
                GradePro is an academic performance tracking and prediction tool designed primarily for students in Nigerian universities. Our services include, but are not limited to, CGPA calculation, course management, assessment tracking, GPA simulation, AI-guided academic insights, and a community library for course materials and reviews.
              </p>
              <p className="mt-2">
                We reserve the right to modify, suspend, or discontinue the Service (or any part or content thereof) at any time with or without notice to you, and we shall not be liable to you or to any third party for any modification, price change, suspension or discontinuance of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">3. User Accounts & Registration</h2>
              <p className="mt-4">
                To access certain features of the Service, you must register for an account using Google Authentication. By registering, you agree to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide accurate, current, and complete information as prompted by the registration form.</li>
                <li>Maintain the security of your password and identification.</li>
                <li>Maintain and promptly update the registration data, and any other information you provide to GradePro, to keep it accurate, current, and complete.</li>
                <li>Accept all responsibility for any and all activities that occur under your account.</li>
              </ul>
              <p className="mt-2">
                GradePro reserves the right to terminate accounts, remove or edit content, or cancel services in its sole discretion if we deem the account to be fraudulent, abusive, or in violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">4. User Content & Community Guidelines</h2>
              <p className="mt-4">
                Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"), specifically in the Community Course Library.
              </p>
              <p className="mt-2 text-slate-900 font-medium">You represent and warrant that:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>The Content belongs to you or you have the right to use it and grant us the rights and license as provided in these Terms.</li>
                <li>The posting of your Content does not violate the intellectual property rights, privacy rights, publicity rights, or any other rights of any person.</li>
                <li>The Content does not promote academic dishonesty, plagiarism, or cheating of any kind.</li>
                <li>The Content is not unlawful, threatening, libelous, defamatory, obscene, or otherwise objectionable.</li>
              </ul>
              <p className="mt-2">
                We reserve the right, but not the obligation, to monitor and edit or remove any Content provided by users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">5. Intellectual Property</h2>
              <p className="mt-4">
                The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of GradePro and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of GradePro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">6. Academic Disclaimer</h2>
              <p className="mt-4 font-medium text-slate-800">
                GradePro is designed as a supplementary tool to assist you in tracking your academic performance. 
              </p>
              <p className="mt-2">
                The CGPA calculations, simulations, and AI recommendations provided by our service are approximations based on the data you input. They should not be considered official academic records. Always refer to your university's official grading systems, senate-approved results, and student portals for your definitive academic standing. We are not liable for any discrepancies between our calculations and your official university transcript.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">7. Limitation of Liability</h2>
              <p className="mt-4">
                In no event shall GradePro, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your access to or use of or inability to access or use the Service;</li>
                <li>Any conduct or content of any third party on the Service;</li>
                <li>Any content obtained from the Service; and</li>
                <li>Unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">8. Governing Law</h2>
              <p className="mt-4">
                These Terms shall be governed and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.
              </p>
              <p className="mt-2">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">9. Changes to Terms</h2>
              <p className="mt-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p className="mt-2">
                By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">10. Contact Us</h2>
              <p className="mt-4">
                If you have any questions about these Terms, please contact us via the support channels provided in the application.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
