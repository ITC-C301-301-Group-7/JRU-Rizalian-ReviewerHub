import React, { useState } from 'react';
import { JruLogo } from './JruLogo';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  ShieldCheck,
  ExternalLink,
  X,
} from 'lucide-react';

export function CampusFooter() {
  const [showDataPrivacy, setShowDataPrivacy] = useState(false);

  return (
    <footer
      id="jru-portal-footer"
      className="w-full bg-[#002147] text-white border-t-2 border-amber-400/40 mt-auto relative z-20"
    >
      <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/10">

          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <JruLogo size="sm" className="w-10 h-10" />
              <div>
                <h3 className="font-extrabold text-sm tracking-wide font-varsity uppercase text-white">
                  Jose Rizal University
                </h3>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Student Services &amp; Academic Portal
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Empowering Rizalians through quality education and innovative
              student services. Dedicated to fostering academic excellence,
              integrity, and social responsibility.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Official JRU Academic System</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Campus Contact &amp; Location
            </h4>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  80 Shaw Boulevard, Mandaluyong City, 1552 Metro Manila,
                  Philippines
                </span>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+63 (02) 8531-8031 to 35</span>
              </li>

              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a
                  href="mailto:support@jru.edu"
                  className="hover:text-amber-300 transition-colors"
                >
                  support@jru.edu
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Quick Resources
            </h4>

            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <a
                  href="https://jru.edu"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                >
                  Official JRU Website
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>

              <li>
                <a
                  href="#library"
                  className="hover:text-amber-300 transition-colors"
                >
                  University Library Portal
                </a>
              </li>

              <li>
                <a
                  href="#enrollment"
                  className="hover:text-amber-300 transition-colors"
                >
                  Academic Calendar &amp; Enrollment
                </a>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => setShowDataPrivacy(true)}
                  className="text-slate-300 hover:text-amber-300 transition-colors text-left"
                >
                  Data Privacy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>
            © {new Date().getFullYear()} Jose Rizal University. All rights reserved.
          </p>

          <p className="flex items-center gap-1 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Mandaluyong City, Philippines</span>
          </p>
        </div>
      </div>

      {/* Data Privacy Modal */}
      {showDataPrivacy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowDataPrivacy(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-privacy-title"
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 text-slate-700 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    JRU ReviewerHub
                  </span>
                </div>

                <h2
                  id="data-privacy-title"
                  className="text-2xl font-bold text-[#002147]"
                >
                  Data Privacy Statement
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your privacy matters to us.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDataPrivacy(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close Data Privacy Statement"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-5 text-sm leading-6">
              <p>
                JRU ReviewerHub respects the privacy of its users and aims
                to protect personal information collected through the platform.
                This statement explains how information may be collected,
                used, and protected when using the website.
              </p>

              <section>
                <h3 className="font-bold text-[#002147] mb-1">
                  1. Information We Collect
                </h3>
                <p>
                  Information may include your name, email address, account
                  details, and learning resources you upload or share through
                  the platform.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#002147] mb-1">
                  2. Purpose of Data Collection
                </h3>
                <p>
                  Information may be used to manage user accounts, provide
                  access to learning materials, support resource sharing,
                  maintain platform functionality, and improve the user
                  experience.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#002147] mb-1">
                  3. Data Protection
                </h3>
                <p>
                  Appropriate safeguards should be used to help protect
                  personal information from unauthorized access, disclosure,
                  alteration, or loss. Users should keep their login
                  credentials confidential.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#002147] mb-1">
                  4. Sharing of Information
                </h3>
                <p>
                  Personal information should only be accessed or disclosed
                  for authorized purposes. Learning resources shared with
                  the community may be visible to other platform users.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#002147] mb-1">
                  5. Data Retention
                </h3>
                <p>
                  Information should be retained only as long as reasonably
                  necessary for the platform's purposes or as required by
                  applicable policies and laws.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#002147] mb-1">
                  6. Your Privacy Rights
                </h3>
                <p>
                  Subject to applicable laws, users may request access to
                  or correction of their personal information and raise
                  concerns about how their information is handled.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#002147] mb-1">
                  7. Contact and Concerns
                </h3>
                <p>
                  For privacy-related questions, contact the designated
                  ReviewerHub administrator or the appropriate university
                  office.
                </p>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="mt-7 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => setShowDataPrivacy(false)}
                className="w-full rounded-xl bg-[#002147] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#003366]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
