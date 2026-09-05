'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Boxes,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Dish } from '@/types';
import { useDishes, useCategories, useToggleDishStock } from '@/hooks/useRestaurantData';

export function InventoryTable() {
  const { data: dishes = [] } = useDishes();
  const { data: categories = [] } = useCategories();
  const toggleStockMutation = useToggleDishStock();

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outofstock'>('all');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Filtered dataset
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

      // Stock status filter
      if (stockFilter === 'instock' && !dish.inStock) return false;
      if (stockFilter === 'outofstock' && dish.inStock) return false;

      return true;
    });
  }, [dishes, selectedCat, stockFilter, categories]);

  // Define Columns
  const columns = useMemo<ColumnDef<Dish>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Dish Name</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#E9E8E7]">
                <Image
                  src={d.imageUrl}
                  alt={d.name}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-[#2D2926] truncate max-w-xs">
                    {d.name}
                  </h4>
                  {d.isChefSpecial && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#B45309] text-white text-[9px] font-bold shrink-0 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Special
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#8F6F6C] truncate max-w-xs">{d.description}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-[#5B403D] bg-[#F4F3F2] px-2.5 py-1 rounded-lg border border-[#E9E8E7] inline-block">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Price</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-black text-[#BA1A20]">
            ₱{row.original.price.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'spiceLevel',
        header: 'Spice & Prep',
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-1 text-[#BA1A20] font-bold text-[11px]">
                <Flame className="w-3 h-3" />
                <span>Level {d.spiceLevel}</span>
              </div>
              <div className="flex items-center gap-1 text-[#8F6F6C] text-[10px]">
                <Clock className="w-3 h-3" />
                <span>{d.preparationTime}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'inStock',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Kitchen Availability</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const inStock = row.original.inStock;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                inStock
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                  : 'bg-[#FFDAD6] text-[#BA1A20] border-[#FFCDD2]'
              }`}
            >
              {inStock ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span>{inStock ? 'Available' : '86 - Out of Stock'}</span>
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="text-right block">Action</span>,
        cell: ({ row }) => {
          const dish = row.original;
          const isAvailable = dish.inStock;

          return (
            <div className="text-right">
              <button
                type="button"
                onClick={() => toggleStockMutation.mutate(dish.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs ${
                  isAvailable
                    ? 'bg-white hover:bg-[#FFF2F0] border border-[#FFDAD6] text-[#BA1A20]'
                    : 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white'
                }`}
              >
                {isAvailable ? '86 Dish (Out of Stock)' : 'Re-Stock Item'}
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
    },
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
      return (
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    },
  });

  const outOfStockCount = dishes.filter((d) => !d.inStock).length;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8 max-w-[1720px] mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#BA1A20]" />
            <h1 className="text-xl font-extrabold text-[#2D2926] tracking-tight">
              Menu &amp; 86 Stock Management
            </h1>
          </div>
          <p className="text-xs text-[#8F6F6C] font-medium mt-0.5">
            Real-time dish availability manager • Instantly updates POS Register &amp; Dine-In QR
          </p>
        </div>

        {outOfStockCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FFDAD6] border border-[#FFCDD2] text-xs font-black text-[#BA1A20]">
            <XCircle className="w-4 h-4" />
            <span>{outOfStockCount} Dishes Currently 86&apos;d (Unavailable)</span>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-[#E9E8E7] p-4 space-y-3.5 stitch-shadow">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1 relative max-w-md flex items-center">
            <Search className="w-4 h-4 text-[#8F6F6C] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes by name or ingredients..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#E9E8E7] bg-[#FAF9F8] text-xs font-medium text-[#2D2926] focus:bg-white focus:outline-none focus:border-[#BA1A20] transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 p-0.5 text-[#8F6F6C] hover:text-[#2D2926]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                table.setPageIndex(0);
              }}
              className="px-3 py-2 rounded-xl border border-[#E9E8E7] bg-white text-xs font-bold text-[#2D2926] focus:outline-none focus:border-[#BA1A20]"
            >
              <option value="all">All Categories ({dishes.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#F1F0F0]">
          {[
            { id: 'all', label: `All Items (${dishes.length})` },
            { id: 'instock', label: `In Stock (${dishes.filter((d) => d.inStock).length})` },
            { id: 'outofstock', label: `86'd Out of Stock (${outOfStockCount})` },
          ].map((tab) => {
            const isSelected = stockFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStockFilter(tab.id as 'all' | 'instock' | 'outofstock');
                  table.setPageIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#FFF2F0] text-[#BA1A20] border border-[#FFDAD6] font-extrabold shadow-2xs'
                    : 'bg-[#FAF9F8] text-[#5B403D] hover:bg-[#F4F3F2] border border-[#E9E8E7]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="bg-white rounded-2xl border border-[#E9E8E7] overflow-hidden stitch-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#FAF9F8] border-b border-[#E9E8E7]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-5 py-3.5 text-xs font-extrabold text-[#5B403D] uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-[#F1F0F0]">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAF9F8] transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-5 py-3.5 bg-[#FAF9F8] border-t border-[#E9E8E7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#8F6F6C] font-medium">
            Showing{' '}
            <span className="font-bold text-[#2D2926]">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[#2D2926]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{' '}
            of{' '}
            <span className="font-bold text-[#2D2926]">
              {table.getFilteredRowModel().rows.length}
            </span>{' '}
            dishes
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 text-[#2D2926] transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 text-xs font-bold text-[#2D2926] transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#E9E8E7] text-xs font-bold text-[#2D2926]">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 text-xs font-bold text-[#2D2926] transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 text-[#2D2926] transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
