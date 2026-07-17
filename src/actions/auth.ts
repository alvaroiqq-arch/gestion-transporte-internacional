'use server'

import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'

export async function iniciarSesion(
  _estadoPrevio: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return { error: 'Ingresa tu email y contraseña.' }
  }

  const supabase = await crearClienteServidor()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // DIAGNÓSTICO TEMPORAL: mostrar la causa real del fallo
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(sin URL)'
    const keyLen = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').length
    return {
      error: `DEBUG: ${error.message} | status=${error.status} | url=${url} | keyLen=${keyLen}`,
    }
  }

  redirect('/')
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor()
  await supabase.auth.signOut()
  redirect('/login')
}
