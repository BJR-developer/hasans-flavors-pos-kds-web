'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  KeyRound,
  Phone,
  CheckCircle2,
  RefreshCw,
  Search,
  Trash2,
  User,
  AtSign,
} from 'lucide-react';
import { useStaffUsers } from '@/hooks/useStaffData';
import { useAuthStore } from '@/lib/auth';
import { CreateCashierModal } from './CreateCashierModal';
import { OwnerPasswordResetModal } from './OwnerPasswordResetModal';
import { DeleteStaffModal } from './DeleteStaffModal';
import { ChangeUsernameModal } from './ChangeUsernameModal';
import { StaffUser } from '@/types';

export function StaffManagementTab() {
  const { user: currentUser } = useAuthStore();
  const { data: staffList = [], isLoading, refetch, isRefetching } = useStaffUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<StaffUser | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<StaffUser | null>(null);
  const [usernameTargetUser, setUsernameTargetUser] = useState<StaffUser | null>(null);

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">
                Staff &amp; Cashier Management
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Auto-Confirmed
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Configure distinct staff usernames and passwords, create new cashiers, and manage accounts without email verifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
              title="Refresh staff list"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Cashier Account</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by username, name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Staff Cards / List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs text-neutral-500 mt-2 block font-medium">Loading staff accounts...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 space-y-2">
            <Users className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">No staff members found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStaff.map((staff) => {
              const isOwnerAccount = staff.email === 'owner@hasan.com' || staff.id === currentUser?.id;
              const displayUsername = staff.username || staff.email.split('@')[0];

              return (
                <div
                  key={staff.id}
                  className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-4 hover:border-neutral-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-sm font-black shadow-2xs shrink-0">
                          {staff.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold text-neutral-900">
                              {staff.fullName}
                            </h3>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                staff.role === 'owner'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {staff.role}
                            </span>
                          </div>

                          {/* Username & Email Badges */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-xs font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md font-bold">
                              <User className="w-3 h-3 text-neutral-400" />
                              <span>@{displayUsername}</span>
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">
                              {staff.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{staff.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-600 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Auto-Confirmed</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 flex items-center justify-between gap-2 border-t border-neutral-100 flex-wrap">
                    <div className="flex items-center gap-2">
                      {!isOwnerAccount ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetUser(staff)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">
                          Protected Account
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUsernameTargetUser(staff)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-colors"
                        title="Change username"
                      >
                        <AtSign className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Username</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResetTargetUser(staff)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCashierModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => refetch()}
      />

      {resetTargetUser && (
        <OwnerPasswordResetModal
          isOpen={Boolean(resetTargetUser)}
          onClose={() => setResetTargetUser(null)}
          targetUserEmail={resetTargetUser.email}
          targetUserName={resetTargetUser.fullName}
          onSuccess={() => refetch()}
        />
      )}

      {deleteTargetUser && (
        <DeleteStaffModal
          isOpen={Boolean(deleteTargetUser)}
          onClose={() => setDeleteTargetUser(null)}
          staff={deleteTargetUser}
          onSuccess={() => refetch()}
        />
      )}

      {usernameTargetUser && (
        <ChangeUsernameModal
          key={usernameTargetUser.id}
          isOpen={Boolean(usernameTargetUser)}
          onClose={() => setUsernameTargetUser(null)}
          staff={usernameTargetUser}
          onSuccess={() => refetch()}
        />
      )}
    </motion.div>
  );
}
