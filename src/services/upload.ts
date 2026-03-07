'use client'

import { createClient } from '@/lib/supabase'

export async function uploadPhoto(
  file: File,
  driverId: string,
  type: 'report' | 'deposit'
): Promise<string | null> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${type}_${driverId}_${Date.now()}.${fileExt}`
  const filePath = `${driverId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('driver-photos')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return null
  }

  const { data } = supabase.storage.from('driver-photos').getPublicUrl(filePath)

  return data.publicUrl
}

export function getPhotoUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from('driver-photos').getPublicUrl(path)
  return data.publicUrl
}
