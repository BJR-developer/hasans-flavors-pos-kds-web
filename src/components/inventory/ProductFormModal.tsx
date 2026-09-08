'use client';

import React, { useState, useRef, useMemo } from 'react';
import { X, Sparkles, UploadCloud, Loader2, Trash2, CheckCircle2, Star, Plus, Layers, Zap } from 'lucide-react';
import { Dish, Category, DishVariantGroup, DishVariantOption } from '@/types';
import { useAddDish, useUpdateDish } from '@/hooks/useRestaurantData';
import { SafeImage } from '@/components/common/SafeImage';
import { supabase } from '@/lib/supabase';
import { SelectDropdown, DropdownOption } from '@/components/common/SelectDropdown';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishToEdit?: Dish | null;
  categories: Category[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  dishToEdit,
  categories,
}: ProductFormModalProps) {
  if (!isOpen) return null;

  return (
    <ProductFormContent
      key={dishToEdit?.id || 'new-product'}
      onClose={onClose}
      dishToEdit={dishToEdit}
      categories={categories}
    />
  );
}

function ProductFormContent({
  onClose,
  dishToEdit,
  categories,
}: {
  onClose: () => void;
  dishToEdit?: Dish | null;
  categories: Category[];
}) {
  const addDishMutation = useAddDish();
  const updateDishMutation = useUpdateDish();

  const [name, setName] = useState(() => dishToEdit?.name || '');
  const [category, setCategory] = useState(
    () => dishToEdit?.category || categories[1]?.name || 'Combo Meals -Rice & Biryani'
  );
  const [price, setPrice] = useState(() => (dishToEdit ? dishToEdit.price.toString() : '150'));

  // Support multiple images
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (dishToEdit?.imageUrls && dishToEdit.imageUrls.length > 0) {
      return dishToEdit.imageUrls;
    }
    return dishToEdit?.imageUrl ? [dishToEdit.imageUrl] : [];
  });
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);

  const [description, setDescription] = useState(() => dishToEdit?.description || '');
  const [preparationTime, setPreparationTime] = useState(
    () => dishToEdit?.preparationTime || '15-20 mins'
  );
  const [inStock, setInStock] = useState(() => (dishToEdit ? dishToEdit.inStock : true));
  const [isChefSpecial, setIsChefSpecial] = useState(
    () => (dishToEdit ? dishToEdit.isChefSpecial || false : false)
  );

  const categoryOptions: DropdownOption[] = useMemo(() => {
    return categories
      .filter((c) => c.id !== 'all')
      .map((c) => ({ value: c.name, label: c.name }));
  }, [categories]);

  // Custom Product Variants State
  const [variants, setVariants] = useState<DishVariantGroup[]>(() => {
    if (dishToEdit?.variants && dishToEdit.variants.length > 0) {
      return dishToEdit.variants;
    }
    return [];
  });

  // Variant helper functions
  const handleAddVariantGroup = (name = 'New Option Group', prefilledOptions?: DishVariantOption[]) => {
    const newGroup: DishVariantGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      required: true,
      options: prefilledOptions || [
        { id: `opt_${Date.now()}_1`, name: 'Option 1', priceDelta: 0 },
        { id: `opt_${Date.now()}_2`, name: 'Option 2', priceDelta: 50 },
      ],
    };
    setVariants((prev) => [...prev, newGroup]);
  };

  const handleRemoveVariantGroup = (groupId: string) => {
    setVariants((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    setVariants((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g))
    );
  };

  const handleAddOptionToGroup = (groupId: string) => {
    setVariants((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const newOpt: DishVariantOption = {
          id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: '',
          priceDelta: 0,
        };
        return { ...g, options: [...g.options, newOpt] };
      })
    );
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setVariants((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, options: g.options.filter((o) => o.id !== optionId) };
      })
    );
  };

  const handleUpdateOption = (
    groupId: string,
    optionId: string,
    field: 'name' | 'priceDelta',
    val: string | number
  ) => {
    setVariants((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.map((o) => (o.id === optionId ? { ...o, [field]: val } : o)),
        };
      })
    );
  };

  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileList) {
      if (!file.type.startsWith('image/')) {
        setUploadError(`"${file.name}" is not a valid image file. Allowed: PNG, JPG, WEBP, GIF.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      validFiles.push(file);
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const ext = file.name.split('.').pop() || 'jpg';
        const cleanBase = file.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${cleanBase || 'dish'}.${ext}`;

        const { data, error } = await supabase.storage
          .from('dishes')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
          });

        if (error) {
          throw error;
        }

        const { data: urlData } = supabase.storage.from('dishes').getPublicUrl(data?.path || fileName);
        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      setImageUrls((prev) => {
        const next = [...prev, ...uploadedUrls];
        if (prev.length === 0) setSelectedPreviewIndex(0);
        return next;
      });
    } catch (err: any) {
      console.error('Failed to upload images:', err);
      setUploadError(err.message || 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesUpload(e.target.files);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    setImageUrls((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
    setSelectedPreviewIndex(0);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    if (selectedPreviewIndex >= index) {
      setSelectedPreviewIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (imageUrls.length === 0) {
      setUploadError('Please upload at least one image for this product before saving.');
      return;
    }

    const priceNum = parseFloat(price) || 0;
    const primaryUrl = imageUrls[0] || '';

    let station: 'tandoor' | 'biryani_curry' | 'sides_drinks' | 'general' = 'general';
    const catLow = category.toLowerCase();
    const nameLow = name.toLowerCase();
    if (catLow.includes('biryani') || catLow.includes('rice') || catLow.includes('curry')) {
      station = 'biryani_curry';
    } else if (catLow.includes('bbq') || nameLow.includes('kabab') || nameLow.includes('paratha')) {
      station = 'tandoor';
    } else if (catLow.includes('drink') || catLow.includes('snack') || nameLow.includes('lassi')) {
      station = 'sides_drinks';
    }

    // Derive spice level dynamically from variants ONLY if a spice variant is configured - never default to 2
    let effectiveSpiceLevel = 0;
    const spiceGroup = variants.find((v) => v.name.toLowerCase().includes('spice'));
    if (spiceGroup && spiceGroup.options.length > 0) {
      const optName = spiceGroup.options[0].name.toLowerCase();
      if (optName.includes('mild')) effectiveSpiceLevel = 1;
      else if (optName.includes('medium')) effectiveSpiceLevel = 2;
      else if (optName.includes('hot')) effectiveSpiceLevel = 3;
      else if (optName.includes('fiery') || optName.includes('very')) effectiveSpiceLevel = 4;
      else effectiveSpiceLevel = 1;
    }

    if (dishToEdit) {
      updateDishMutation.mutate({
        dishId: dishToEdit.id,
        data: {
          name: name.trim(),
          category,
          price: priceNum,
          imageUrl: primaryUrl,
          imageUrls,
          description: description.trim() || 'Delicious authentic Pakistani specialty.',
          spiceLevel: effectiveSpiceLevel,
          preparationTime,
          inStock,
          isChefSpecial,
          station,
          variants,
        },
      });
    } else {
      addDishMutation.mutate({
        name: name.trim(),
        category,
        price: priceNum,
        imageUrl: primaryUrl,
        imageUrls,
        description: description.trim() || 'Delicious authentic Pakistani specialty.',
        spiceLevel: effectiveSpiceLevel,
        isHalal: true,
        isChefSpecial,
        isPopular: false,
        inStock,
        preparationTime,
        calories: '450 kcal',
        station,
        variants,
      });
    }

    onClose();
  };

  const activePreviewUrl = imageUrls[selectedPreviewIndex] || imageUrls[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-[#E5E5E5] my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F1F1F]">
              {dishToEdit ? 'Edit Menu Product' : 'Add New Menu Product'}
            </h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Updates immediately across POS register, KDS, and tables
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1F1F1F] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Dish Name */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Product / Dish Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mutton Shinwari Karahi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          {/* Category, Price & Prep Time in Responsive 3-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                Category *
              </label>
              <SelectDropdown
                value={category}
                options={categoryOptions}
                onChange={(val) => setCategory(val)}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                Price (₱) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#737373]">
                  ₱
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="150"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                Prep Time
              </label>
              <input
                type="text"
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                placeholder="15-20 mins"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
              />
            </div>
          </div>

          {/* Multiple Product Images Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#1F1F1F]">
                Product Images * ({imageUrls.length})
              </label>
              {imageUrls.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#166534]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {imageUrls.length} image{imageUrls.length > 1 ? 's' : ''} uploaded
                </span>
              )}
            </div>

            {/* Hidden native multiple file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onFileInputChange}
              className="hidden"
            />

            {/* Active Primary / Selected Preview */}
            {activePreviewUrl && (
              <div className="mb-3 relative border border-[#E5E5E5] rounded-xl overflow-hidden bg-[#FAFAFA] p-2 space-y-2">
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 border border-[#E5E5E5]">
                  <SafeImage
                    src={activePreviewUrl}
                    alt="Product Preview"
                    fill
                    className="object-cover"
                    sizes="500px"
                  />
                  {selectedPreviewIndex === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#1F1F1F]/80 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                      <span>Primary Cover</span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1.5">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span className="text-xs font-semibold">Uploading images to cloud storage...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Thumbnails & Management Grid */}
            {imageUrls.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <span className="text-[10px] font-semibold text-[#737373] block uppercase tracking-wider">
                  Uploaded Gallery (First image is primary cover):
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {imageUrls.map((url, idx) => {
                    const isSelected = idx === selectedPreviewIndex;
                    const isPrimary = idx === 0;

                    return (
                      <div
                        key={url + idx}
                        onClick={() => setSelectedPreviewIndex(idx)}
                        className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all aspect-square bg-[#FAFAFA] ${
                          isSelected ? 'border-[#BA1A20] ring-2 ring-[#BA1A20]/20' : 'border-[#E5E5E5] hover:border-[#A3A3A3]'
                        }`}
                      >
                        <SafeImage
                          src={url}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                        {isPrimary && (
                          <div className="absolute top-1 left-1 bg-[#1F1F1F] text-white p-0.5 rounded shadow-xs" title="Primary Cover">
                            <Star className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" />
                          </div>
                        )}

                        {/* Hover Overlay with Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMakePrimary(idx);
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1F1F1F] text-white hover:bg-black w-full text-center"
                              title="Set as primary cover"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="p-1 rounded text-white bg-[#BA1A20] hover:bg-[#8B0000]"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add More Button inside grid */}
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D4D4D4] hover:border-[#BA1A20] hover:bg-[#FFF2F0] aspect-square transition-all text-[#737373] hover:text-[#BA1A20] disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-bold leading-none">Add More</span>
                  </button>
                </div>
              </div>
            )}

            {/* Empty Upload Dropzone */}
            {imageUrls.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#BA1A20] bg-[#FFF2F0]'
                    : 'border-[#D4D4D4] bg-[#FAFAFA] hover:bg-[#F5F5F5] hover:border-[#A3A3A3]'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#BA1A20]" />
                    <span className="text-xs font-bold text-[#1F1F1F]">Uploading images to storage...</span>
                    <span className="text-[11px] text-[#737373]">Please wait a moment</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] shadow-2xs flex items-center justify-center text-[#BA1A20]">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1F1F1F] block">
                        Upload Product Images (Multiple allowed)
                      </span>
                      <span className="text-[11px] text-[#737373] mt-0.5 block">
                        Drag &amp; drop or click to select multiple PNG, JPG, WEBP, or GIF files
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] text-[#BA1A20] font-semibold mt-1.5">
                {uploadError}
              </p>
            )}
          </div>

          {/* Custom Product Variants Builder */}
          <div className="pt-3 border-t border-[#E5E5E5] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <label className="block text-xs font-bold text-[#1F1F1F]">
                  Product Variants &amp; Options ({variants.length})
                </label>
                <p className="text-[11px] text-[#737373]">
                  Define sizes, spice levels, protein choices, or custom options
                </p>
              </div>

              {/* Quick Prefill Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleAddVariantGroup('Portion / Size', [
                      { id: `opt_${Date.now()}_1`, name: 'Regular', priceDelta: 0 },
                      { id: `opt_${Date.now()}_2`, name: 'Large', priceDelta: 80 },
                      { id: `opt_${Date.now()}_3`, name: 'Family Bilao', priceDelta: 350 },
                    ])
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] text-[#1F1F1F] text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Size</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddVariantGroup('Spice Level', [
                      { id: `opt_${Date.now()}_1`, name: 'Mild', priceDelta: 0 },
                      { id: `opt_${Date.now()}_2`, name: 'Medium', priceDelta: 0 },
                      { id: `opt_${Date.now()}_3`, name: 'Hot Spicy', priceDelta: 0 },
                      { id: `opt_${Date.now()}_4`, name: 'Very Spicy', priceDelta: 0 },
                    ])
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] text-[#1F1F1F] text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-red-600" />
                  <span>+ Spice</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddVariantGroup('Meat / Protein', [
                      { id: `opt_${Date.now()}_1`, name: 'Chicken', priceDelta: 0 },
                      { id: `opt_${Date.now()}_2`, name: 'Beef', priceDelta: 50 },
                      { id: `opt_${Date.now()}_3`, name: 'Mutton / Lamb', priceDelta: 90 },
                    ])
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] text-[#1F1F1F] text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-neutral-600" />
                  <span>+ Protein</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddVariantGroup('Custom Option')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1F1F1F] hover:bg-black text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Custom</span>
                </button>
              </div>
            </div>

            {/* List of Variant Groups */}
            {variants.length > 0 ? (
              <div className="space-y-3">
                {variants.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Layers className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                        <input
                          type="text"
                          value={grp.name}
                          onChange={(e) => handleUpdateGroupName(grp.id, e.target.value)}
                          placeholder="Variant Group Name (e.g. Size, Spice, Protein)"
                          className="px-2.5 py-1 text-xs font-bold text-[#1F1F1F] bg-white border border-[#E5E5E5] rounded-md flex-1 min-w-0 focus:outline-none focus:border-[#1F1F1F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantGroup(grp.id)}
                        className="p-1 rounded-md text-[#A3A3A3] hover:text-[#BA1A20] hover:bg-[#FFF2F0] transition-colors shrink-0 cursor-pointer"
                        title="Remove Variant Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Options Table */}
                    <div className="space-y-2 sm:pl-5">
                      {grp.options.map((opt) => (
                        <div key={opt.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => handleUpdateOption(grp.id, opt.id, 'name', e.target.value)}
                            placeholder="Option label (e.g. Regular, Mild, Chicken)"
                            className="flex-1 min-w-0 px-3 py-1.5 text-xs text-[#1F1F1F] bg-white border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#1F1F1F] placeholder-[#A3A3A3]"
                          />
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-28 shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#737373] pointer-events-none">
                                +₱
                              </span>
                              <input
                                type="number"
                                value={opt.priceDelta}
                                onChange={(e) =>
                                  handleUpdateOption(
                                    grp.id,
                                    opt.id,
                                    'priceDelta',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs font-semibold text-[#1F1F1F] bg-white border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#1F1F1F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                            {grp.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionFromGroup(grp.id, opt.id)}
                                className="p-1.5 text-[#A3A3A3] hover:text-[#BA1A20] hover:bg-[#FFF2F0] rounded-lg transition-colors shrink-0 cursor-pointer"
                                title="Remove option"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddOptionToGroup(grp.id)}
                        className="text-[11px] font-semibold text-[#525252] hover:text-[#1F1F1F] flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5] text-center text-xs text-[#737373]">
                No variants configured yet. Use the quick buttons above (+ Size, + Spice, + Protein) or add Custom options.
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Description &amp; Ingredients
            </label>
            <textarea
              rows={2}
              placeholder="Freshly prepared with slow-cooked aromatic spices and premium halal cuts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          {/* Stock & Chef Special Toggles */}
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1F1F1F]">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded text-[#BA1A20] focus:ring-0"
              />
              <span>In Stock (Available for ordering)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#B45309]">
              <input
                type="checkbox"
                checked={isChefSpecial}
                onChange={(e) => setIsChefSpecial(e.target.checked)}
                className="w-4 h-4 rounded text-[#B45309] focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Chef&apos;s Special
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#525252] hover:bg-[#F5F5F5] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#BA1A20] hover:bg-[#8B0000] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {dishToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
