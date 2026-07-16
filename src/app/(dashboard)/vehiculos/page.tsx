import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vehiculos, empresas_cliente } from '@/lib/db/schema'
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
import { EstadoVehiculoBadge, PaisBadge } from '@/components/estados/estado-badges'
import { cambiarEstadoVehiculo } from '@/actions/vehiculos'

const etiquetaTipo: Record<string, string> = {
  carga: 'Carga',
  pasajeros: 'Pasajeros',
}

export default async function PaginaVehiculos() {
  const filas = await db
    .select({
      id: vehiculos.id,
      patente: vehiculos.patente,
      pais_matricula: vehiculos.pais_matricula,
      tipo_vehiculo: vehiculos.tipo_vehiculo,
      estado: vehiculos.estado,
      empresa_razon_social: empresas_cliente.razon_social,
    })
    .from(vehiculos)
    .innerJoin(empresas_cliente, eq(vehiculos.empresa_id, empresas_cliente.id))
    .orderBy(desc(vehiculos.created_at))

  return (
    <div>
      <PageHeader titulo="Vehículos" descripcion="Parque automotor habilitado por empresa">
        <Button variant="secondary" asChild>
          <Link href="/vehiculos/importar">Importar desde PDF</Link>
        </Button>
        <Button asChild>
          <Link href="/vehiculos/nueva">Nuevo vehículo</Link>
        </Button>
      </PageHeader>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Patente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium tabular-nums">{v.patente}</TableCell>
                <TableCell>{v.empresa_razon_social}</TableCell>
                <TableCell>
                  <PaisBadge pais={v.pais_matricula} />
                </TableCell>
                <TableCell>{etiquetaTipo[v.tipo_vehiculo] ?? v.tipo_vehiculo}</TableCell>
                <TableCell>
                  <EstadoVehiculoBadge estado={v.estado} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/vehiculos/${v.id}`}>Editar</Link>
                    </Button>
                    {v.estado === 'habilitado' ? (
                      <form action={cambiarEstadoVehiculo.bind(null, v.id, 'inhabilitado')}>
                        <Button variant="secondary" size="sm" type="submit">Inhabilitar</Button>
                      </form>
                    ) : (
                      <form action={cambiarEstadoVehiculo.bind(null, v.id, 'habilitado')}>
                        <Button variant="secondary" size="sm" type="submit">Habilitar</Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aún no hay vehículos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
