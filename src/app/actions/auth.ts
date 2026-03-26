'use server'

import { createAdminClient } from '@/lib/supabase-admin'

interface SignUpResult {
  success: boolean
  error?: string
}

export async function signUpAction(data: {
  email: string
  password: string
  fullName: string
  role: 'driver' | 'owner'
}): Promise<SignUpResult> {
  try {
    if (!data.email || !data.password || !data.fullName) {
      return { success: false, error: 'Email, password, dan nama wajib diisi' }
    }

    if (data.password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter' }
    }

    if (!data.email.includes('@')) {
      return { success: false, error: 'Email tidak valid' }
    }

    const adminClient = createAdminClient()

    // 1. Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        role: data.role,
      },
    })

    if (createError) {
      if (
        createError.message.includes('already been registered') ||
        createError.message.includes('already exists')
      ) {
        return { success: false, error: 'Email sudah terdaftar. Gunakan email lain.' }
      }
      return { success: false, error: `Gagal membuat akun: ${createError.message}` }
    }

    if (!newUser?.user) {
      return { success: false, error: 'Gagal membuat akun user' }
    }

    // 2. Create profile — only after auth user confirmed
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name: data.fullName,
        email: data.email,
        role: data.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      try {
        await adminClient.auth.admin.deleteUser(newUser.user.id)
      } catch {
        // Log only, don't fail silently
        console.error('Failed to rollback auth user after profile insert failure')
      }
      return { success: false, error: `Gagal membuat profil: ${profileError.message}` }
    }

    // 3. If driver role, also create driver record
    if (data.role === 'driver') {
      try {
        await adminClient
          .from('drivers')
          .insert({
            user_id: newUser.user.id,
            is_active: true,
          })
      } catch {
        // Non-critical: profile exists, driver record can be created later
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error during sign up:', error)
    return { success: false, error: 'Terjadi kesalahan server. Silakan coba lagi.' }
  }
}
