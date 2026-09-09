'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Info,
  Layers,
} from 'lucide-react';
import { AddonOption } from '@/types';
import {
  useAddons,
  useDeleteAddon,
  useToggleAddonStock,
} from '@/hooks/useRestaurantData';
import { AddonFormModal } from './AddonFormModal';

export function AddonManagementTab() {
  const { data: addons = [], isLoading } = useAddons();
  const deleteAddonMutation = useDeleteAddon();
  const toggleStockMutation = useToggleAddonStock();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outofstock'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addonToEdit, setAddonToEdit] = useState<AddonOption | null>(null);

  // Filtered addons
  const filteredAddons = useMemo(() => {
    return addons.filter((item) => {
      const isAvailable = item.inStock !== false;
      if (stockFilter === 'instock' && !isAvailable) return false;
      if (stockFilter === 'outofstock' && isAvailable) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [addons, stockFilter, searchQuery]);

  const totalCount = addons.length;
  const inStockCount = addons.filter((a) => a.inStock !== false).length;
  const outOfStockCount = totalCount - inStockCount;

  const handleToggleStock = async (addon: AddonOption) => {
    const current = addon.inStock !== false;
    try {
      await toggleStockMutation.mutateAsync({ id: addon.id, inStock: !current });
    } catch (err: any) {
      alert(err?.message || 'Failed to update stock status');
    }
  };

  const handleDelete = async (addon: AddonOption) => {
    if (window.confirm(`Are you sure you want to delete "${addon.name}"?`)) {
      try {
        await deleteAddonMutation.mutateAsync(addon.id);
      } catch (err: any) {
        alert(err?.message || 'Failed to delete add-on');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Action & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E5E5E5] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sides & add-ons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] placeholder-[#A3A3A3] focus:bg-white focus:outline-none focus:border-[#1F1F1F] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#1F1F1F] p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Stock Filter Pills & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg border border-[#E5E5E5]/80">
            {[
              { id: 'all', label: `All (${totalCount})` },
              { id: 'instock', label: `Available (${inStockCount})` },
              { id: 'outofstock', label: `Out of Stock (${outOfStockCount})` },
            ].map((tab) => {
              const isSelected = stockFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStockFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-white text-[#1F1F1F] shadow-2xs'
                      : 'text-[#737373] hover:text-[#1F1F1F]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Side / Add-on</span>
          </button>
        </div>
      </div>

      {/* Grid of Addon Cards */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#737373] gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#BA1A20]" />
          <span className="text-xs font-semibold">Loading sides &amp; add-ons...</span>
        </div>
      ) : filteredAddons.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E5E5E5] p-12 text-center text-[#737373] space-y-3">
          <Info className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <div>
            <p className="text-sm font-bold text-[#1F1F1F]">No add-ons match your filter</p>
            <p className="text-xs text-[#737373] mt-0.5">
              Click &quot;Add New Side / Add-on&quot; above to create sides such as Raita, Salan, or Roti.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredAddons.map((addon) => {
            const isAvailable = addon.inStock !== false;

            return (
              <div
                key={addon.id}
                className="bg-white rounded-xl border border-[#E5E5E5] hover:border-[#D4D4D4] p-4 flex flex-col justify-between shadow-2xs transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-[#1F1F1F] leading-snug">
                      {addon.name}
                    </h4>

                    <span className="font-mono font-bold text-sm text-[#1F1F1F] shrink-0">
                      +₱{addon.price.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#737373]">
                    Displayed in POS item customizer and mobile dish checkout
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#F5F5F5] flex items-center justify-between gap-2">
                  {/* Stock Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStock(addon)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer select-none border ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                    }`}
                    title="Click to toggle stock availability"
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span>Out of Stock</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAddonToEdit(addon)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                      title="Edit Name & Price"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(addon)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Add-on"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddonFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {addonToEdit && (
        <AddonFormModal
          isOpen={!!addonToEdit}
          addonToEdit={addonToEdit}
          onClose={() => setAddonToEdit(null)}
        />
      )}
    </div>
  );
}
