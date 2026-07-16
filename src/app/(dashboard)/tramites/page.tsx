import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tramites, empresas_cliente, tipos_tramite } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const etiquetaEstado: Record<string, string> = {
  en_curso: 'En curso',
  pendiente_observado: 'Pendiente / observado',
  concluido: 'Concluido',
  anulado: 'Anulado',
}

export default async function PaginaTramites() {
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
    .orderBy(desc(tramites.numero))

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Trámites</h1>
        <Button asChild>
          <Link href="/tramites/nuevo">Nuevo trámite</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell>{t.numero}</TableCell>
              <TableCell>{t.empresa_razon_social}</TableCell>
              <TableCell>{t.tipo_nombre}</TableCell>
              <TableCell>{t.pais}</TableCell>
              <TableCell>{t.monto_total} {t.moneda}</TableCell>
              <TableCell>{t.fecha_solicitud}</TableCell>
              <TableCell>{etiquetaEstado[t.estado]}</TableCell>
              <TableCell style={{ textAlign: 'right' }}>
                <Button variant="secondary" asChild>
                  <Link href={`/tramites/${t.id}`}>Ver</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filas.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                Aún no hay trámites registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
