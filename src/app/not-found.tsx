'use client';

import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F0C] flex items-center justify-center p-6 text-[#161d16] dark:text-[#E8F0E4]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="SmartChama"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
        </div>

        <h1 className="text-[48px] font-bold text-[#161d16] dark:text-[#E8F0E4] leading-none mb-2 font-geist">
          404
        </h1>
        <h2 className="text-[20px] font-semibold text-[#161d16] dark:text-[#E8F0E4] mb-3">
          Page not found
        </h2>
        <p className="text-[15px] text-[#60645f] dark:text-[#8FA88F] mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <a 
            href="/"
            className="bg-[#22C55E] text-white px-6 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#006e2f] transition-colors"
          >
            Go to Home
          </a>
          <a 
            href="/dashboard"
            className="bg-white dark:bg-[#1a2218] border border-[#E5E7EB] dark:border-[#2d3d2d] text-[#161d16] dark:text-[#E8F0E4] px-6 py-3 rounded-lg text-[15px] font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
