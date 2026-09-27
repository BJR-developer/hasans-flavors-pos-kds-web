'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  badge?: string | number;
  sublabel?: string;
}

export interface DropdownActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface SelectDropdownProps {
  value: string | number;
  options: DropdownOption[];
  onChange: (val: any) => void;
  labelPrefix?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  fullWidth?: boolean;
  actionItem?: DropdownActionItem;
}

export function SelectDropdown({
  value,
  options,
  onChange,
  labelPrefix,
  placeholder = 'Select an option',
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  fullWidth = false,
  actionItem,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected option object
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-line bg-white text-xs font-semibold text-ink hover:border-[#D4D4D4] hover:bg-canvas active:bg-[#F5F5F5] transition-all shadow-2xs cursor-pointer select-none focus:outline-none focus:border-ink ${
          fullWidth ? 'w-full' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {icon && <span className="text-muted shrink-0">{icon}</span>}
          {labelPrefix && (
            <span className="text-muted font-medium shrink-0">{labelPrefix}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-[#F5F5F5] text-muted group-hover:bg-[#EAEAEA] shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-ink' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 min-w-[200px] max-w-[320px] max-h-64 overflow-y-auto bg-white border border-line rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 ${
            fullWidth ? 'w-full' : ''
          } ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);

            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-brand-soft text-brand font-bold'
                    : 'text-ink hover:bg-[#F5F5F5] font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-xs text-muted font-normal truncate">
                      ({opt.sublabel})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {opt.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                        isSelected
                          ? 'bg-brand/10 text-brand'
                          : 'bg-[#F5F5F5] text-muted'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                </div>
              </button>
            );
          })}

          {actionItem && (
            <div className="pt-1 mt-1 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  actionItem.onClick();
                }}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft rounded-lg text-left transition-colors cursor-pointer"
              >
                {actionItem.icon || <Plus className="w-3.5 h-3.5" />}
                <span>{actionItem.label}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
