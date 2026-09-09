'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Category } from '@/types';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useRestaurantData';
import { SafeImage } from '@/components/common/SafeImage';
import { supabase } from '@/lib/supabase';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  onCreated?: (categoryName: string) => void;
}

const PRESET_CATEGORY_IMAGES = [
  { label: 'Biryani & Rice', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Curry & Gravy', url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80' },
  { label: 'BBQ & Grills', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80' },
  { label: 'Rolls & Fast Food', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80' },
  { label: 'Desserts & Sweets', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
  { label: 'Drinks & Beverages', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
  { label: 'Breads & Naan', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
  { label: 'Appetizers', url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80' },
];

export function CategoryFormModal({
  isOpen,
  onClose,
  categoryToEdit,
  onCreated,
}: CategoryFormModalProps) {
  if (!isOpen) return null;

  return (
    <CategoryFormModalContent
      key={categoryToEdit?.id || 'new-category'}
      onClose={onClose}
      categoryToEdit={categoryToEdit}
      onCreated={onCreated}
    />
  );
}

function CategoryFormModalContent({
  onClose,
  categoryToEdit,
  onCreated,
}: {
  onClose: () => void;
  categoryToEdit?: Category | null;
  onCreated?: (categoryName: string) => void;
}) {
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const [name, setName] = useState(() => categoryToEdit?.name || '');
  const [imageUrl, setImageUrl] = useState(() => categoryToEdit?.imageUrl || PRESET_CATEGORY_IMAGES[0].url);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
      const fileName = `cat-${Date.now()}-${cleanBase || 'cover'}.${ext}`;

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
      console.error('Failed to upload category image:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    try {
      if (categoryToEdit) {
        await updateCategoryMutation.mutateAsync({
          id: categoryToEdit.id,
          updates: {
            name: cleanName,
            imageUrl: imageUrl.trim() || undefined,
          },
        });
      } else {
        const created = await createCategoryMutation.mutateAsync({
          name: cleanName,
          imageUrl: imageUrl.trim() || undefined,
        });
        if (onCreated) {
          onCreated(created.name);
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setUploadError(err.message || 'Failed to save category.');
    }
  };

  const isSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E5E5E5] my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F1F1F]">
              {categoryToEdit ? 'Edit Category' : 'Create New Category'}
            </h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Available immediately in POS register, inventory filter, and customer app
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

          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Desserts & Sweets, Appetizers, Hot Beverages"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          {/* Category Cover Image Section */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1.5">
              Category Cover Photo
            </label>

            {/* Image Preview Box */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E5E5] mb-2.5">
              <SafeImage
                src={imageUrl}
                alt="Category Cover Preview"
                fill
                className="object-cover"
                sizes="400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                <span className="text-xs font-bold truncate">{name || 'Category Name'}</span>
                <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded-full font-medium">Cover Preview</span>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1.5">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Uploading photo...</span>
                </div>
              )}
            </div>

            {/* Upload Button + File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />

            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] text-xs font-semibold text-[#1F1F1F] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#BA1A20]" />
                <span>Upload Custom Image</span>
              </button>

              <span className="text-[11px] text-[#737373]">or choose a preset below</span>
            </div>

            {/* Preset Image Thumbnails */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                Popular Presets:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_CATEGORY_IMAGES.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`group relative rounded-lg overflow-hidden border-2 aspect-video transition-all cursor-pointer ${
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
                        sizes="100px"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-end p-1 transition-colors">
                        <span className="text-[9px] font-bold text-white truncate leading-none drop-shadow-xs">
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
                <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
