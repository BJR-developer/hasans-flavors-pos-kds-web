'use client';

import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { AddonOption } from '@/types';
import { useCreateAddon, useUpdateAddon } from '@/hooks/useRestaurantData';

interface AddonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addonToEdit?: AddonOption | null;
}

export function AddonFormModal({
  isOpen,
  onClose,
  addonToEdit,
}: AddonFormModalProps) {
  if (!isOpen) return null;

  return (
    <AddonFormModalContent
      key={addonToEdit?.id || 'new-addon'}
      onClose={onClose}
      addonToEdit={addonToEdit}
    />
  );
}

function AddonFormModalContent({
  onClose,
  addonToEdit,
}: {
  onClose: () => void;
  addonToEdit?: AddonOption | null;
}) {
  const createAddonMutation = useCreateAddon();
  const updateAddonMutation = useUpdateAddon();

  const [name, setName] = useState(() => addonToEdit?.name || '');
  const [price, setPrice] = useState(() => (addonToEdit ? String(addonToEdit.price) : '40'));
  const [inStock, setInStock] = useState(() => (addonToEdit ? addonToEdit.inStock !== false : true));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide a name for the side or add-on.');
      return;
    }

    const priceNum = Math.max(0, parseFloat(price) || 0);

    setError(null);
    try {
      if (addonToEdit) {
        await updateAddonMutation.mutateAsync({
          id: addonToEdit.id,
          updates: {
            name: cleanName,
            price: priceNum,
            inStock,
          },
        });
      } else {
        await createAddonMutation.mutateAsync({
          name: cleanName,
          price: priceNum,
          inStock,
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save addon:', err);
      setError(err?.message || 'Failed to save side / add-on.');
    }
  };

  const isSaving = createAddonMutation.isPending || updateAddonMutation.isPending;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E5E5E5] my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F1F1F]">
              {addonToEdit ? 'Edit Side / Add-on' : 'Create New Side / Add-on'}
            </h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Available immediately across POS customizer and customer mobile app
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1F1F1F] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add-on Name */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Add-on Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Extra Mint Cucumber Raitha, Garlic Dip"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Price (₱) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#737373]">
                +₱
              </span>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="40"
                className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <p className="text-[11px] text-[#737373] mt-1">
              Added to unit price when selected by cashier or diner
            </p>
          </div>

          {/* In Stock Toggle */}
          <div className="pt-2 border-t border-[#F5F5F5]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1F1F1F]">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded text-[#BA1A20] focus:ring-0"
              />
              <span>In Stock (Available for ordering)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#525252] hover:bg-[#F5F5F5] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#BA1A20] hover:bg-[#8B0000] rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{addonToEdit ? 'Save Changes' : 'Create Add-on'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
