import Link from 'next/link'
import { desc, eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tramites, empresas_cliente, tipos_tramite, usuarios } from '@/lib/db/schema'
import { crearClienteServidor } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'
import { EstadoTramiteBadge, PaisBadge } from '@/components/estados/estado-badges'

export default async function PaginaTramites() {
  // Obtener usuario actual para filtrar por país
  const supabase = await crearClienteServidor()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let usuarioActual = null
  if (authUser) {
    usuarioActual = await db.query.usuarios.findFirst({
      where: eq(usuarios.supabase_auth_id, authUser.id),
    })
  }

  // Construir condición de filtro por país
  const conditions = []
  if (usuarioActual?.pais_gestion) {
    conditions.push(eq(tramites.pais, usuarioActual.pais_gestion))
  }

  const filas = await db
    .select({
      id: tramites.id,
      numero: tramites.numero,
      estado: tramites.estado,
      pais: tramites.pais,
      monto_total: tramites.monto_total,
      moneda: tramites.moneda,
      fecha_solicitud: tramites.fecha_solicitud,
      empresa_razon_social: empresas_cliente.razon_social,
      tipo_nombre: tipos_tramite.nombre,
    })
    .from(tramites)
    .innerJoin(empresas_cliente, eq(tramites.empresa_id, empresas_cliente.id))
    .innerJoin(tipos_tramite, eq(tramites.tipo_tramite_id, tipos_tramite.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tramites.numero))

  return (
    <div>
      <PageHeader titulo="Trámites" descripcion="Gestiones ante la autoridad de Chile y Bolivia">
        <Button asChild>
          <Link href="/tramites/nuevo">Nuevo trámite</Link>
        </Button>
      </PageHeader>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>N°</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha solicitud</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium tabular-nums">{t.numero}</TableCell>
                <TableCell>{t.empresa_razon_social}</TableCell>
                <TableCell>{t.tipo_nombre}</TableCell>
                <TableCell>
                  <PaisBadge pais={t.pais} />
                </TableCell>
                <TableCell className="tabular-nums">{t.monto_total} {t.moneda}</TableCell>
                <TableCell className="tabular-nums">{t.fecha_solicitud}</TableCell>
                <TableCell>
                  <EstadoTramiteBadge estado={t.estado} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/tramites/${t.id}`}>Ver</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Aún no hay trámites registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
