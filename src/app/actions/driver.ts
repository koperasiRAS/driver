'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface CreateDriverResult {
  success: boolean
  error?: string
}

export async function createDriverAction(formData: {
  fullName: string
  email: string
  password: string
  phone?: string
  vehicleType?: string
  vehiclePlate?: string
}): Promise<CreateDriverResult> {
  try {
    // 1. Verify the current user is an owner
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Tidak terautentikasi' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Hanya owner yang bisa menambahkan driver' }
    }

    // 2. Validate input
    if (!formData.fullName || !formData.email || !formData.password) {
      return { success: false, error: 'Nama, email, dan password wajib diisi' }
    }

    if (formData.password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter' }
    }

    // 3. Create the user with admin client (server-side only)
    const adminClient = createAdminClient()

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: formData.fullName,
        role: 'driver',
        phone: formData.phone || null,
      },
    })

    if (createError) {
      // Handle duplicate email
      if (createError.message.includes('already been registered') || 
          createError.message.includes('already exists')) {
        return { success: false, error: 'Email sudah terdaftar. Gunakan email lain.' }
      }
      return { success: false, error: `Gagal membuat akun: ${createError.message}` }
    }

    if (!newUser?.user) {
      return { success: false, error: 'Gagal membuat akun user' }
    }

    // 4. Create the driver record
    const { error: driverError } = await adminClient
      .from('drivers')
      .insert({
        user_id: newUser.user.id,
        vehicle_type: formData.vehicleType || null,
        vehicle_plate: formData.vehiclePlate || null,
        is_active: true,
      })

    if (driverError) {
      // Rollback: delete the auth user if driver record creation fails
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return { success: false, error: `Gagal membuat data driver: ${driverError.message}` }
    }

    // 5. Log the activity
    try {
      await adminClient.rpc('log_activity', {
        p_user_id: user.id,
        p_driver_id: null,
        p_action: 'CREATE',
        p_table_name: 'drivers',
        p_record_id: newUser.user.id,
        p_details: { 
          driver_name: formData.fullName, 
          email: formData.email 
        },
      })
    } catch {
      // Non-critical, don't fail the operation
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating driver:', error)
    return { success: false, error: 'Terjadi kesalahan server. Silakan coba lagi.' }
  }
}

export async function updateDriverAction(data: {
  driverId: string
  userId: string
  fullName: string
  phone?: string
  vehicleType?: string
  vehiclePlate?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Hanya owner yang bisa mengedit driver' }
    }

    const adminClient = createAdminClient()

    // Update profile (full_name, phone)
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name: data.fullName,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.userId)

    if (profileError) {
      return { success: false, error: `Gagal update profil: ${profileError.message}` }
    }

    // Update driver record (vehicle info)
    const { error: driverError } = await adminClient
      .from('drivers')
      .update({
        vehicle_type: data.vehicleType || null,
        vehicle_plate: data.vehiclePlate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.driverId)

    if (driverError) {
      return { success: false, error: `Gagal update kendaraan: ${driverError.message}` }
    }

    // Log activity
    try {
      await adminClient.rpc('log_activity', {
        p_user_id: user.id,
        p_driver_id: data.driverId,
        p_action: 'UPDATE',
        p_table_name: 'drivers',
        p_record_id: data.driverId,
        p_details: { driver_name: data.fullName },
      })
    } catch { /* non-critical */ }

    return { success: true }
  } catch (error) {
    console.error('Error updating driver:', error)
    return { success: false, error: 'Terjadi kesalahan server.' }
  }
}

export async function deleteDriverAction(data: {
  driverId: string
  userId: string
  driverName: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Hanya owner yang bisa menghapus driver' }
    }

    const adminClient = createAdminClient()

    // Delete driver record first (FK constraint)
    const { error: driverError } = await adminClient
      .from('drivers')
      .delete()
      .eq('id', data.driverId)

    if (driverError) {
      return { success: false, error: `Gagal menghapus driver: ${driverError.message}` }
    }

    // Delete the auth user (also deletes profile via cascade)
    const { error: authError } = await adminClient.auth.admin.deleteUser(data.userId)

    if (authError) {
      return { success: false, error: `Gagal menghapus akun: ${authError.message}` }
    }

    // Log activity
    try {
      await adminClient.rpc('log_activity', {
        p_user_id: user.id,
        p_driver_id: null,
        p_action: 'DELETE',
        p_table_name: 'drivers',
        p_record_id: data.driverId,
        p_details: { driver_name: data.driverName },
      })
    } catch { /* non-critical */ }

    return { success: true }
  } catch (error) {
    console.error('Error deleting driver:', error)
    return { success: false, error: 'Terjadi kesalahan server.' }
  }
}

export async function resetPasswordAction(data: {
  userId: string
  driverName: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Hanya owner yang bisa reset password' }
    }

    if (!data.newPassword || data.newPassword.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter' }
    }

    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      data.userId,
      { password: data.newPassword }
    )

    if (updateError) {
      return { success: false, error: `Gagal reset password: ${updateError.message}` }
    }

    // Log activity
    try {
      await adminClient.rpc('log_activity', {
        p_user_id: user.id,
        p_driver_id: null,
        p_action: 'RESET_PASSWORD',
        p_table_name: 'auth.users',
        p_record_id: data.userId,
        p_details: { driver_name: data.driverName },
      })
    } catch { /* non-critical */ }

    return { success: true }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { success: false, error: 'Terjadi kesalahan server.' }
  }
}

