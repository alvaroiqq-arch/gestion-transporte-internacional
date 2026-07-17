import Link from 'next/link'
import { and, count, eq, gte, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { crearClienteServidor } from '@/lib/supabase/server'
import {
  empresas_cliente,
  vehiculos,
  tramites,
  tipos_tramite,
  usuarios,
  pagos,
  remesas,
} from '@/lib/db/schema'
import { sumarPorMoneda, calcularMontoNeto } from '@/lib/calculos/remesas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    ? await db.query.usuarios.findFirst({ where: (usuarios, { eq }) => eq(usuarios.supabase_auth_id, user.id) })
    : null

  const hoy = new Date().toISOString().slice(0, 10)
  const en30 = sumarDias(hoy, 30)

  const [
    [{ n: empresasActivas }],
    [{ n: vehiculosHabilitados }],
    [{ n: tramitesEnCurso }],
    [{ n: tramitesObservados }],
    porVencer,
    remesasEnTransito,
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
    // Remesas ya enviadas pero cuya recepción en Bolivia aún no se confirmó
    db
      .select({
        id: remesas.id,
        numero: remesas.numero,
        moneda: remesas.moneda,
        comision: remesas.comision,
        fecha_envio: remesas.fecha_envio,
        monto: pagos.monto,
      })
      .from(remesas)
      .innerJoin(pagos, eq(pagos.remesa_id, remesas.id))
      .where(eq(remesas.estado, 'enviada')),
  ])

  const pagosPorRemesa = new Map<string, typeof remesasEnTransito>()
  for (const r of remesasEnTransito) {
    const grupo = pagosPorRemesa.get(r.id) ?? []
    grupo.push(r)
    pagosPorRemesa.set(r.id, grupo)
  }
  const listaRemesasEnTransito = [...pagosPorRemesa.entries()].map(([id, filas]) => {
    const totalRecaudado = sumarPorMoneda(filas)[filas[0].moneda] ?? '0'
    return {
      id,
      numero: filas[0].numero,
      moneda: filas[0].moneda,
      fecha_envio: filas[0].fecha_envio,
      montoNeto: calcularMontoNeto(totalRecaudado, filas[0].comision, filas[0].moneda),
    }
  })

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
          <CardTitle>Remesas en tránsito</CardTitle>
        </CardHeader>
        <CardContent>
          {listaRemesasEnTransito.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay envíos esperando confirmación de Bolivia.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {listaRemesasEnTransito.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/remesas/${r.id}`} className="font-medium hover:underline">
                      Remesa N° {r.numero}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">Enviada {r.fecha_envio}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {r.montoNeto} {r.moneda}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
