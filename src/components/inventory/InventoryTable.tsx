'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Search,
  X,
  Plus,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Dish } from '@/types';
import {
  useDishes,
  useCategories,
  useToggleDishStock,
  useBulkDeleteDishes,
  useBulkUpdateDishStock,
} from '@/hooks/useRestaurantData';
import { ProductFormModal } from './ProductFormModal';
import { SafeImage } from '@/components/common/SafeImage';

const STORAGE_KEY = 'hasans_inventory_prefs_v1';

interface InventoryTablePreferences {
  sorting: SortingState;
  pageSize: number;
  selectedCat: string;
  stockFilter: 'all' | 'instock' | 'outofstock' | 'special';
  priceFilter: 'all' | 'under150' | '150to300' | 'above300' | 'custom';
  customMin: string;
  customMax: string;
}

function formatLastUpdated(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '—';
  }
}

export function InventoryTable() {
  const { data: dishes = [] } = useDishes();
  const { data: categories = [] } = useCategories();
  const toggleStockMutation = useToggleDishStock();
  const bulkDeleteMutation = useBulkDeleteDishes();
  const bulkUpdateStockMutation = useBulkUpdateDishStock();

  // Sorting & Filtering State
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outofstock' | 'special'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under150' | '150to300' | 'above300' | 'custom'>('all');
  const [customMin, setCustomMin] = useState<string>('');
  const [customMax, setCustomMax] = useState<string>('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  // Persistence loaded flag
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.sorting)) setSorting(parsed.sorting);
        if (typeof parsed.pageSize === 'number') {
          setPagination((prev) => ({ ...prev, pageSize: parsed.pageSize }));
        }
        if (typeof parsed.selectedCat === 'string') setSelectedCat(parsed.selectedCat);
        if (typeof parsed.stockFilter === 'string') setStockFilter(parsed.stockFilter);
        if (typeof parsed.priceFilter === 'string') setPriceFilter(parsed.priceFilter);
        if (typeof parsed.customMin === 'string') setCustomMin(parsed.customMin);
        if (typeof parsed.customMax === 'string') setCustomMax(parsed.customMax);
      }
    } catch (e) {
      console.error('Failed to load table preferences from localStorage:', e);
    } finally {
      setIsPrefsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isPrefsLoaded) return;
    try {
      const prefs: InventoryTablePreferences = {
        sorting,
        pageSize: pagination.pageSize,
        selectedCat,
        stockFilter,
        priceFilter,
        customMin,
        customMax,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save table preferences to localStorage:', e);
    }
  }, [
    isPrefsLoaded,
    sorting,
    pagination.pageSize,
    selectedCat,
    stockFilter,
    priceFilter,
    customMin,
    customMax,
  ]);

  // Row Selection State
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Bulk Delete Modal State
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Search input ref for keyboard shortcut ('/')
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (e.key === '/' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Product Create / Edit Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<Dish | null>(null);

  // Check if any non-default filter is active
  const isFiltered =
    globalFilter.trim() !== '' ||
    selectedCat !== 'all' ||
    stockFilter !== 'all' ||
    priceFilter !== 'all' ||
    customMin !== '' ||
    customMax !== '';

  const resetFilters = () => {
    setGlobalFilter('');
    setSelectedCat('all');
    setStockFilter('all');
    setPriceFilter('all');
    setCustomMin('');
    setCustomMax('');
    setSorting([{ id: 'name', desc: false }]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const filteredData = useMemo(() => {
    return dishes.filter((dish) => {
      // Category filter
      if (selectedCat !== 'all') {
        const cat = categories.find((c) => c.id === selectedCat);
        if (cat && cat.match) {
          const reg = new RegExp(cat.match, 'i');
          if (!reg.test(dish.name) && !reg.test(dish.category)) {
            return false;
          }
        }
      }

      // Stock & Special filter
      if (stockFilter === 'instock' && !dish.inStock) return false;
      if (stockFilter === 'outofstock' && dish.inStock) return false;
      if (stockFilter === 'special' && !dish.isChefSpecial) return false;

      // Price filter
      if (priceFilter === 'under150' && dish.price >= 150) return false;
      if (priceFilter === '150to300' && (dish.price < 150 || dish.price > 300)) return false;
      if (priceFilter === 'above300' && dish.price <= 300) return false;
      if (priceFilter === 'custom') {
        const min = parseFloat(customMin);
        const max = parseFloat(customMax);
        if (!isNaN(min) && dish.price < min) return false;
        if (!isNaN(max) && dish.price > max) return false;
      }

      return true;
    });
  }, [dishes, selectedCat, stockFilter, priceFilter, customMin, customMax, categories]);

  // Current active sort value for the minimalist sort dropdown
  const currentSortKey = useMemo(() => {
    if (!sorting || sorting.length === 0) return 'name-asc';
    const primary = sorting[0];
    return `${primary.id}-${primary.desc ? 'desc' : 'asc'}`;
  }, [sorting]);

  const handleQuickSortChange = (key: string) => {
    const [id, dir] = key.split('-');
    setSorting([{ id, desc: dir === 'desc' }]);
  };

  const columns = useMemo<ColumnDef<Dish>[]>(
    () => [
      // Checkbox Column on Left
      {
        id: 'select',
        enableSorting: false,
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              ref={(input) => {
                if (input) {
                  input.indeterminate = table.getIsSomePageRowsSelected();
                }
              }}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="w-4 h-4 rounded border-[#D4D4D4] text-[#BA1A20] focus:ring-[#BA1A20] accent-[#BA1A20] cursor-pointer block m-0 p-0"
              title="Select all on this page"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
              className="w-4 h-4 rounded border-[#D4D4D4] text-[#BA1A20] focus:ring-[#BA1A20] accent-[#BA1A20] cursor-pointer block m-0 p-0"
              title={`Select ${row.original.name}`}
            />
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Dish / Product',
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0 border border-[#E5E5E5]">
                <SafeImage
                  src={d.imageUrl}
                  alt={d.name}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-[#1F1F1F] truncate block max-w-xs">
                    {d.name}
                  </span>
                  {d.isChefSpecial && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                      <Sparkles className="w-2.5 h-2.5" /> Special
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#737373] line-clamp-1 max-w-xs">
                  {d.description}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-xs text-[#525252]">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <span className="text-xs font-bold text-[#1F1F1F]">
            ₱{row.original.price.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'inStock',
        header: 'Stock Status',
        cell: ({ row }) => {
          const inStock = row.original.inStock;
          return (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                inStock
                  ? 'text-[#2E7D32] bg-[#E8F5E9]'
                  : 'text-[#BA1A20] bg-[#FFF2F0]'
              }`}
            >
              {inStock ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Available</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  <span>Out of Stock</span>
                </>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Update',
        sortingFn: (rowA, rowB) => {
          const timeA = rowA.original.updatedAt
            ? new Date(rowA.original.updatedAt).getTime()
            : rowA.original.createdAt
            ? new Date(rowA.original.createdAt).getTime()
            : 0;
          const timeB = rowB.original.updatedAt
            ? new Date(rowB.original.updatedAt).getTime()
            : rowB.original.createdAt
            ? new Date(rowB.original.createdAt).getTime()
            : 0;
          return timeA - timeB;
        },
        cell: ({ row }) => {
          const val = row.original.updatedAt || row.original.createdAt;
          return (
            <span
              className="text-xs text-[#737373] whitespace-nowrap block"
              title={val ? new Date(val).toLocaleString() : undefined}
            >
              {formatLastUpdated(val)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span>Manage</span>,
        cell: ({ row }) => {
          const dish = row.original;
          const isAvailable = dish.inStock;

          return (
            <div className="flex items-center justify-end gap-2 pr-1">
              {/* Edit Product */}
              <button
                type="button"
                onClick={() => {
                  setDishToEdit(dish);
                  setIsFormModalOpen(true);
                }}
                className="p-1 rounded text-[#737373] hover:text-[#1F1F1F] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                title="Edit Product"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Availability Button */}
              <button
                type="button"
                onClick={() => toggleStockMutation.mutate(dish.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  isAvailable
                    ? 'border border-[#E5E5E5] text-[#737373] hover:text-[#BA1A20] hover:bg-[#FFF2F0]'
                    : 'bg-[#1F1F1F] text-white hover:bg-[#383838]'
                }`}
              >
                {isAvailable ? 'Mark Out of Stock' : 'Set Available'}
              </button>
            </div>
          );
        },
      },
    ],
    [toggleStockMutation]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
    },
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const q = filterValue.toLowerCase();
      const d = row.original;
      return d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
    },
  });

  // Selected items array
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );
  const selectedDishes = useMemo(() => {
    const idSet = new Set(selectedIds);
    return dishes.filter((d) => idSet.has(d.id));
  }, [dishes, selectedIds]);

  const handleExecuteBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      setRowSelection({});
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to bulk delete dishes:', err);
    }
  };

  const handleBulkSetStock = async (inStock: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateStockMutation.mutateAsync({ dishIds: selectedIds, inStock });
      setRowSelection({});
    } catch (err) {
      console.error('Failed to bulk update dish stock:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-[1720px] mx-auto w-full space-y-4">
      {/* Header with Title & Add Product Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#1F1F1F]">
              Menu Products &amp; Stock Availability
            </h1>
          </div>
          <p className="text-xs text-[#737373] mt-0.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#A3A3A3]" />
            <span>
              Manage dishes, stock availability, and bulk delete operations across your restaurant system.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDishToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Floating / Sticky Bulk Action Bar when items are marked */}
      {selectedIds.length > 0 && (
        <div className="bg-[#1F1F1F] text-white px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#BA1A20] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold whitespace-nowrap">
              {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} marked
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mark In Stock */}
            <button
              type="button"
              disabled={bulkUpdateStockMutation.isPending || bulkDeleteMutation.isPending}
              onClick={() => handleBulkSetStock(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Mark all selected items as Available (In Stock)"
            >
              {bulkUpdateStockMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Set Available</span>
            </button>

            {/* Mark Out of Stock */}
            <button
              type="button"
              disabled={bulkUpdateStockMutation.isPending || bulkDeleteMutation.isPending}
              onClick={() => handleBulkSetStock(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#374151] hover:bg-[#4B5563] text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Mark all selected items as Out of Stock (86)"
            >
              {bulkUpdateStockMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span>Set Out of Stock</span>
            </button>

            <div className="h-4 w-px bg-white/20 hidden sm:block mx-1" />

            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-xs px-2.5 py-1.5 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Deselect All
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[#BA1A20] hover:bg-[#991B1B] text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Minimalist Filter & Sort Bar */}
      <div className="space-y-2.5">
        {/* Row 1: Segmented Status Filter Tabs + Clear Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 bg-[#F5F5F5] p-1 rounded-lg border border-[#E5E5E5]/60">
            {[
              { id: 'all', label: `All Items (${dishes.length})` },
              { id: 'instock', label: `Available (${dishes.filter((d) => d.inStock).length})` },
              { id: 'outofstock', label: `Out of Stock (${dishes.filter((d) => !d.inStock).length})` },
              { id: 'special', label: `Chef's Special (${dishes.filter((d) => d.isChefSpecial).length})` },
            ].map((tab) => {
              const isSelected = stockFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStockFilter(tab.id as 'all' | 'instock' | 'outofstock' | 'special');
                    table.setPageIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#1F1F1F] shadow-xs'
                      : 'text-[#737373] hover:text-[#1F1F1F]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Results Count & Reset Filters */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[11px] text-[#737373] font-medium">
              Showing <strong className="text-[#1F1F1F]">{table.getFilteredRowModel().rows.length}</strong> of {dishes.length}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#BA1A20] hover:text-[#8B0000] px-2 py-1 rounded-md bg-[#FFF2F0] hover:bg-[#FFE8E5] transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Dropdown, Price Filter, Sort Dropdown & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                table.setPageIndex(0);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-medium text-[#1F1F1F] hover:border-[#D4D4D4] focus:outline-none focus:border-[#1F1F1F] transition-colors cursor-pointer"
            >
              <option value="all">All Categories ({categories.length > 0 ? categories.length - 1 : 0})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value as any);
                table.setPageIndex(0);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-medium text-[#1F1F1F] hover:border-[#D4D4D4] focus:outline-none focus:border-[#1F1F1F] transition-colors cursor-pointer"
            >
              <option value="all">All Prices</option>
              <option value="under150">Under ₱150</option>
              <option value="150to300">₱150 - ₱300</option>
              <option value="above300">Above ₱300</option>
              <option value="custom">Custom Range...</option>
            </select>

            {/* Custom Price Range Input Fields */}
            {priceFilter === 'custom' && (
              <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1 text-xs shadow-2xs animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[11px] font-semibold text-[#737373]">₱</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={customMin}
                  onChange={(e) => {
                    setCustomMin(e.target.value);
                    table.setPageIndex(0);
                  }}
                  className="w-14 text-xs font-medium text-[#1F1F1F] bg-transparent focus:outline-none placeholder-[#A3A3A3]"
                />
                <span className="text-[#A3A3A3] text-xs font-bold">—</span>
                <span className="text-[11px] font-semibold text-[#737373]">₱</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={customMax}
                  onChange={(e) => {
                    setCustomMax(e.target.value);
                    table.setPageIndex(0);
                  }}
                  className="w-14 text-xs font-medium text-[#1F1F1F] bg-transparent focus:outline-none placeholder-[#A3A3A3]"
                />
                {(customMin || customMax) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMin('');
                      setCustomMax('');
                      table.setPageIndex(0);
                    }}
                    className="text-[#A3A3A3] hover:text-[#1F1F1F] p-0.5 cursor-pointer ml-0.5"
                    title="Clear custom range"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Minimalist Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#737373] hidden sm:inline">Sort:</span>
              <select
                value={currentSortKey}
                onChange={(e) => handleQuickSortChange(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-medium text-[#1F1F1F] hover:border-[#D4D4D4] focus:outline-none focus:border-[#1F1F1F] transition-colors cursor-pointer"
              >
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="price-asc">Price (Low → High)</option>
                <option value="price-desc">Price (High → Low)</option>
                <option value="category-asc">Category</option>
                <option value="inStock-desc">Stock Status (Available first)</option>
                <option value="updatedAt-desc">Last Update (Newest first)</option>
                <option value="updatedAt-asc">Last Update (Oldest first)</option>
              </select>
            </div>
          </div>

          {/* Search Input with Shortcut */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-2.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dish, category... (press '/' to focus)"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-[#E5E5E5] bg-white text-[#1F1F1F] placeholder-[#A3A3A3] hover:border-[#D4D4D4] focus:outline-none focus:border-[#1F1F1F] transition-colors"
            />
            {globalFilter ? (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-2 text-[#A3A3A3] hover:text-[#1F1F1F] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center absolute right-2.5 top-2 h-4 w-4 text-[10px] font-mono font-bold text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] rounded pointer-events-none select-none">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* TanStack Table with Left Checkbox & Clickable Column Sorting */}
      <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();
                    const isSelect = header.id === 'select';
                    const isActions = header.id === 'actions';

                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={`py-2.5 text-[11px] font-bold uppercase tracking-wider select-none ${
                          isSelect
                            ? 'w-12 px-3 text-center align-middle'
                            : isActions
                            ? 'px-3 text-right'
                            : 'px-3'
                        } ${
                          canSort
                            ? 'cursor-pointer hover:bg-[#F0F0F0] text-[#737373] hover:text-[#1F1F1F] transition-colors'
                            : 'text-[#737373]'
                        }`}
                      >
                        {isSelect ? (
                          flexRender(header.column.columnDef.header, header.getContext())
                        ) : (
                          <div className={`flex items-center gap-1.5 group ${isActions ? 'justify-end pr-1' : ''}`}>
                            <span className={isSorted ? 'text-[#1F1F1F] font-extrabold' : ''}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>

                            {/* Minimalist Directional Sorting Icon */}
                            {canSort && (
                              <span className="shrink-0">
                                {isSorted === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-[#BA1A20]" />
                                ) : isSorted === 'desc' ? (
                                  <ArrowDown className="w-3.5 h-3.5 text-[#BA1A20]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-[#B0B0B0] opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-[#F5F5F5]">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-[#737373]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-sm font-semibold text-[#1F1F1F]">No matching dishes found</p>
                      <p className="text-xs text-[#A3A3A3]">Try adjusting your search query, price, or category filter.</p>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 text-xs font-semibold text-[#BA1A20] hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const isSelected = row.getIsSelected();
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#FFF2F0]/60 hover:bg-[#FFF2F0]' : 'hover:bg-[#FAFAFA]'
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isSelect = cell.column.id === 'select';
                        return (
                          <td
                            key={cell.id}
                            className={`py-2.5 ${isSelect ? 'w-12 px-3 text-center align-middle' : 'px-3'}`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer with Page Size Options (12, 25, 50, 100, 250, 500) */}
        <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#737373]">
          {/* Left: Total Dishes Count & Selection Indicator */}
          <div className="flex items-center gap-3">
            <span>
              Total: <strong className="text-[#1F1F1F]">{table.getFilteredRowModel().rows.length}</strong> items
            </span>
            {selectedIds.length > 0 && (
              <span className="text-[#BA1A20] font-semibold text-[11px] bg-[#FFF2F0] px-2 py-0.5 rounded border border-[#FFDAD6]">
                {selectedIds.length} marked
              </span>
            )}
          </div>

          {/* Right: Items Per Table Options & Page Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#737373] whitespace-nowrap">Per table:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                  table.setPageIndex(0);
                }}
                className="px-2 py-1 rounded-md border border-[#E5E5E5] bg-white text-xs font-semibold text-[#1F1F1F] hover:border-[#D4D4D4] focus:outline-none focus:border-[#1F1F1F] transition-colors cursor-pointer"
              >
                <option value={12}>12 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
                <option value={250}>250 items</option>
                <option value={500}>500 items</option>
              </select>
            </div>

            {/* Prev / Next Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-md border border-[#E5E5E5] bg-white text-[#525252] disabled:opacity-30 hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-semibold text-[#1F1F1F]">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-md border border-[#E5E5E5] bg-white text-[#525252] disabled:opacity-30 hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setDishToEdit(null);
        }}
        dishToEdit={dishToEdit}
        categories={categories}
      />

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E5E5E5] p-6 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Warning Icon & Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF2F0] text-[#BA1A20] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F1F1F]">
                  Delete {selectedIds.length} Product{selectedIds.length > 1 ? 's' : ''}?
                </h3>
                <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                  This will permanently delete the selected items from the database, menus, POS register, and customer ordering. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* List of items to be deleted (max preview 8) */}
            <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#737373] block tracking-wider">
                Marked for Deletion:
              </span>
              <ul className="divide-y divide-[#E5E5E5]/60 text-xs">
                {selectedDishes.slice(0, 8).map((d) => (
                  <li key={d.id} className="py-1 flex items-center justify-between text-[#1F1F1F]">
                    <span className="font-medium truncate max-w-[240px]">{d.name}</span>
                    <span className="text-[11px] text-[#737373] font-mono">₱{d.price}</span>
                  </li>
                ))}
                {selectedDishes.length > 8 && (
                  <li className="pt-1.5 text-[11px] text-[#737373] italic">
                    ...and {selectedDishes.length - 8} more item{selectedDishes.length - 8 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#525252] hover:bg-[#F5F5F5] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-[#BA1A20] hover:bg-[#8B0000] rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete ({selectedIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
