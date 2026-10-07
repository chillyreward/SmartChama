'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/components/AuthProvider';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, member } = useAuth();
  const isLoggedIn = !!session;
  const dashboardPath = member?.role && ['admin', 'chairlady', 'treasurer', 'secretary'].includes(member.role) ? '/admin/dashboard' : '/dashboard';

  return (
    <header className="sidebar-bg border-b border-[var(--border)] sticky top-0 z-50 transition-colors duration-300 backdrop-blur-md bg-opacity-95">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="SmartChama"
              width={38}
              height={38}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="text-[18px] sm:text-[22px] font-bold tracking-tight text-[var(--text-main)] max-[400px]:hidden">
              SmartChama
            </span>
          </div>
        </Link>
        
        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors relative py-1 group"
          >
            <span>Features</span>
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#22C55E] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#how-it-works"
            className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors relative py-1 group"
          >
            <span>How It Works</span>
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#22C55E] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#pricing"
            className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors relative py-1 group"
          >
            <span>Pricing & Plans</span>
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#22C55E] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/about"
            className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors relative py-1 group"
          >
            <span>About Us</span>
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#22C55E] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>
        
        {/* Desktop right buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link href={dashboardPath} className="bg-[#22C55E] text-white text-[15px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#16a34a] transition-all shadow-sm">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-[15px] font-medium hover:text-[#22C55E] transition-colors px-3 py-2 text-[var(--text-primary)]">
                Sign In
              </Link>
              <Link href="/signup" className="bg-[#22C55E] text-white text-[15px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#16a34a] transition-all shadow-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile right header */}
        <div className="flex lg:hidden items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link href={dashboardPath} className="bg-[#22C55E] text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold hover:bg-[#16a34a] transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-[14px] font-semibold hover:text-[#22C55E] transition-colors py-2 px-1 text-[var(--text-primary)]">
                Sign In
              </Link>
              <Link href="/signup" className="bg-[#22C55E] text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold hover:bg-[#16a34a] transition-colors max-[360px]:hidden">
                Get Started
              </Link>
            </>
          )}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE FULL SCREEN MENU */}
      <div className={`fixed inset-0 z-50 page-bg flex flex-col transform transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Menu header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border)]">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="SmartChama"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-[20px] font-bold tracking-tight text-[var(--text-main)]">
                SmartChama
              </span>
            </div>
          </Link>
          
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] hover:bg-emerald-500/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu links */}
        <nav className="flex flex-col px-6 pt-6 gap-2">
          {[
            { href: '/#features', label: 'Features' },
            { href: '/#how-it-works', label: 'How It Works' },
            { href: '/#pricing', label: 'Pricing & Plans' },
            { href: '/about', label: 'About Us' },
            { href: '/contact', label: 'Contact Support' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-4 text-[17px] font-medium text-[var(--text-main)] border-b border-[var(--border)] flex items-center justify-between hover:text-[#22C55E] transition-colors"
            >
              {link.label}
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </nav>

        {/* Bottom CTA */}
        <div className="mt-auto px-6 pb-12 flex flex-col gap-3">
          <Link
            href="/signup"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-center bg-[#22C55E] text-white py-3.5 rounded-xl text-[16px] font-semibold hover:bg-[#16a34a] transition-colors shadow-md"
          >
            Create Your Group Free
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-center card-bg border border-[var(--border)] text-[var(--text-main)] py-3.5 rounded-xl text-[16px] font-semibold hover:border-[#22C55E] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
