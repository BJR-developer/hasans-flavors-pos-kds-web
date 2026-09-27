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
  useUpdateAddonStockQuantity,
} from '@/hooks/useRestaurantData';
import { AddonFormModal } from './AddonFormModal';
import { SafeImage } from '@/components/common/SafeImage';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/lib/auth';

export function AddonManagementTab() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const { data: addons = [], isLoading } = useAddons();
  const deleteAddonMutation = useDeleteAddon();
  const toggleStockMutation = useToggleAddonStock();
  const updateStockQtyMutation = useUpdateAddonStockQuantity();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outofstock'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addonToEdit, setAddonToEdit] = useState<AddonOption | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AddonOption | null>(null);

  // Filtered addons
  const filteredAddons = useMemo(() => {
    return addons.filter((item) => {
      const isAvailable = item.inStock !== false && (item.stockQuantity === undefined || item.stockQuantity > 0);
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
  const inStockCount = addons.filter((a) => a.inStock !== false && (a.stockQuantity === undefined || a.stockQuantity > 0)).length;
  const outOfStockCount = totalCount - inStockCount;

  const handleToggleStock = async (addon: AddonOption) => {
    const current = addon.inStock !== false;
    try {
      await toggleStockMutation.mutateAsync({ id: addon.id, inStock: !current });
    } catch (err: any) {
      alert(err?.message || 'Failed to update stock status');
    }
  };

  const handleUpdateStockQty = async (addon: AddonOption, quantity: number) => {
    const safeQty = Math.max(0, quantity);
    try {
      await updateStockQtyMutation.mutateAsync({ id: addon.id, quantity: safeQty });
    } catch (err: any) {
      alert(err?.message || 'Failed to update stock quantity');
    }
  };

  const handleDelete = (addon: AddonOption) => {
    setConfirmDelete(addon);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAddonMutation.mutateAsync(confirmDelete.id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete add-on');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-line shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sides & add-ons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-line bg-canvas text-ink placeholder-[#A3A3A3] focus:bg-white focus:outline-none focus:border-ink transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-ink p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Stock Filter Pills & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg border border-line/80">
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
                      ? 'bg-white text-ink shadow-2xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Side / Add-on</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Addon Cards */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
          <span className="text-xs font-semibold">Loading sides &amp; add-ons...</span>
        </div>
      ) : filteredAddons.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-line p-12 text-center text-muted space-y-3">
          <Info className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <div>
            <p className="text-sm font-bold text-ink">No add-ons match your filter</p>
            <p className="text-xs text-muted mt-0.5">
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
                className="bg-white rounded-xl border border-line hover:border-[#D4D4D4] p-3.5 flex flex-col justify-between shadow-2xs transition-all group"
              >
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    {/* Image Thumbnail */}
                    {addon.imageUrl ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-line">
                        <SafeImage
                          src={addon.imageUrl}
                          alt={addon.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="60px"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-canvas border border-line flex items-center justify-center text-xs font-bold text-neutral-400 shrink-0">
                        +Add
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-ink leading-snug line-clamp-2">
                          {addon.name}
                        </h4>
                        <span className="font-mono font-bold text-xs text-[#166534] shrink-0">
                          +₱{addon.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1 line-clamp-1">
                        Sides &amp; add-ons selection
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 mt-2 border-t border-[#F5F5F5] flex items-center justify-between gap-2">
                  {/* Stock Stepper & Status Badge */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center border border-line rounded-lg bg-canvas p-0.5 shadow-2xs hover:border-[#A3A3A3] focus-within:border-ink focus-within:bg-white transition-colors">
                      <button
                        type="button"
                        onClick={() => handleUpdateStockQty(addon, Math.max(0, (addon.stockQuantity ?? 50) - 1))}
                        className="w-5 h-5 flex items-center justify-center text-muted hover:text-ink hover:bg-line rounded text-xs font-bold cursor-pointer"
                        title="Decrease stock (-1)"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        defaultValue={addon.stockQuantity ?? 50}
                        key={`${addon.id}_${addon.stockQuantity}`}
                        onBlur={(e) => handleUpdateStockQty(addon, parseInt(e.target.value, 10) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-10 text-center text-xs font-bold text-ink bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Directly edit stock quantity"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateStockQty(addon, (addon.stockQuantity ?? 50) + 1)}
                        className="w-5 h-5 flex items-center justify-center text-muted hover:text-ink hover:bg-line rounded text-xs font-bold cursor-pointer"
                        title="Increase stock (+1)"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStock(addon)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                      }`}
                      title="Click to toggle availability"
                    >
                      {isAvailable ? 'In Stock' : 'Out'}
                    </button>
                  </div>

                  {isOwner && (
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
                  )}
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

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Add-on"
        message={`Are you sure you want to delete "${confirmDelete?.name}"?`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
