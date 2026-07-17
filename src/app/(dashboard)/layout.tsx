import { crearClienteServidor } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { usuarios } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SidebarNav } from '@/components/layout/sidebar-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const usuario = user
    ? await db.query.usuarios.findFirst({ where: (usuarios, { eq }) => eq(usuarios.supabase_auth_id, user.id) })
    : null

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SidebarNav
        usuario={
          usuario
            ? { nombre: usuario.nombre, rol: usuario.rol, pais_gestion: usuario.pais_gestion }
            : null
        }
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  )
}
