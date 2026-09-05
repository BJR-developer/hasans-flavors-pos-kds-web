'use client';

import React from 'react';
import { X, Keyboard, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      key: '/',
      altKey: 'F',
      title: 'Focus Search',
      description: 'Instantly jump cursor into the search bar to filter dishes.',
      category: 'Catalog Navigation',
    },
    {
      key: '1',
      title: 'Dine-In Channel',
      description: 'Switch active ticket channel to Dine-In table service.',
      category: 'Service Channels',
    },
    {
      key: '2',
      title: 'Takeout Channel',
      description: 'Switch active ticket channel to Takeout counter pickup.',
      category: 'Service Channels',
    },
    {
      key: '3',
      title: 'Delivery Channel',
      description: 'Switch active ticket channel to Online Delivery.',
      category: 'Service Channels',
    },
    {
      key: 'Enter',
      altKey: 'Space',
      title: 'Charge Cash & Print',
      description: 'Quickly submit ticket, process cash payment, and print 80mm bill.',
      category: 'Checkout Actions',
    },
    {
      key: 'Esc',
      title: 'Clear / Close Modal',
      description: 'Clears current search query or closes any open popup dialog.',
      category: 'Navigation',
    },
    {
      key: '?',
      title: 'Open / Close Shortcuts',
      description: 'Toggle this training cheatsheet anytime from anywhere in POS.',
      category: 'Help & Training',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E5E5E5] my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F1F1F] text-white flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F]">
                Cashier Speed Training &amp; Keyboard Shortcuts
              </h3>
              <p className="text-[11px] text-[#737373]">
                Work 3x faster without touching the mouse for routine tasks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1F1F1F] hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="p-3 rounded-xl bg-[#FFF2F0] border border-[#FFDAD6] flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-[#BA1A20] shrink-0 mt-0.5" />
            <p className="text-xs text-[#5B403D] leading-relaxed">
              <span className="font-bold text-[#BA1A20]">Pro Tip for Rush Hours:</span> Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#FFDAD6] text-[10px] font-mono font-bold text-[#1F1F1F]">
                /
              </kbd>{' '}
              to type dish name, tap card to add, then press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#FFDAD6] text-[10px] font-mono font-bold text-[#1F1F1F]">
                Enter
              </kbd>{' '}
              to charge exact cash and print receipt immediately!
            </p>
          </div>

          <div className="divide-y divide-[#F5F5F5] border border-[#E5E5E5] rounded-xl overflow-hidden bg-white">
            {shortcuts.map((sc) => (
              <div
                key={sc.title}
                className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAFAFA] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1F1F1F]">{sc.title}</span>
                    <span className="text-[9px] text-[#A3A3A3] font-semibold uppercase">
                      {sc.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737373] mt-0.5">{sc.description}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <kbd className="min-w-[28px] h-7 px-2 rounded-md bg-[#F5F5F5] border border-[#D4D4D4] text-xs font-mono font-bold text-[#1F1F1F] flex items-center justify-center shadow-2xs">
                    {sc.key}
                  </kbd>
                  {sc.altKey && (
                    <>
                      <span className="text-[10px] text-[#A3A3A3]">or</span>
                      <kbd className="min-w-[28px] h-7 px-2 rounded-md bg-[#F5F5F5] border border-[#D4D4D4] text-xs font-mono font-bold text-[#1F1F1F] flex items-center justify-center shadow-2xs">
                        {sc.altKey}
                      </kbd>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#737373]">
            Press <kbd className="px-1 py-0.5 rounded bg-white border border-[#D4D4D4] font-mono font-bold">Esc</kbd> anytime to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1F1F1F] text-white text-xs font-bold hover:bg-[#383838] transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
