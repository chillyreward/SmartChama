"use client";

import { useState } from "react";
import { Shield, ExternalLink, QrCode, X } from "lucide-react";
import Image from "next/image";

interface BlockchainBadgeProps {
  transactionHash?: string;
  qrCode?: string;
  explorerUrl?: string;
  size?: "sm" | "md" | "lg";
}

export default function BlockchainBadge({
  transactionHash,
  qrCode,
  explorerUrl,
  size = "md",
}: BlockchainBadgeProps) {
  const [showQR, setShowQR] = useState(false);

  if (!transactionHash) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Blockchain Badge */}
        <div
          className={`
            inline-flex items-center gap-1.5
            bg-gradient-to-r from-purple-500 to-pink-500
            text-white rounded-full
            ${sizeClasses[size]}
            font-medium
          `}
        >
          <Shield size={iconSizes[size]} />
          <span>Blockchain Verified</span>
        </div>

        {/* QR Code Button */}
        {qrCode && (
          <button
            onClick={() => setShowQR(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="View QR Code"
          >
            <QrCode size={iconSizes[size]} className="text-purple-600" />
          </button>
        )}

        {/* Explorer Link */}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="View on Blockchain Explorer"
          >
            <ExternalLink size={iconSizes[size]} className="text-purple-600" />
          </a>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && qrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            {/* Close Button */}
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2">Blockchain Verified</h3>
              <p className="text-gray-600 mb-6">
                Scan this QR code to verify the transaction on the blockchain
              </p>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-purple-200 inline-block mb-4">
                <Image
                  src={qrCode}
                  alt="Transaction QR Code"
                  width={200}
                  height={200}
                  className="w-48 h-48"
                />
              </div>

              {/* Transaction Hash */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                <p className="text-xs font-mono text-gray-800 break-all">
                  {transactionHash}
                </p>
              </div>

              {/* Explorer Link */}
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                >
                  View on Polygon Explorer
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
