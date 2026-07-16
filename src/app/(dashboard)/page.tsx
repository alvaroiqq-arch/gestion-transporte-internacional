import Link from 'next/link'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { crearClienteServidor } from '@/lib/supabase/server'
import {
  empresas_cliente,
  vehiculos,
  tramites,
  tipos_tramite,
  usuarios,
} from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EstadoTramiteBadge, PaisBadge } from '@/components/estados/estado-badges'

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number)
  const nueva = new Date(a, m - 1, d + dias)
  const yyyy = nueva.getFullYear()
  const mm = String(nueva.getMonth() + 1).padStart(2, '0')
  const dd = String(nueva.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default async function PaginaInicio() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  const usuario = user
    ? await db.query.usuarios.findFirst({ where: eq(usuarios.supabase_auth_id, user.id) })
    : null

  const hoy = new Date().toISOString().slice(0, 10)
  const en30 = sumarDias(hoy, 30)

  const [
    [{ n: empresasActivas }],
    [{ n: vehiculosHabilitados }],
    [{ n: tramitesEnCurso }],
    [{ n: tramitesObservados }],
    porVencer,
    ultimos,
  ] = await Promise.all([
    db.select({ n: count() }).from(empresas_cliente).where(eq(empresas_cliente.activo, true)),
    db.select({ n: count() }).from(vehiculos).where(eq(vehiculos.estado, 'habilitado')),
    db.select({ n: count() }).from(tramites).where(eq(tramites.estado, 'en_curso')),
    db.select({ n: count() }).from(tramites).where(eq(tramites.estado, 'pendiente_observado')),
    db
      .select({
        id: tramites.id,
        numero: tramites.numero,
        fecha_vigencia_hasta: tramites.fecha_vigencia_hasta,
        empresa: empresas_cliente.razon_social,
        tipo: tipos_tramite.nombre,
      })
      .from(tramites)
      .innerJoin(empresas_cliente, eq(tramites.empresa_id, empresas_cliente.id))
      .innerJoin(tipos_tramite, eq(tramites.tipo_tramite_id, tipos_tramite.id))
      .where(
        and(
          eq(tramites.estado, 'concluido'),
          gte(tramites.fecha_vigencia_hasta, hoy),
          lte(tramites.fecha_vigencia_hasta, en30)
        )
      )
      .orderBy(tramites.fecha_vigencia_hasta),
    db
      .select({
        id: tramites.id,
        numero: tramites.numero,
        estado: tramites.estado,
        pais: tramites.pais,
        fecha_solicitud: tramites.fecha_solicitud,
        empresa: empresas_cliente.razon_social,
        tipo: tipos_tramite.nombre,
      })
      .from(tramites)
      .innerJoin(empresas_cliente, eq(tramites.empresa_id, empresas_cliente.id))
      .innerJoin(tipos_tramite, eq(tramites.tipo_tramite_id, tipos_tramite.id))
      .orderBy(desc(tramites.numero))
      .limit(5),
  ])

  const tarjetas = [
    { etiqueta: 'Trámites en curso', valor: tramitesEnCurso, href: '/tramites' },
    { etiqueta: 'Pendientes / observados', valor: tramitesObservados, href: '/tramites' },
    { etiqueta: 'Empresas activas', valor: empresasActivas, href: '/empresas' },
    { etiqueta: 'Vehículos habilitados', valor: vehiculosHabilitados, href: '/vehiculos' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>Inicio</h1>
        {usuario && (
          <p className="mt-1 text-sm text-muted-foreground">
            Hola, <span className="font-medium text-foreground">{usuario.nombre}</span> · {usuario.rol}
            {usuario.pais_gestion ? ` · ${usuario.pais_gestion}` : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <Link key={t.etiqueta} href={t.href}>
            <Card className="gap-2 py-5 transition-shadow hover:shadow-md">
              <CardContent className="px-5">
                <p className="text-sm text-muted-foreground">{t.etiqueta}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{t.valor}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permisos por vencer (próximos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {porVencer.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay permisos próximos a vencer.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {porVencer.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/tramites/${t.id}`} className="font-medium hover:underline">
                      Trámite N° {t.numero}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {t.empresa} · {t.tipo}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-[#8a3626] dark:text-[#e0a99c]">
                    Vence {t.fecha_vigencia_hasta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Últimos trámites</CardTitle>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/tramites">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ultimos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay trámites registrados.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {ultimos.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/tramites/${t.id}`} className="font-medium hover:underline">
                      N° {t.numero} · {t.empresa}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">{t.tipo}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PaisBadge pais={t.pais} />
                    <EstadoTramiteBadge estado={t.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
