'use client';

import React, { useState, useRef } from 'react';
import { X, Loader2, AlertCircle, UploadCloud, CheckCircle2 } from 'lucide-react';
import { AddonOption } from '@/types';
import { useCreateAddon, useUpdateAddon } from '@/hooks/useRestaurantData';
import { SafeImage } from '@/components/common/SafeImage';
import { supabase } from '@/lib/supabase';

interface AddonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addonToEdit?: AddonOption | null;
}

const PRESET_ADDON_IMAGES = [
  { label: 'Raitha & Yoghurt', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=300&q=80' },
  { label: 'Boiled Egg', url: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?auto=format&fit=crop&w=300&q=80' },
  { label: 'Biryani Salan / Gravy', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=300&q=80' },
  { label: 'Tandoori Roti / Naan', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80' },
  { label: 'Gulab Jamun Dessert', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80' },
  { label: 'Mango Lassi Drink', url: 'https://images.unsplash.com/photo-1571006687898-3483df24388e?auto=format&fit=crop&w=300&q=80' },
  { label: 'Garlic Dip / Chutney', url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=300&q=80' },
  { label: 'Fried Papad / Crackers', url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=300&q=80' },
];

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
  const [imageUrl, setImageUrl] = useState(() => addonToEdit?.imageUrl || PRESET_ADDON_IMAGES[0].url);
  const [inStock, setInStock] = useState(() => (addonToEdit ? addonToEdit.inStock !== false : true));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanBase = file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const fileName = `addon-${Date.now()}-${cleanBase || 'thumb'}.${ext}`;

      const { data, error } = await supabase.storage
        .from('dishes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('dishes')
        .getPublicUrl(data?.path || fileName);

      if (urlData?.publicUrl) {
        setImageUrl(urlData.publicUrl);
      }
    } catch (err: any) {
      console.error('Failed to upload addon image:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setUploadError('Please provide a name for the side or add-on.');
      return;
    }

    const priceNum = Math.max(0, parseFloat(price) || 0);

    setUploadError(null);
    try {
      if (addonToEdit) {
        await updateAddonMutation.mutateAsync({
          id: addonToEdit.id,
          updates: {
            name: cleanName,
            price: priceNum,
            imageUrl: imageUrl.trim() || undefined,
            inStock,
          },
        });
      } else {
        await createAddonMutation.mutateAsync({
          name: cleanName,
          price: priceNum,
          imageUrl: imageUrl.trim() || undefined,
          inStock,
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save addon:', err);
      setUploadError(err?.message || 'Failed to save side / add-on.');
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
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
          </div>

          {/* Add-on Photo Section */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1.5">
              Add-on Thumbnail Image
            </label>

            {/* Thumbnail Preview Box */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] mb-2">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-[#E5E5E5]">
                {imageUrl ? (
                  <SafeImage
                    src={imageUrl}
                    alt="Add-on preview"
                    fill
                    className="object-cover"
                    sizes="60px"
                  />
                ) : null}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-[#1F1F1F] block truncate">
                  {name || 'Add-on Name'}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#166534]">
                  +₱{parseFloat(price) || 0}
                </span>
              </div>
            </div>

            {/* Upload Button + Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />

            <div className="flex items-center gap-2 mb-2.5">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] text-xs font-semibold text-[#1F1F1F] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#BA1A20]" />
                <span>Upload Custom Image</span>
              </button>

              <span className="text-[11px] text-[#737373]">or choose a preset:</span>
            </div>

            {/* Preset Thumbnails */}
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_ADDON_IMAGES.map((preset) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`group relative rounded-lg overflow-hidden border-2 aspect-square transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#BA1A20] ring-2 ring-[#BA1A20]/20'
                        : 'border-[#E5E5E5] hover:border-neutral-400'
                    }`}
                    title={preset.label}
                  >
                    <SafeImage
                      src={preset.url}
                      alt={preset.label}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-end p-1 transition-colors">
                      <span className="text-[8px] font-bold text-white truncate leading-none drop-shadow-xs">
                        {preset.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-[#BA1A20] text-white p-0.5 rounded-full shadow-xs">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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
              disabled={isSaving || isUploading || !name.trim()}
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
