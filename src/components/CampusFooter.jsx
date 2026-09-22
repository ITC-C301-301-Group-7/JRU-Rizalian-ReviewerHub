import React from 'react';
import { JruLogo } from './JruLogo';
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export function CampusFooter() {
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
              Empowering Rizalians through quality education and innovative student services. Dedicated to fostering academic excellence, integrity, and social responsibility.
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
                <span>80 Shaw Boulevard, Mandaluyong City, 1552 Metro Manila, Philippines</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+63 (02) 8531-8031 to 35</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:support@jru.edu" className="hover:text-amber-300 transition-colors">
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
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>
                <a href="https://jru.edu" target="_blank" rel="noreferrer" className="hover:text-amber-300 transition-colors inline-flex items-center gap-1">
                  Official JRU Website <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a href="#library" className="hover:text-amber-300 transition-colors">
                  University Library Portal
                </a>
              </li>
              <li>
                <a href="#enrollment" className="hover:text-amber-300 transition-colors">
                  Academic Calendar &amp; Enrollment
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-amber-300 transition-colors">
                  Data Privacy Statement
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Jose Rizal University. All rights reserved.</p>
          <p className="flex items-center gap-1 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Mandaluyong City, Philippines</span>
          </p>
        </div>
      </div>
    </footer>
  );
}