import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vehiculos, empresas_cliente } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cambiarEstadoVehiculo } from '@/actions/vehiculos'

const etiquetaEstado: Record<string, string> = {
  habilitado: 'Habilitado',
  inhabilitado: 'Inhabilitado',
  suspendido: 'Suspendido',
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
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Vehículos</h1>
        <Button asChild>
          <Link href="/vehiculos/nueva">Nuevo vehículo</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell>{v.patente}</TableCell>
              <TableCell>{v.empresa_razon_social}</TableCell>
              <TableCell>{v.pais_matricula}</TableCell>
              <TableCell>{v.tipo_vehiculo}</TableCell>
              <TableCell>{etiquetaEstado[v.estado]}</TableCell>
              <TableCell style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="secondary" asChild>
                  <Link href={`/vehiculos/${v.id}`}>Editar</Link>
                </Button>
                {v.estado === 'habilitado' ? (
                  <form action={cambiarEstadoVehiculo.bind(null, v.id, 'inhabilitado')}>
                    <Button variant="secondary" type="submit">Inhabilitar</Button>
                  </form>
                ) : (
                  <form action={cambiarEstadoVehiculo.bind(null, v.id, 'habilitado')}>
                    <Button variant="secondary" type="submit">Habilitar</Button>
                  </form>
                )}
              </TableCell>
            </TableRow>
          ))}
          {filas.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                Aún no hay vehículos registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
