'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Send,
} from 'lucide-react';
import { Order } from '@/types';
import {
  formatDeliveryShareText,
  getOrderMapsUrl,
  shareOrder,
} from '@/lib/shareOrder';

interface ShareOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export function ShareOrderModal({ isOpen, onClose, order }: ShareOrderModalProps) {
  const [copied, setCopied] = useState<'all' | 'address' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const shareText = formatDeliveryShareText(order);
  const mapsUrl = getOrderMapsUrl(order);

  const handleNativeShare = async () => {
    const res = await shareOrder(order);
    if (res.success) {
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleCopyText = async (type: 'all' | 'address') => {
    const textToCopy =
      type === 'address'
        ? `${order.deliveryAddress || ''}${mapsUrl ? `\nGoogle Maps: ${mapsUrl}` : ''}`.trim()
        : shareText;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(type);
      setStatusMessage(
        type === 'address'
          ? 'Address copied! Ready to paste into Messenger, Instagram, or SMS.'
          : 'Full order summary copied to clipboard!'
      );
      setTimeout(() => {
        setCopied(null);
        setStatusMessage(null);
      }, 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#BA1A20] flex items-center justify-center text-white">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Share Delivery Location</h3>
              <p className="text-[11px] text-neutral-400">
                Order {order.orderNumber} • {order.customerName || 'Valued Diner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Location Summary Box */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#BA1A20] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Delivery Destination
                </span>
                <p className="text-xs font-bold text-neutral-900 leading-snug break-words">
                  {order.deliveryAddress || 'No address specified'}
                </p>
                {order.specialNotes && (
                  <p className="text-[11px] text-amber-900 bg-amber-50/80 p-1 rounded border border-amber-200/60 mt-1 italic">
                    Note: {order.specialNotes}
                  </p>
                )}
              </div>
            </div>

            {mapsUrl && (
              <div className="pt-1 flex items-center gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Share Options */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400 block">
              Share Anywhere
            </span>

            {/* Device Share Sheet (Messenger, Instagram, Messages, etc.) */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-3 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via Apps (Messenger, Instagram, SMS...)</span>
            </button>

            {/* Secondary Direct Channels */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-2.5 rounded-lg border border-neutral-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              <a
                href={smsUrl}
                className="py-2 px-2.5 rounded-lg border border-neutral-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>SMS / Text</span>
              </a>
            </div>
          </div>

          {/* Copy Buttons */}
          <div className="space-y-1.5 pt-1 border-t border-neutral-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCopyText('address')}
                className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied === 'address' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Address Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Copy Address Only</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopyText('all')}
                className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied === 'all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Full Info Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Copy Full Order</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Formatted Message Preview
            </span>
            <pre className="p-2.5 rounded-lg bg-neutral-900 text-neutral-100 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto border border-neutral-800">
              {shareText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
