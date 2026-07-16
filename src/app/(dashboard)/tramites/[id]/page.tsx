import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tramites, tramite_vehiculos, vehiculos } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { cambiarEstadoTramite } from '@/actions/tramites'

const etiquetaEstado: Record<string, string> = {
  en_curso: 'En curso',
  pendiente_observado: 'Pendiente / observado',
  concluido: 'Concluido',
  anulado: 'Anulado',
}

export default async function PaginaDetalleTramite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const tramite = await db.query.tramites.findFirst({
    where: eq(tramites.id, id),
    with: {
      empresa: true,
      tipoTramite: true,
    },
  })

  if (!tramite) notFound()

  const vehiculosDelTramite = await db
    .select({ id: vehiculos.id, patente: vehiculos.patente })
    .from(tramite_vehiculos)
    .innerJoin(vehiculos, eq(tramite_vehiculos.vehiculo_id, vehiculos.id))
    .where(eq(tramite_vehiculos.tramite_id, tramite.id))

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <h1>Trámite N° {tramite.numero}</h1>

      <dl style={{ display: 'grid', gridTemplateColumns: '200px 1fr', rowGap: 8 }}>
        <dt>Empresa</dt>
        <dd>{tramite.empresa.razon_social}</dd>

        <dt>Tipo de trámite</dt>
        <dd>{tramite.tipoTramite.nombre}</dd>

        <dt>País</dt>
        <dd>{tramite.pais}</dd>

        <dt>Estado</dt>
        <dd>{etiquetaEstado[tramite.estado]}</dd>

        <dt>Monto</dt>
        <dd>{tramite.monto_total} {tramite.moneda}</dd>

        <dt>Fecha de solicitud</dt>
        <dd>{tramite.fecha_solicitud}</dd>

        <dt>Vehículos</dt>
        <dd>
          {vehiculosDelTramite.length > 0
            ? vehiculosDelTramite.map((v) => v.patente).join(', ')
            : '—'}
        </dd>

        {tramite.notas && (
          <>
            <dt>Notas</dt>
            <dd>{tramite.notas}</dd>
          </>
        )}
      </dl>

      {tramite.estado !== 'concluido' && tramite.estado !== 'anulado' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          {tramite.estado === 'en_curso' && (
            <form action={cambiarEstadoTramite.bind(null, tramite.id, 'pendiente_observado')}>
              <Button variant="secondary" type="submit">Marcar pendiente/observado</Button>
            </form>
          )}
          {tramite.estado === 'pendiente_observado' && (
            <form action={cambiarEstadoTramite.bind(null, tramite.id, 'en_curso')}>
              <Button variant="secondary" type="submit">Volver a en curso</Button>
            </form>
          )}
          <form action={cambiarEstadoTramite.bind(null, tramite.id, 'concluido')}>
            <Button type="submit">Marcar concluido</Button>
          </form>
          <form action={cambiarEstadoTramite.bind(null, tramite.id, 'anulado')}>
            <Button variant="secondary" type="submit">Anular</Button>
          </form>
        </div>
      )}
    </div>
  )
}
