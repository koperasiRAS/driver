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

// Single unified driver lookup — accepts either userId or driverId
async function fetchDriver(filter: { user_id?: string; id?: string }): Promise<Driver | null> {
  const supabase = createClient()
  let query = supabase
    .from('drivers')
    .select(`*, profile:profiles(*)`)

  if (filter.user_id) {
    query = query.eq('user_id', filter.user_id)
  } else if (filter.id) {
    query = query.eq('id', filter.id)
  }

  const { data, error } = await query.single()

  if (error) {
    console.error('Error fetching driver:', error)
    return null
  }

  return data
}

export async function getDriverByUserId(userId: string): Promise<Driver | null> {
  return fetchDriver({ user_id: userId })
}

export async function getDriverById(driverId: string): Promise<Driver | null> {
  return fetchDriver({ id: driverId })
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
