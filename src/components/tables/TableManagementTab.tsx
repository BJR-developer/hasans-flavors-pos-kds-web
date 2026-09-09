'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  X,
  Loader2,
  RotateCcw,
  ExternalLink,
  Info,
  AlertCircle,
} from 'lucide-react';
import { TableSession, Order } from '@/types';
import {
  useTableSessions,
  useOrders,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  useReleaseTable,
} from '@/hooks/useRestaurantData';
import { ChangeTableModal } from './ChangeTableModal';

export function TableManagementTab() {
  const router = useRouter();
  const { data: tables = [], isLoading: isTablesLoading } = useTableSessions();
  const { data: allOrders = [] } = useOrders();

  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();
  const deleteTableMutation = useDeleteTable();
  const releaseTableMutation = useReleaseTable();

  // Search & Status Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableSession | null>(null);
  const [changingOrder, setChangingOrder] = useState<Order | null>(null);

  // Map active orders to tables
  const activeOrdersByTable = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of allOrders) {
      if (
        o.type === 'dine_in' &&
        o.tableNumber &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
      ) {
        map.set(o.tableNumber, o);
      }
    }
    return map;
  }, [allOrders]);

  // Derived stats
  const totalTables = tables.length;
  const occupiedCount = useMemo(() => {
    return tables.filter(
      (t) => t.status !== 'available' || activeOrdersByTable.has(t.tableNumber)
    ).length;
  }, [tables, activeOrdersByTable]);
  const availableCount = Math.max(0, totalTables - occupiedCount);
  const totalCapacity = useMemo(() => {
    return tables.reduce((sum, t) => sum + (t.capacity || t.guestCount || 4), 0);
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const isOccupied = t.status !== 'available' || activeOrdersByTable.has(t.tableNumber);
      if (statusFilter === 'available' && isOccupied) return false;
      if (statusFilter === 'occupied' && !isOccupied) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const activeOrder = activeOrdersByTable.get(t.tableNumber);
        const matchName = t.tableNumber.toLowerCase().includes(q);
        const matchOrder = activeOrder?.orderNumber.toLowerCase().includes(q);
        const matchCustomer = activeOrder?.customerName.toLowerCase().includes(q);
        if (!matchName && !matchOrder && !matchCustomer) return false;
      }

      return true;
    });
  }, [tables, statusFilter, searchQuery, activeOrdersByTable]);

  const handleReleaseTable = async (tableNumber: string) => {
    if (window.confirm(`Are you sure you want to mark ${tableNumber} as available?`)) {
      try {
        await releaseTableMutation.mutateAsync(tableNumber);
      } catch (err: any) {
        alert(err?.message || 'Failed to release table');
      }
    }
  };

  const handleDeleteTable = async (table: TableSession) => {
    if (!table.id) return;
    const isOccupied = table.status !== 'available' || activeOrdersByTable.has(table.tableNumber);
    if (isOccupied) {
      alert(`Cannot delete ${table.tableNumber} while an active order is seated on it.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${table.tableNumber}? This cannot be undone.`)) {
      try {
        await deleteTableMutation.mutateAsync({ id: table.id, tableNumber: table.tableNumber });
      } catch (err: any) {
        alert(err?.message || 'Failed to delete table');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
            Total Floor Tables
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1F1F1F] font-mono">{totalTables}</span>
            <span className="text-xs font-semibold text-[#737373]">configured</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534] block mb-1">
            Available Tables
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#166534] font-mono">{availableCount}</span>
            <span className="text-xs font-semibold text-[#737373]">ready for seating</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] block mb-1">
            Occupied Tables
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#B45309] font-mono">{occupiedCount}</span>
            <span className="text-xs font-semibold text-[#737373]">dining in</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
            Floor Capacity
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1F1F1F] font-mono">{totalCapacity}</span>
            <span className="text-xs font-semibold text-[#737373]">seats total</span>
          </div>
        </div>
      </div>

      {/* 2. Action & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E5E5E5] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search table, order #, or guest..."
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

        {/* Filter Pills & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg border border-[#E5E5E5]/80">
            {[
              { id: 'all', label: `All (${totalTables})` },
              { id: 'available', label: `Available (${availableCount})` },
              { id: 'occupied', label: `Occupied (${occupiedCount})` },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* 3. Tables Floor Grid */}
      {isTablesLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#737373] gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#BA1A20]" />
          <span className="text-xs font-semibold">Loading floor tables...</span>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E5E5E5] p-12 text-center text-[#737373] space-y-3">
          <Info className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <div>
            <p className="text-sm font-bold text-[#1F1F1F]">No tables match your filter</p>
            <p className="text-xs text-[#737373] mt-0.5">
              Try adjusting your search query or status filter above.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const activeOrder = activeOrdersByTable.get(table.tableNumber);
            const isOccupied = table.status !== 'available' || !!activeOrder;
            const capacity = table.capacity || table.guestCount || 4;

            return (
              <div
                key={table.id || table.tableNumber}
                className={`bg-white rounded-xl border flex flex-col justify-between transition-all overflow-hidden ${
                  isOccupied
                    ? 'border-amber-200 shadow-2xs'
                    : 'border-[#E5E5E5] hover:border-[#D4D4D4] shadow-2xs'
                }`}
              >
                {/* Card Top / Header */}
                <div
                  className={`p-4 border-b flex items-start justify-between gap-2 ${
                    isOccupied ? 'bg-amber-50/50 border-amber-100' : 'bg-[#FAFAFA] border-[#E5E5E5]'
                  }`}
                >
                  <div>
                    <h4 className="text-base font-bold text-[#1F1F1F] tracking-tight">
                      {table.tableNumber}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#737373] mt-0.5">
                      <Users className="w-3 h-3 text-[#A3A3A3]" />
                      <span>{capacity} Seats Capacity</span>
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      isOccupied
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOccupied ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}
                    />
                    <span>{isOccupied ? 'Occupied' : 'Available'}</span>
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 space-y-3">
                  {isOccupied && activeOrder ? (
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-neutral-900">
                          {activeOrder.orderNumber}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            activeOrder.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {activeOrder.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-neutral-600">
                        <span className="truncate">{activeOrder.customerName}</span>
                        <span className="font-bold text-neutral-900">
                          ₱{activeOrder.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-200/60">
                        <span>{activeOrder.items?.length || 0} items ordered</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(activeOrder.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-center text-[11px] text-neutral-400 border border-dashed border-neutral-200 rounded-lg">
                      <span>Ready for new diners</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-[#E5E5E5] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingTable(table)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-white transition-colors cursor-pointer"
                      title="Edit Table Name & Capacity"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isOccupied || deleteTableMutation.isPending}
                      onClick={() => handleDeleteTable(table)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title={isOccupied ? 'Cannot delete occupied table' : 'Delete Table'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {isOccupied ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeOrder) {
                              setChangingOrder(activeOrder);
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 transition-colors shadow-2xs cursor-pointer"
                          title="Transfer order to another available table"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-neutral-500" />
                          <span>Move</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReleaseTable(table.tableNumber)}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 transition-colors cursor-pointer"
                          title="Clear occupancy and mark table as available"
                        >
                          Free
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(`/pos?dineInTable=${encodeURIComponent(table.tableNumber)}`)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#1F1F1F] hover:bg-black text-white transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Seat Diner</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add Table Modal */}
      {isAddModalOpen && (
        <TableFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (data) => {
            await createTableMutation.mutateAsync(data);
          }}
          existingTables={tables}
        />
      )}

      {/* 5. Edit Table Modal */}
      {editingTable && (
        <TableFormModal
          isOpen={!!editingTable}
          tableToEdit={editingTable}
          onClose={() => setEditingTable(null)}
          onSubmit={async (data) => {
            if (editingTable.id) {
              await updateTableMutation.mutateAsync({
                id: editingTable.id,
                updates: data,
              });
            }
          }}
          existingTables={tables}
        />
      )}

      {/* 6. Change Table Modal */}
      {changingOrder && (
        <ChangeTableModal
          isOpen={!!changingOrder}
          order={changingOrder}
          onClose={() => setChangingOrder(null)}
        />
      )}
    </div>
  );
}

// Sub-component: Add/Edit Table Modal
interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableToEdit?: TableSession | null;
  onSubmit: (data: { tableNumber: string; capacity: number }) => Promise<void>;
  existingTables: TableSession[];
}

function TableFormModal({
  isOpen,
  onClose,
  tableToEdit,
  onSubmit,
  existingTables,
}: TableFormModalProps) {
  if (!isOpen) return null;

  const [tableName, setTableName] = useState(
    tableToEdit?.tableNumber || `Table ${existingTables.length + 1}`
  );
  const [capacity, setCapacity] = useState<number>(
    tableToEdit?.capacity || tableToEdit?.guestCount || 4
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetCapacities = [2, 4, 6, 8, 10, 12];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tableName.trim();
    if (!cleanName) {
      setError('Please provide a table name or number.');
      return;
    }

    // Check for duplicates
    const duplicate = existingTables.find(
      (t) =>
        t.tableNumber.toLowerCase() === cleanName.toLowerCase() &&
        t.id !== tableToEdit?.id
    );
    if (duplicate) {
      setError(`A table named "${cleanName}" already exists.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ tableNumber: cleanName, capacity });
      onClose();
    } catch (err: any) {
      console.error('Failed to save table:', err);
      setError(err?.message || 'Failed to save table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E5E5E5] my-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F1F1F]">
              {tableToEdit ? `Edit ${tableToEdit.tableNumber}` : 'Add New Dining Table'}
            </h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Configured tables synchronize live across POS and mobile customer app
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Table Name / Label *
            </label>
            <input
              type="text"
              required
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. Table 13, Patio 2, VIP Booth"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1.5">
              Seating Capacity (Guests)
            </label>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {presetCapacities.map((cap) => {
                const isSelected = capacity === cap;
                return (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setCapacity(cap)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1F1F1F] text-white border-[#1F1F1F] shadow-xs'
                        : 'bg-white text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    {cap}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-[#737373]">Custom Capacity:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 px-2 py-1 text-xs font-bold rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
              />
              <span className="text-[11px] text-[#737373]">guests</span>
            </div>
          </div>

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
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#BA1A20] hover:bg-[#8B0000] rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{tableToEdit ? 'Save Changes' : 'Create Table'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
