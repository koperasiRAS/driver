'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase'

export async function resetAllDataAction() {
  try {
    // Authorization: only owner role can reset all data
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized: Silakan login terlebih dahulu.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profile.role !== 'owner') {
      return { success: false, message: 'Unauthorized: Hanya owner yang dapat mengakses fitur ini.' }
    }

    const adminClient = createAdminClient()

    // Delete in order to respect foreign keys
    // 1. Delete driver_expenses
    await adminClient.from('driver_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 2. Delete driver_locations
    await adminClient.from('driver_locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 3. Delete daily_reports
    await adminClient.from('daily_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 4. Delete deposits
    await adminClient.from('deposits').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 5. Delete notifications
    await adminClient.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 6. Delete activity_logs
    await adminClient.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 7. Delete drivers (but NOT profiles/auth users — owner remains)
    await adminClient.from('drivers').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return { success: true, message: 'Semua data berhasil direset. Akun owner tetap tersimpan.' }
  } catch (error) {
    console.error('Reset error:', error)
    return { success: false, message: 'Gagal mereset data: ' + String(error) }
  }
}
