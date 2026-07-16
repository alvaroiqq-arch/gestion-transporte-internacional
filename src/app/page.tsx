import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { cerrarSesion } from '@/actions/auth'
import { db } from '@/lib/db'
import { usuarios } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function Home() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const usuario = user
    ? await db.query.usuarios.findFirst({ where: eq(usuarios.supabase_auth_id, user.id) })
    : null

  return (
    <div style={{ padding: 32 }}>
      <h1>Gestión de trámites — transporte internacional</h1>
      {usuario && (
        <p>
          Hola, <strong>{usuario.nombre}</strong> ({usuario.rol}
          {usuario.pais_gestion ? `, ${usuario.pais_gestion}` : ''})
        </p>
      )}
      <nav style={{ margin: '16px 0' }}>
        <Link href="/empresas">Empresas cliente</Link>
      </nav>
      <form action={cerrarSesion}>
        <button type="submit">Cerrar sesión</button>
      </form>
    </div>
  )
}
