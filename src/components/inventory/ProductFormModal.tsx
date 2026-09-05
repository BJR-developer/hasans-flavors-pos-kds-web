'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Dish, Category } from '@/types';
import { useAddDish, useUpdateDish } from '@/hooks/useRestaurantData';
import { SafeImage } from '@/components/common/SafeImage';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishToEdit?: Dish | null;
  categories: Category[];
}

const PRESET_IMAGES = [
  { label: 'Biryani Platter', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80' },
  { label: 'Curry & Karahi', url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80' },
  { label: 'BBQ & Kebab', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { label: 'Roll / Burger', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80' },
  { label: 'Cold Drink / Lassi', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80' },
  { label: 'Roti / Naan', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80' },
];

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
  const [imageUrl, setImageUrl] = useState(() => dishToEdit?.imageUrl || PRESET_IMAGES[0].url);
  const [description, setDescription] = useState(() => dishToEdit?.description || '');
  const [spiceLevel, setSpiceLevel] = useState(() => dishToEdit?.spiceLevel || 2);
  const [preparationTime, setPreparationTime] = useState(
    () => dishToEdit?.preparationTime || '15-20 mins'
  );
  const [inStock, setInStock] = useState(() => (dishToEdit ? dishToEdit.inStock : true));
  const [isChefSpecial, setIsChefSpecial] = useState(
    () => (dishToEdit ? dishToEdit.isChefSpecial || false : false)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const priceNum = parseFloat(price) || 0;

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

    if (dishToEdit) {
      updateDishMutation.mutate({
        dishId: dishToEdit.id,
        data: {
          name: name.trim(),
          category,
          price: priceNum,
          imageUrl: imageUrl.trim(),
          description: description.trim() || 'Delicious authentic Pakistani specialty.',
          spiceLevel,
          preparationTime,
          inStock,
          isChefSpecial,
          station,
        },
      });
    } else {
      addDishMutation.mutate({
        name: name.trim(),
        category,
        price: priceNum,
        imageUrl: imageUrl.trim(),
        description: description.trim() || 'Delicious authentic Pakistani specialty.',
        spiceLevel,
        isHalal: true,
        isChefSpecial,
        isPopular: false,
        inStock,
        preparationTime,
        calories: '450 kcal',
        station,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E5E5E5] my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
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
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1F1F1F] hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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

          {/* Category & Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
              >
                {categories.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                Price (₱) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="150"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
              />
            </div>
          </div>

          {/* Image Selection */}
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Photo / Image URL
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F] mb-2"
            />

            {/* Presets chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-[#737373] font-semibold">Quick Presets:</span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                    imageUrl === preset.url
                      ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                      : 'bg-white text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gray-100 border border-[#E5E5E5]">
              <SafeImage
                src={imageUrl}
                alt="Preview"
                fill
                className="object-cover"
                sizes="500px"
              />
            </div>
          )}

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

          {/* Spice & Prep Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                Spice Level (1 - 4)
              </label>
              <select
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
              >
                <option value={1}>Level 1 - Mild</option>
                <option value={2}>Level 2 - Medium</option>
                <option value={3}>Level 3 - Spicy</option>
                <option value={4}>Level 4 - Fiery Special</option>
              </select>
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
              className="px-4 py-2 text-xs font-semibold text-[#525252] hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#BA1A20] hover:bg-[#8B0000] rounded-lg transition-colors shadow-xs"
            >
              {dishToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
