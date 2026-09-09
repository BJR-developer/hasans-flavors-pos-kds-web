'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  UtensilsCrossed,
  X,
  Loader2,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Category, Dish } from '@/types';
import { useCategories, useDishes, useDeleteCategory } from '@/hooks/useRestaurantData';
import { CategoryFormModal } from './CategoryFormModal';
import { SafeImage } from '@/components/common/SafeImage';

export function CategoryManagementTab() {
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: dishes = [] } = useDishes();
  const deleteCategoryMutation = useDeleteCategory();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Filter out the pseudo "all" category for direct management
  const manageCategories = useMemo(() => {
    return categories.filter((c) => c.id !== 'all' && c.name.toLowerCase() !== 'all dishes');
  }, [categories]);

  // Compute live dish count per category
  const categoriesWithDishCount = useMemo(() => {
    return manageCategories.map((cat) => {
      const count = dishes.filter(
        (d) => d.category && d.category.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return {
        ...cat,
        dishCount: count,
      };
    });
  }, [manageCategories, dishes]);

  // Search filter
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoriesWithDishCount;
    const q = searchQuery.toLowerCase().trim();
    return categoriesWithDishCount.filter((c) => c.name.toLowerCase().includes(q));
  }, [categoriesWithDishCount, searchQuery]);

  // Summary Metrics
  const totalCategories = manageCategories.length;
  const totalDishes = dishes.length;
  const uncategorizedDishes = useMemo(() => {
    const knownNames = new Set(manageCategories.map((c) => c.name.toLowerCase()));
    return dishes.filter((d) => !d.category || !knownNames.has(d.category.toLowerCase())).length;
  }, [dishes, manageCategories]);

  const handleDeleteCategory = async (cat: Category, dishCount: number) => {
    if (dishCount > 0) {
      alert(`Cannot delete "${cat.name}" because ${dishCount} dish(es) are currently assigned to it. Please reassign those dishes to another category in the Menu & Stock tab first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${cat.name}"? This action cannot be undone.`)) {
      try {
        await deleteCategoryMutation.mutateAsync({ id: cat.id, name: cat.name });
      } catch (err: any) {
        alert(err?.message || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
            Menu Categories
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1F1F1F] font-mono">{totalCategories}</span>
            <span className="text-xs font-semibold text-[#737373]">active sections</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534] block mb-1">
            Total Menu Items
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#166534] font-mono">{totalDishes}</span>
            <span className="text-xs font-semibold text-[#737373]">catalog dishes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
            Unassigned Items
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1F1F1F] font-mono">{uncategorizedDishes}</span>
            <span className="text-xs font-semibold text-[#737373]">without valid section</span>
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E5E5E5] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search category by name..."
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

        {/* Add Category Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {isCategoriesLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#737373] gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#BA1A20]" />
          <span className="text-xs font-semibold">Loading menu categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E5E5E5] p-12 text-center text-[#737373] space-y-3">
          <Info className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <div>
            <p className="text-sm font-bold text-[#1F1F1F]">No categories found</p>
            <p className="text-xs text-[#737373] mt-0.5">
              Click &quot;Add New Category&quot; above to create your first menu section.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-[#E5E5E5] hover:border-[#D4D4D4] shadow-2xs overflow-hidden flex flex-col justify-between transition-all group"
            >
              {/* Cover Photo */}
              <div className="relative h-36 w-full bg-neutral-100 overflow-hidden">
                <SafeImage
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-103 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                
                {/* Badge Overlay */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-neutral-900 backdrop-blur-xs shadow-xs flex items-center gap-1">
                    <UtensilsCrossed className="w-2.5 h-2.5 text-[#BA1A20]" />
                    <span>{cat.dishCount} {cat.dishCount === 1 ? 'Dish' : 'Dishes'}</span>
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <h4 className="text-sm font-bold truncate drop-shadow-xs">{cat.name}</h4>
                  <span className="text-[10px] text-white/80 block mt-0.5">Slug: /{cat.slug || cat.id}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-3.5 py-2.5 bg-[#FAFAFA] border-t border-[#E5E5E5] flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#737373]">
                  {cat.dishCount > 0 ? `${cat.dishCount} items active` : 'No items yet'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCategoryToEdit(cat)}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-[#E5E5E5]"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat, cat.dishCount)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer border border-transparent ${
                      cat.dishCount > 0
                        ? 'text-neutral-300 hover:text-neutral-400 cursor-not-allowed'
                        : 'text-neutral-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                    }`}
                    title={
                      cat.dishCount > 0
                        ? `Cannot delete category while ${cat.dishCount} dishes belong to it`
                        : 'Delete Category'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <CategoryFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Edit Category Modal */}
      {categoryToEdit && (
        <CategoryFormModal
          isOpen={!!categoryToEdit}
          categoryToEdit={categoryToEdit}
          onClose={() => setCategoryToEdit(null)}
        />
      )}
    </div>
  );
}
