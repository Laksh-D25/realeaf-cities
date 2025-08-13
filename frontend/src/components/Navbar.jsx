'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import useUserStore from '@/store/auth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const primaryLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const featureLinks = [
    { href: '/eco-hubs', label: 'Eco-Hubs' },
    { href: '/events', label: 'Events' },
    { href: '/waste-management', label: 'Waste Management' },
    { href: '/forum', label: 'Forum' },
  ];

  const accentColors = ['#A8D5E2', '#F9A620', '#FFD449', '#548C2F'];
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const { user, profile, signOut } = useUserStore();
  const [userOpen, setUserOpen] = useState(false);
  const userCloseRef = useRef(null);

  const openFeatures = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setFeaturesOpen(true);
  };

  const delayedCloseFeatures = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setFeaturesOpen(false), 180);
  };

  const openUser = () => {
    if (userCloseRef.current) {
      clearTimeout(userCloseRef.current);
      userCloseRef.current = null;
    }
    setUserOpen(true);
  };

  const delayedCloseUser = () => {
    if (userCloseRef.current) clearTimeout(userCloseRef.current);
    userCloseRef.current = setTimeout(() => setUserOpen(false), 180);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#104911] backdrop-blur text-white border-b border-[var(--border)] text-[#104911]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" onError={(e) => { e.currentTarget.src = '/next.svg'; }} />
              <span className="text-base sm:text-lg font-bold tracking-tight">ReleafCities</span>
            </Link>
          </div>

          {/* Centered navigation */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
            {primaryLinks.map((link, idx) => (
              <Link key={link.href} href={link.href} className="group inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:bg-[#072408]/80 px-2 py-1 rounded-md">
                <span>{link.label}</span>
                <span className="h-2 w-2 rounded-full transition-transform group-hover:scale-110" style={{ backgroundColor: accentColors[idx % accentColors.length] }} />
              </Link>
            ))}

            {/* Features dropdown (desktop) */}
            <div
              className="relative"
              onMouseEnter={openFeatures}
              onMouseLeave={delayedCloseFeatures}
              onFocus={openFeatures}
              onBlur={delayedCloseFeatures}
            >
              <button className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <span>Features</span>
                <svg className={`h-4 w-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              <div className={`absolute left-1/2 z-30 top-full pt-3 w-56 -translate-x-1/2 transition ${featuresOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[#104911] shadow-lg">
                  <div className="p-2">
                    {featureLinks.map((link, idx) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-[#072408]/30"
                      >
                        <span>{link.label}</span>
                        <span className="ml-3 h-2 w-2 rounded-full" style={{ backgroundColor: accentColors[idx % accentColors.length] }} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <Link href="/login" className="inline-flex items-center rounded-md bg-[#F9A620] px-4 py-2 text-sm font-semibold text-[#104911] shadow-sm hover:bg-[#FFD449] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#548C2F]">
                Login / Sign Up
              </Link>
            ) : (
              <div
                className="relative"
                onMouseEnter={openUser}
                onMouseLeave={delayedCloseUser}
                onFocus={openUser}
                onBlur={delayedCloseUser}
              >
                <button className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#A8D5E2] text-[#104911] font-bold">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </span>
                  <svg className={`h-4 w-4 transition-transform ${userOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className={`absolute right-0 z-30 top-full pt-3 w-48 transition ${userOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[#104911] shadow-lg">
                    <div className="p-1">
                      <Link href="/profile" className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-[#072408]/30">Profile</Link>
                      <button onClick={signOut} className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium hover:bg-[#072408]/30">Sign Out</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-[#104911] hover:bg-[#A8D5E2]/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#548C2F]"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {primaryLinks.map((link, idx) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-[#104911]/80 hover:text-[#104911] hover:bg-[#A8D5E2]/40"
                onClick={() => setIsOpen(false)}
              >
                <span>{link.label}</span>
                <span className="ml-3 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentColors[idx % accentColors.length] }} />
              </Link>
            ))}

            {/* Mobile features accordion */}
            <details className="rounded-md px-3 py-2 bg-[#A8D5E2]/10">
              <summary className="list-none flex items-center justify-between cursor-pointer text-base font-semibold text-[#104911]">
                <span>Features</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="mt-2 space-y-1">
                {featureLinks.map((link, idx) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[#104911]/80 hover:text-[#104911] hover:bg-[#A8D5E2]/40"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{link.label}</span>
                    <span className="ml-3 h-2 w-2 rounded-full" style={{ backgroundColor: accentColors[idx % accentColors.length] }} />
                  </Link>
                ))}
              </div>
            </details>
            <div className="mt-2">
              {!user ? (
                <Link href="/login" className="block rounded-md bg-[#F9A620] px-3 py-2 text-center text-sm font-semibold text-[#104911] hover:bg-[#FFD449]" onClick={() => setIsOpen(false)}>
                  Login / Sign Up
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link href="/profile" className="block rounded-md px-3 py-2 text-base font-medium text-[#104911]/80 hover:text-[#104911] hover:bg-[#A8D5E2]/40" onClick={() => setIsOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={signOut} className="w-full rounded-md px-3 py-2 text-left text-base font-medium text-[#104911]/80 hover:text-[#104911] hover:bg-[#A8D5E2]/40">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* playful accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#A8D5E2] via-[#FFD449] to-[#F9A620]" />
    </header>
  );
};

export default Navbar;


