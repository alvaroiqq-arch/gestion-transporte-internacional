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
import { FiltroEmpresa } from '@/components/vehiculos/filtro-empresa'

export default async function PaginaVehiculos({
  searchParams,
}: {
  searchParams: Promise<{ empresa_id?: string }>
}) {
  const { empresa_id: empresaId } = await searchParams

  const [empresas, filas] = await Promise.all([
    db
      .select({ id: empresas_cliente.id, razon_social: empresas_cliente.razon_social })
      .from(empresas_cliente)
      .orderBy(empresas_cliente.razon_social),
    db
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
      .where(empresaId ? eq(vehiculos.empresa_id, empresaId) : undefined)
      .orderBy(desc(vehiculos.created_at)),
  ])

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

      <div className="mb-4">
        <FiltroEmpresa empresas={empresas} />
      </div>

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
                <TableCell>{v.tipo_vehiculo}</TableCell>
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
                  {empresaId ? 'Esta empresa no tiene vehículos registrados.' : 'Aún no hay vehículos registrados.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
