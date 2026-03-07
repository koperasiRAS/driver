'use client'

import { createClient } from '@/lib/supabase'
import { Driver } from '@/types'

export async function getDrivers(): Promise<Driver[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching drivers:', error)
    return []
  }

  return data || []
}

export async function getDriverByUserId(userId: string): Promise<Driver | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching driver:', error)
    return null
  }

  return data
}

export async function getDriverById(driverId: string): Promise<Driver | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('id', driverId)
    .single()

  if (error) {
    console.error('Error fetching driver:', error)
    return null
  }

  return data
}

export async function createDriver(driverData: {
  user_id: string
  vehicle_type?: string
  vehicle_plate?: string
}): Promise<Driver | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('drivers')
    .insert(driverData)
    .select()
    .single()

  if (error) {
    console.error('Error creating driver:', error)
    return null
  }

  return data
}

export async function updateDriver(
  driverId: string,
  updates: {
    vehicle_type?: string
    vehicle_plate?: string
    is_active?: boolean
  }
): Promise<Driver | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', driverId)
    .select()
    .single()

  if (error) {
    console.error('Error updating driver:', error)
    return null
  }

  return data
}

export async function getTotalDrivers(): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) {
    console.error('Error counting drivers:', error)
    return 0
  }

  return count || 0
}
