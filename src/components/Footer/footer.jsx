import { Link } from 'react-router-dom';

import Logo from '../Logo';

const Footer = () => {
  return (
    <footer className="mt-auto bg-[#EFF6FF] text-slate-600 dark:bg-[#1a0325] dark:text-[#EBD3F8]/70 border-t border-[#DBEAFE] dark:border-[#7A1CAC]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="brightness-125">
              <Logo width="160px" />
            </div>
            <p className="text-sm text-slate-600 dark:text-[#EBD3F8]/70 max-w-sm leading-relaxed">
              A modern publishing space designed for thinkers, creators, and storytellers. Share your perspectives and discover inspiring stories every day.
            </p>
            <div className="pt-2 text-xs text-slate-500 dark:text-[#EBD3F8]/50">
              &copy; {new Date().getFullYear()} InkSpace. All rights reserved.
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-[#EBD3F8]">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#1D4ED8] dark:hover:text-[#AD49E1] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/all-posts" className="hover:text-[#1D4ED8] dark:hover:text-[#AD49E1] transition-colors">
                  All Stories
                </Link>
              </li>
              <li>
                <Link to="/add-post" className="hover:text-[#1D4ED8] dark:hover:text-[#AD49E1] transition-colors">
                  Write a Story
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-[#EBD3F8]">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="hover:text-[#1D4ED8] dark:hover:text-[#AD49E1] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-[#1D4ED8] dark:hover:text-[#AD49E1] transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <a 
                  href="https://appwrite.io" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-[#1D4ED8] dark:hover:text-[#AD49E1] transition-colors inline-flex items-center gap-1"
                >
                  Powered by Appwrite
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;