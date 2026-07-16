'use client'

import { useActionState } from 'react'
import { iniciarSesion } from '@/actions/auth'

export default function PaginaLogin() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, { error: null })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <form action={accion} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Gestión de trámites — transporte internacional</h1>

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />

        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />

        {estado.error && <p style={{ color: 'red', fontSize: 14 }}>{estado.error}</p>}

        <button type="submit" disabled={pendiente}>
          {pendiente ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
