'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getInviteQRUrl, getJoinUrl } from '@/lib/qr';

interface Props {
  groupCode: string;
  chamaName: string;
}

export default function InviteQR({ groupCode, chamaName }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const qrUrl = getInviteQRUrl(groupCode, 250);
  const joinUrl = getJoinUrl(groupCode);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Join our Chama "${chamaName}" on SmartChama! Use invite code: ${groupCode} or click: ${joinUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[#22C55E] transition-colors"
        type="button"
      >
        <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
        Invite Members
      </button>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center">
              <h3 className="text-xl font-bold text-[var(--text-primary)] font-geist mb-1">
                Invite to {chamaName}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Scan the QR code or share the invite link
              </p>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-sm">
                <Image
                  src={qrUrl}
                  alt={`QR code to join ${chamaName}`}
                  width={250}
                  height={250}
                  className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px]"
                  unoptimized
                />
              </div>

              {/* Group Code */}
              <div className="bg-[var(--bg-page)] border border-[var(--border)] rounded-lg p-3 mb-4">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Group Code</p>
                <p className="text-2xl font-bold font-mono text-[#22C55E] tracking-[0.3em]">
                  {groupCode}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[#22C55E] transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check_circle' : 'content_copy'}
                  </span>
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1da851] transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
