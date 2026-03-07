'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function resetAllDataAction() {
  try {
    const supabase = createAdminClient()

    // Delete in order to respect foreign keys
    // 1. Delete driver_expenses
    await supabase.from('driver_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 2. Delete driver_locations
    await supabase.from('driver_locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 3. Delete daily_reports
    await supabase.from('daily_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 4. Delete deposits
    await supabase.from('deposits').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 5. Delete notifications
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 6. Delete activity_logs
    await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 7. Delete drivers (but NOT profiles/auth users — owner remains)
    await supabase.from('drivers').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return { success: true, message: 'Semua data berhasil direset. Akun owner tetap tersimpan.' }
  } catch (error) {
    console.error('Reset error:', error)
    return { success: false, message: 'Gagal mereset data: ' + String(error) }
  }
}
