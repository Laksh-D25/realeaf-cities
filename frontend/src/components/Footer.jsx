import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[#104911] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" /* onError={(e) => { e.currentTarget.src = '/next.svg'; }} */ />
              <span className="text-base sm:text-lg font-bold">ReleafCities</span>
            </div>
            <p className="text-sm text-white">
              Cities that are Sustainable, Resilient, and Inclusive.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-white hover:bg-[#072408]/80 py-1 px-2 rounded-md">About</Link></li>
              <li><Link href="/features" className="text-white hover:bg-[#072408]/80 py-1 px-2 rounded-md">Features</Link></li>
              <li><Link href="/contact" className="text-white hover:bg-[#072408]/80 py-1 px-2 rounded-md">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-white hover:bg-[#072408]/80 py-1 px-2 rounded-md">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-white hover:bg-[#072408]/80 py-1 px-2 rounded-md">Terms of Service</Link></li>
              <li><Link href="/help" className="text-white hover:bg-[#072408]/80 py-1 px-2 rounded-md">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Get Started</h3>
            <div className="flex gap-3">
              <Link href="/login" className="inline-flex items-center rounded-md bg-[#F9A620] px-4 py-2 text-sm font-semibold text-[#104911] shadow-sm hover:bg-[#FFD449]">Login / Sign Up</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--border)] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">© {new Date().getFullYear()} ReleafCities. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-white/70 hover:bg-[#072408]/80 py-1 px-2 rounded-md">Privacy</Link>
            <span className="text-gray-300">|</span>
            <Link href="/terms" className="text-white/70 hover:bg-[#072408]/80 py-1 px-2 rounded-md">Terms</Link>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#A8D5E2] via-[#FFD449] to-[#F9A620]" />
    </footer>
  );
};

export default Footer;


