'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface SettleResult {
  success: boolean
  settlementId?: string
  error?: string
}

export async function createSettlementAction(data: {
  year: number
  month: number
  totalAmount: number
  notes?: string
}): Promise<SettleResult> {
  try {
    // 1. Authenticate and authorize caller
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Tidak terautentikasi' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Hanya owner yang bisa mencatat setoran ke BOS' }
    }

    // 2. Check if this month is already settled
    const adminClient = createAdminClient()

    const { data: existing } = await adminClient
      .from('monthly_settlements')
      .select('id')
      .eq('settled_year', data.year)
      .eq('settled_month', data.month)
      .single()

    if (existing) {
      return { success: false, error: 'Bulan ini sudah dicatat sebagai lunas.' }
    }

    // 3. Insert the settlement record
    const monthLabel = new Date(data.year, data.month - 1, 1)
      .toLocaleString('id-ID', { month: 'long', year: 'numeric' })

    const { data: settlement, error: insertError } = await adminClient
      .from('monthly_settlements')
      .insert({
        settled_year: data.year,
        settled_month: data.month,
        total_amount: data.totalAmount,
        settled_by: user.id,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (insertError) {
      // Handle unique constraint violation (race condition fallback)
      if (insertError.code === '23505') {
        return { success: false, error: 'Bulan ini sudah dicatat sebagai lunas.' }
      }
      return { success: false, error: `Gagal menyimpan: ${insertError.message}` }
    }

    // 4. Log the action to activity_logs via RPC
    try {
      await adminClient.rpc('log_activity', {
        p_user_id: user.id,
        p_driver_id: null,
        p_action: 'SETTLE',
        p_table_name: 'monthly_settlements',
        p_record_id: settlement.id,
        p_details: {
          year: data.year,
          month: data.month,
          month_label: monthLabel,
          total_amount: data.totalAmount,
          owner_name: profile.full_name,
        },
      })
    } catch {
      // Non-critical — do not fail the operation if logging fails
    }

    return { success: true, settlementId: settlement.id }
  } catch (error) {
    console.error('Error creating settlement:', error)
    return { success: false, error: 'Terjadi kesalahan server. Silakan coba lagi.' }
  }
}
