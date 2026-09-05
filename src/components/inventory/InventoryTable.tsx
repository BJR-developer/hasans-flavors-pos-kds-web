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
  ChevronLeft,
  ChevronRight,
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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const filteredData = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCat !== 'all') {
        const cat = categories.find((c) => c.id === selectedCat);
        if (cat && cat.match) {
          const reg = new RegExp(cat.match, 'i');
          if (!reg.test(dish.name) && !reg.test(dish.category)) {
            return false;
          }
        }
      }

      if (stockFilter === 'instock' && !dish.inStock) return false;
      if (stockFilter === 'outofstock' && dish.inStock) return false;

      return true;
    });
  }, [dishes, selectedCat, stockFilter, categories]);

  const columns = useMemo<ColumnDef<Dish>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Dish',
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0 border border-[#E5E5E5]">
                <Image
                  src={d.imageUrl}
                  alt={d.name}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <span className="font-semibold text-xs text-[#1F1F1F] truncate max-w-xs">
                {d.name}
              </span>
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
        header: 'Status',
        cell: ({ row }) => {
          const inStock = row.original.inStock;
          return (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                inStock
                  ? 'text-[#2E7D32] bg-[#E8F5E9]'
                  : 'text-[#BA1A20] bg-[#FFF2F0]'
              }`}
            >
              {inStock ? 'Available' : '86 Out of Stock'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="text-right block">Toggle</span>,
        cell: ({ row }) => {
          const dish = row.original;
          const isAvailable = dish.inStock;

          return (
            <div className="text-right">
              <button
                type="button"
                onClick={() => toggleStockMutation.mutate(dish.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  isAvailable
                    ? 'border border-[#E5E5E5] text-[#737373] hover:text-[#BA1A20] hover:bg-[#FFF2F0]'
                    : 'bg-[#1F1F1F] text-white hover:bg-[#383838]'
                }`}
              >
                {isAvailable ? '86 Dish' : 'Make Available'}
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
      return d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
    },
  });

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-[1720px] mx-auto w-full space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: `All Items (${dishes.length})` },
            { id: 'instock', label: `Available (${dishes.filter((d) => d.inStock).length})` },
            { id: 'outofstock', label: `86 Out of Stock (${dishes.filter((d) => !d.inStock).length})` },
          ].map((tab) => {
            const isSelected = stockFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStockFilter(tab.id as 'all' | 'instock' | 'outofstock');
                  table.setPageIndex(0);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#1F1F1F] text-white'
                    : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              table.setPageIndex(0);
            }}
            className="px-2.5 py-1.5 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#1F1F1F]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dish..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] placeholder-[#A3A3A3] focus:bg-white focus:outline-none focus:border-[#1F1F1F] transition-colors"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-2 text-[#A3A3A3] hover:text-[#1F1F1F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TanStack Table */}
      <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 text-[11px] font-bold text-[#737373] uppercase tracking-wider"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-[#F5F5F5]">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFAFA] transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-[#E5E5E5] flex items-center justify-between gap-3 text-xs text-[#737373]">
          <span>
            {table.getFilteredRowModel().rows.length} dishes
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded border border-[#E5E5E5] bg-white text-[#525252] disabled:opacity-30 hover:bg-[#F5F5F5]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-medium text-[#1F1F1F]">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded border border-[#E5E5E5] bg-white text-[#525252] disabled:opacity-30 hover:bg-[#F5F5F5]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
