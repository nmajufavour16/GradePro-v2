import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 sm:p-12 space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
            <p className="text-slate-500">Last updated: May 12, 2026</p>
          </div>

          <div className="prose prose-slate prose-indigo max-w-none space-y-8 text-slate-600">
            <section>
              <p className="text-lg">
                At GradePro, accessible from gradepro-v2.vercel.app, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by GradePro and how we use it.
              </p>
              <p className="mt-2">
                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">1. Information We Collect</h2>
              <p className="mt-4">
                We collect several different types of information for various purposes to provide and improve our Service to you.
              </p>
              
              <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">Personal Data</h3>
              <p>While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Email address (via Google Authentication)</li>
                <li>First name and last name (via Google Authentication)</li>
                <li>Profile picture URL (via Google Authentication)</li>
                <li>Academic Information (Institution, Faculty, Department, Level, Grading Scale)</li>
              </ul>

              <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">Usage Data</h3>
              <p>We may also collect information that your browser sends whenever you visit our Service or when you access the Service by or through a mobile device.</p>

              <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">Academic Data</h3>
              <p>When you use GradePro to track your performance, we collect and store the data you input, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Course details (codes, titles, units)</li>
                <li>Grades and assessment scores</li>
                <li>Semester records and GPA data</li>
                <li>Content from uploaded transcripts parsed via Google Gemini AI (note: the physical files are processed but not permanently stored; only the extracted text/data is saved to your profile)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">2. How We Use Your Data</h2>
              <p className="mt-4">GradePro uses the collected data for various purposes:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>To provide and maintain our Service (e.g., calculating your exact CGPA)</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service (like the Community Library)</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To generate personalized academic insights and coaching via our AI features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">3. Third-Party Integrations & AI</h2>
              <p className="mt-4">
                <strong>Google Authentication:</strong> We use Google Authentication to securely sign you in. We only request basic profile information (name, email, profile picture) and do not have access to your Google Drive, Gmail, or other Google services.
              </p>
              <p className="mt-2">
                <strong>Google Gemini AI:</strong> GradePro utilizes Google's Gemini AI to parse uploaded academic transcripts and provide AI academic coaching. When you use the "Scan Transcript" feature or ask the "GradePro AI," relevant textual data from your academic profile is sent securely to the AI model to generate a response. The AI models do not use your data to train their base models.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">4. Data Security</h2>
              <p className="mt-4">
                The security of your data is important to us. We use Google Firebase to securely store your data. Firebase employs industry-standard encryption and security measures. 
              </p>
              <p className="mt-2">
                Our Firestore database relies on stringent security rules to ensure that your private academic data (grades, assessments, semesters) can <strong>only</strong> be read and modified by you.
              </p>
              <p className="mt-2">
                However, please remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">5. Public & Community Data</h2>
              <p className="mt-4">
                GradePro features a "Community Course Library" where users can share course materials, reviews, and templates. 
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>If you choose to submit a course template, review, or study material to the community, that specific submission becomes publicly visible to all users of the app.</li>
                <li>Your private grades, semesters, assessments, and overall CGPA are <strong>never</strong> shared with the community or made public.</li>
                <li>You may choose to post course reviews anonymously, in which case your display name will be hidden from other users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">6. Deleting Your Data</h2>
              <p className="mt-4">
                You have the right to request the deletion of your personal data. While we are continuously working on improving the app to include a self-serve "Delete Account" button, you can currently request full account and data deletion by contacting us directly. 
              </p>
              <p className="mt-2">
                Within the app, you retain full control to delete individual courses, semesters, reviews, and materials at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">7. Children's Privacy</h2>
              <p className="mt-4">
                Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">8. Changes to This Privacy Policy</h2>
              <p className="mt-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p className="mt-2">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
