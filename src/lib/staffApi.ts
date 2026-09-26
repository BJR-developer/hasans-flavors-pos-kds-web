import { supabase } from './supabase';
import { StaffUser } from '@/types';
import { normalizeStaffEmail, sanitizeUsername } from './shiftCalculations';

export { normalizeStaffEmail, sanitizeUsername };

/**
 * Fetch all internal staff and owner accounts.
 */
export async function fetchStaffUsers(): Promise<StaffUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['owner', 'cashier'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff profiles:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    email: row.email,
    username: row.username || row.email.split('@')[0],
    fullName: row.full_name || row.email.split('@')[0],
    phone: row.phone || undefined,
    role: row.role as 'owner' | 'cashier' | 'customer',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new staff account (cashier/owner) directly with auto-confirmed status.
 * Accepts distinct username and email.
 */
export async function createStaffAccount(params: {
  username: string;
  email?: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: 'cashier' | 'owner';
}): Promise<{ success: boolean; message?: string; user?: any }> {
  const cleanUsername = sanitizeUsername(params.username);
  let cleanEmail = (params.email || '').trim().toLowerCase().replace(/\s+/g, '');

  if (!cleanEmail) {
    cleanEmail = `${cleanUsername}@hasan.com`;
  }

  const { data, error } = await supabase.rpc('admin_create_staff', {
    p_email: cleanEmail,
    p_password: params.password,
    p_full_name: params.fullName.trim(),
    p_phone: params.phone?.trim() || null,
    p_role: params.role || 'cashier',
    p_username: cleanUsername,
  });

  if (error) {
    console.error('Error creating staff account:', error);
    return { success: false, message: error.message };
  }

  return { success: true, user: data };
}

/**
 * Delete a staff account from auth.users and profiles.
 * Preserves past order history while nullifying cashier attribution.
 */
export async function deleteStaffAccount(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  const { data, error } = await supabase.rpc('admin_delete_staff', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error deleting staff account:', error);
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: data?.message || 'Staff account deleted successfully.',
  };
}

/**
 * Direct password reset for any staff or owner without verification emails or links.
 */
export async function resetPasswordDirect(
  usernameOrEmail: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  let email = normalizeStaffEmail(usernameOrEmail);

  // If user entered a username without @, attempt to lookup their profile email
  if (!usernameOrEmail.includes('@')) {
    const cleanUsername = sanitizeUsername(usernameOrEmail);
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (profile?.email) {
      email = profile.email;
    }
  }

  const { data, error } = await supabase.rpc('admin_reset_user_password', {
    p_email: email,
    p_new_password: newPassword,
  });

  if (error) {
    console.error('Error resetting password directly:', error);
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: data?.message || 'Password successfully updated.',
  };
}

/**
 * Update staff profile details (name, phone)
 */
export async function updateStaffProfile(
  userId: string,
  data: { fullName?: string; phone?: string }
): Promise<void> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (data.fullName !== undefined) payload.full_name = data.fullName.trim();
  if (data.phone !== undefined) payload.phone = data.phone?.trim() || null;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) {
    console.error('Error updating staff profile:', error);
    throw error;
  }
}
