'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function NumberPromptDialog({
  open,
  title,
  label,
  initialValue,
  min = 1,
  max = 180,
  suffix,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  label: string;
  initialValue: number;
  min?: number;
  max?: number;
  suffix?: string;
  onSubmit: (value: number) => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <PromptBody
          key={`${title}-${initialValue}`}
          title={title}
          label={label}
          initialValue={initialValue}
          min={min}
          max={max}
          suffix={suffix}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    </AnimatePresence>
  );
}

function PromptBody({
  title,
  label,
  initialValue,
  min,
  max,
  suffix,
  onSubmit,
  onCancel,
}: {
  title: string;
  label: string;
  initialValue: number;
  min: number;
  max: number;
  suffix?: string;
  onSubmit: (value: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(initialValue));
  const parsed = parseInt(value, 10);
  const valid = !isNaN(parsed) && parsed >= min && parsed <= max;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <motion.form
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(parsed);
        }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-line p-6 space-y-4"
      >
        <h3 className="text-base font-extrabold text-ink">{title}</h3>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink-soft">{label}</span>
          <div className="relative">
            <input
              type="number"
              autoFocus
              min={min}
              max={max}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2.5 text-lg font-bold rounded-xl border border-line focus:outline-none focus:border-ink"
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
          </div>
          {!valid && <span className="text-xs text-rose-600">Enter a number from {min} to {max}.</span>}
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-soft hover:bg-neutral-100">
            Cancel
          </button>
          <button type="submit" disabled={!valid} className="px-4 py-2 rounded-xl bg-ink text-white text-sm font-bold disabled:opacity-50">
            Save
          </button>
        </div>
      </motion.form>
    </div>
  );
}
