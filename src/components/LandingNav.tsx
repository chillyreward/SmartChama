'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sidebar-bg border-b border-[var(--border)] sticky top-0 z-50 transition-colors duration-300">
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
        
        {/* Desktop nav links — hidden mobile */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-[15px] font-medium text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:text-[#8FA88F] dark:hover:text-[#4ae176] transition-colors">
            Features
          </Link>
          <Link href="/#how-it-works" className="text-[15px] font-medium text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:text-[#8FA88F] dark:hover:text-[#4ae176] transition-colors">
            How It Works
          </Link>
          <Link href="/#pricing" className="text-[15px] font-medium text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:text-[#8FA88F] dark:hover:text-[#4ae176] transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-[15px] font-medium text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:text-[#8FA88F] dark:hover:text-[#4ae176] transition-colors">
            About
          </Link>
        </nav>
        
        {/* Desktop right buttons — hidden mobile */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-[15px] font-medium text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:text-[#8FA88F] dark:hover:text-[#4ae176] transition-colors mr-1">
            Sign In
          </Link>
          <Link href="/signup" className="bg-[#22C55E] text-white text-[15px] font-semibold px-5 py-2.5 rounded hover:bg-[#006e2f] transition-colors ml-1">
            Get Started
          </Link>
        </div>

        {/* Mobile right — shown only on mobile */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-[14px] font-semibold text-[#8FA88F] hover:text-[#4ae176] transition-colors py-2 px-1">
            Sign In
          </Link>
          <Link href="/signup" className="bg-[#22C55E] text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold hover:bg-[#1ea94e] transition-colors max-[360px]:hidden">
            Get Started
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center text-[var(--text-main)] hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              menu
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE FULL SCREEN MENU */}
      <div className={`fixed inset-0 z-50 page-bg flex flex-col transform transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Menu header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-[var(--border)]">
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
          
          <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <span className="material-symbols-outlined text-[24px] text-[var(--text-main)]">
              close
            </span>
          </button>
        </div>

        {/* Menu links */}
        <nav className="flex flex-col px-6 pt-8 gap-1">
          {[
            { href: '#features', label: 'Features' },
            { href: '#how-it-works', label: 'How It Works' },
            { href: '#pricing', label: 'Pricing' },
            { href: '/about', label: 'About Us' },
            { href: '/contact', label: 'Contact' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-4 text-[18px] font-medium text-[var(--text-main)] border-b border-[var(--border)] flex items-center justify-between"
            >
              {link.label}
              <span className="material-symbols-outlined text-[20px] text-[#9CA3AF]">
                chevron_right
              </span>
            </Link>
          ))}
        </nav>

        {/* Bottom CTA */}
        <div className="mt-auto px-6 pb-12 flex flex-col gap-3">
          <Link
            href="/signup"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-center bg-[#22C55E] text-white py-4 rounded-xl text-[16px] font-semibold"
          >
            Create Your Group Free
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-center card-bg border border-[var(--border)] text-[var(--text-main)] py-4 rounded-xl text-[16px] font-semibold"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
