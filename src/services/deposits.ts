'use client'

import { createClient } from '@/lib/supabase'
import { Deposit, DepositStatus, DepositMethod } from '@/types'

export async function getDeposits(driverId?: string): Promise<Deposit[]> {
  const supabase = createClient()
  let query = supabase
    .from('deposits')
    .select(`
      *,
      driver:drivers(
        *,
        profile:profiles(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (driverId) {
    query = query.eq('driver_id', driverId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching deposits:', error)
    return []
  }

  return data || []
}

export async function getPendingDeposits(): Promise<Deposit[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      driver:drivers(
        *,
        profile:profiles(*)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending deposits:', error)
    return []
  }

  return data || []
}

export async function getPendingDepositsCount(): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('deposits')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) {
    console.error('Error counting pending deposits:', error)
    return 0
  }

  return count || 0
}

export async function createDeposit(depositData: {
  driver_id: string
  amount: number
  method: DepositMethod
  proof_photo_url?: string
  deposit_date: string
}): Promise<Deposit | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deposits')
    .insert(depositData)
    .select()
    .single()

  if (error) {
    console.error('Error creating deposit:', error)
    return null
  }

  return data
}

export async function updateDepositStatus(
  depositId: string,
  status: DepositStatus,
  reviewedBy: string
): Promise<Deposit | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deposits')
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', depositId)
    .select()
    .single()

  if (error) {
    console.error('Error updating deposit:', error)
    return null
  }

  return data
}

export async function getMonthlyDeposits(): Promise<number> {
  const supabase = createClient()
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('deposits')
    .select('amount')
    .eq('status', 'approved')
    .gte('deposit_date', firstDayOfMonth)

  if (error) {
    console.error('Error fetching monthly deposits:', error)
    return 0
  }

  return (data || []).reduce((sum, deposit) => sum + Number(deposit.amount), 0)
}

export async function getDriverDepositsTotal(driverId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deposits')
    .select('amount')
    .eq('driver_id', driverId)
    .eq('status', 'approved')

  if (error) {
    console.error('Error fetching driver deposits:', error)
    return 0
  }

  return (data || []).reduce((sum, deposit) => sum + Number(deposit.amount), 0)
}
